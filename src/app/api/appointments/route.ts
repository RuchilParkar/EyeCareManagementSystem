import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { patientBookAppointmentSchema, adminBookAppointmentSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req.headers);

    const { searchParams } = new URL(req.url);
    const doctorIdParam = searchParams.get('doctorId');
    const patientIdParam = searchParams.get('patientId');
    const dateParam = searchParams.get('date');
    const statusParam = searchParams.get('status');

    let whereClause: any = {};

    if (user.role === 'PATIENT') {
      // Patients can ONLY view their own appointments
      let resolvedPatientId = user.patientId;
      if (!resolvedPatientId) {
        const pat = await prisma.patient.findUnique({ where: { userId: user.id } });
        resolvedPatientId = pat?.id;
      }
      if (!resolvedPatientId) {
        return NextResponse.json({ success: true, data: [] });
      }
      whereClause.patientId = resolvedPatientId;
    } else if (user.role === 'DOCTOR') {
      // Doctors view assigned appointments by default
      let resolvedDoctorId = user.doctorId;
      if (!resolvedDoctorId) {
        const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
        resolvedDoctorId = doc?.id;
      }
      if (resolvedDoctorId) {
        whereClause.doctorId = resolvedDoctorId;
      }
    } else if (user.role === 'ADMIN') {
      // Admin can filter by patientId or doctorId if provided
      if (patientIdParam) whereClause.patientId = patientIdParam;
      if (doctorIdParam) whereClause.doctorId = doctorIdParam;
    }

    if (dateParam) {
      whereClause.appointmentDate = dateParam;
    }
    if (statusParam && statusParam !== 'ALL' && statusParam !== 'all') {
      whereClause.status = statusParam.toUpperCase();
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            uhid: true,
            patientNumber: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        opdToken: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = appointments.map((apt) => ({
      id: apt.id,
      patientId: apt.patientId,
      doctorId: apt.doctorId,
      departmentId: apt.departmentId,
      appointmentDate: apt.appointmentDate,
      startTime: apt.startTime,
      endTime: apt.endTime,
      type: apt.type,
      status: apt.status,
      reason: apt.reason,
      tokenNumber: apt.tokenNumber || apt.opdToken?.tokenNumber,
      notes: apt.notes,
      fee: apt.fee,
      createdAt: apt.createdAt.toISOString(),
      updatedAt: apt.updatedAt.toISOString(),
      patientName: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : 'Patient',
      doctorName: apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : 'Doctor',
      serviceName: apt.type ? apt.type.replace('_', ' ') : 'General Consultation',
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve appointments.' } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req.headers);

    if (user.role === 'DOCTOR') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Doctors cannot create appointments directly.' } },
        { status: 403 }
      );
    }

    const body = await req.json();

    let targetPatientId: string;
    let validatedData: any;

    if (user.role === 'PATIENT') {
      const parsed = patientBookAppointmentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
          { status: 400 }
        );
      }
      validatedData = parsed.data;

      // DERIVE patientId exclusively from authenticated user session
      let resolvedPatId = user.patientId;
      if (!resolvedPatId) {
        const dbPatient = await prisma.patient.findUnique({ where: { userId: user.id } });
        resolvedPatId = dbPatient?.id;
      }

      if (!resolvedPatId) {
        return NextResponse.json(
          { success: false, error: { code: 'PATIENT_NOT_FOUND', message: 'Patient profile not found for this account. Complete onboarding first.' } },
          { status: 400 }
        );
      }
      targetPatientId = resolvedPatId;
    } else {
      // ADMIN booking
      const parsed = adminBookAppointmentSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
          { status: 400 }
        );
      }
      validatedData = parsed.data;
      targetPatientId = validatedData.patientId;
    }

    // Execute Transaction for Concurrency-Safe Slot Conflict Protection & OPD Token Generation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify Patient exists
      const dbPatient = await tx.patient.findUnique({ where: { id: targetPatientId } });
      if (!dbPatient) {
        throw new Error('PATIENT_RECORD_NOT_FOUND');
      }

      // 2. Verify Doctor exists
      const dbDoctor = await tx.doctor.findUnique({
        where: { id: validatedData.doctorId },
        include: { department: true },
      });
      if (!dbDoctor) {
        throw new Error('DOCTOR_RECORD_NOT_FOUND');
      }

      // 3. Concurrency & Slot Conflict Protection
      const slotConflict = await tx.appointment.findFirst({
        where: {
          doctorId: validatedData.doctorId,
          appointmentDate: validatedData.appointmentDate,
          startTime: validatedData.startTime,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      });

      if (slotConflict) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      // 4. Calculate OPD Sequence & Token
      const existingTokenCount = await tx.oPDToken.count({
        where: {
          doctorId: validatedData.doctorId,
          tokenDate: validatedData.appointmentDate,
        },
      });

      const sequenceNumber = existingTokenCount + 1;
      const tokenNumber = `OPD-${sequenceNumber.toString().padStart(3, '0')}`;

      const appointmentStatus = user.role === 'ADMIN' && validatedData.status ? validatedData.status : 'CONFIRMED';
      const fee = validatedData.fee || 500;
      const deptId = validatedData.departmentId || dbDoctor.departmentId;

      // 5. Create Appointment Record
      const newAppointment = await tx.appointment.create({
        data: {
          patientId: targetPatientId,
          doctorId: validatedData.doctorId,
          departmentId: deptId,
          appointmentDate: validatedData.appointmentDate,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime || '10:30',
          type: validatedData.type || 'NEW_CONSULTATION',
          status: appointmentStatus,
          reason: validatedData.reason,
          tokenNumber: tokenNumber,
          notes: validatedData.notes,
          fee: fee,
        },
      });

      // 6. Create Associated OPDToken Record
      await tx.oPDToken.create({
        data: {
          appointmentId: newAppointment.id,
          patientId: targetPatientId,
          doctorId: validatedData.doctorId,
          tokenNumber: tokenNumber,
          sequenceNumber: sequenceNumber,
          tokenDate: validatedData.appointmentDate,
          status: 'WAITING',
        },
      });

      // 7. Write Security & HIPAA Audit Event
      await logAuditEvent({
        actorUserId: user.id,
        userName: user.email,
        userRole: user.role,
        action: 'APPOINTMENT_BOOKED',
        entityType: 'Appointment',
        entityId: newAppointment.id,
        target: `Doctor: Dr. ${dbDoctor.firstName} ${dbDoctor.lastName} (${validatedData.appointmentDate} ${validatedData.startTime})`,
      });

      return {
        ...newAppointment,
        patientName: `${dbPatient.firstName} ${dbPatient.lastName}`,
        doctorName: `Dr. ${dbDoctor.firstName} ${dbDoctor.lastName}`,
        serviceName: validatedData.type ? validatedData.type.replace('_', ' ') : 'General Consultation',
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === 'SLOT_ALREADY_BOOKED') {
      return NextResponse.json(
        { success: false, error: { code: 'SLOT_CONFLICT', message: 'The requested appointment time slot has already been booked. Please choose another slot.' } },
        { status: 409 }
      );
    }
    if (error.message === 'PATIENT_RECORD_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Patient record not found.' } },
        { status: 400 }
      );
    }
    if (error.message === 'DOCTOR_RECORD_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Doctor record not found.' } },
        { status: 400 }
      );
    }
    if (error.statusCode) {
      return NextResponse.json(
        { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to book appointment.' } },
      { status: 500 }
    );
  }
}

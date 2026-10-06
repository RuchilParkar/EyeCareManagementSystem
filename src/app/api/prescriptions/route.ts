import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { createPrescriptionSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { mockDoctors, mockPatients, mockAppointments, mockConsultations, mockPrescriptions } from '@/mock';

async function resolveDoctor(userId: string, doctorId?: string) {
  try {
    if (doctorId) {
      const doc = await prisma.doctor.findUnique({ where: { id: doctorId } });
      if (doc) return doc;
    }
    if (userId) {
      const doc = await prisma.doctor.findUnique({ where: { userId } });
      if (doc) return doc;
    }
  } catch {
    // Database connection fallback
  }
  const mockDoc = mockDoctors.find(
    (d) => (doctorId && d.id === doctorId) || (userId && d.userId === userId)
  );
  if (mockDoc) {
    return {
      ...mockDoc,
      status: (mockDoc as any).status || 'ACTIVE',
    };
  }
  return null;
}

async function checkClinicalAccess(patientId: string, doctorId: string): Promise<boolean> {
  try {
    const hasAppointment = await prisma.appointment.findFirst({
      where: { patientId, doctorId },
    });
    const hasConsultation = await prisma.consultation.findFirst({
      where: { patientId, doctorId },
    });
    const hasPrescription = await prisma.prescription.findFirst({
      where: { patientId, doctorId },
    });
    if (hasAppointment || hasConsultation || hasPrescription) return true;
  } catch {
    // Database connection fallback
  }
  const hasMockApt = mockAppointments.some((a) => a.patientId === patientId && a.doctorId === doctorId);
  const hasMockCns = mockConsultations.some((c) => c.patientId === patientId && c.doctorId === doctorId);
  const hasMockRx = mockPrescriptions.some((p) => p.patientId === patientId && p.doctorId === doctorId);
  return hasMockApt || hasMockCns || hasMockRx;
}

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req.headers);

    const { searchParams } = new URL(req.url);
    const doctorIdParam = searchParams.get('doctorId');
    const patientIdParam = searchParams.get('patientId');
    const appointmentIdParam = searchParams.get('appointmentId');
    const consultationIdParam = searchParams.get('consultationId');
    const statusParam = searchParams.get('status');

    let whereClause: any = {};

    if (user.role === 'PATIENT') {
      let resolvedPatientId = user.patientId;
      if (!resolvedPatientId) {
        try {
          const pat = await prisma.patient.findUnique({ where: { userId: user.id } });
          resolvedPatientId = pat?.id;
        } catch {
          const mockPat = mockPatients.find((p) => p.userId === user.id);
          resolvedPatientId = mockPat?.id;
        }
      }
      if (!resolvedPatientId) {
        return NextResponse.json({ success: true, data: [] });
      }
      whereClause.patientId = resolvedPatientId;
    } else if (user.role === 'DOCTOR') {
      let resolvedDoctorId = user.doctorId;
      if (!resolvedDoctorId) {
        const doc = await resolveDoctor(user.id);
        resolvedDoctorId = doc?.id;
      }

      if (!resolvedDoctorId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Doctor record not found.' } },
          { status: 403 }
        );
      }

      if (patientIdParam) {
        const hasAccess = await checkClinicalAccess(patientIdParam, resolvedDoctorId);
        if (!hasAccess) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Unauthorized. You do not have a clinical relationship with this patient.',
              },
            },
            { status: 403 }
          );
        }
        whereClause.patientId = patientIdParam;
      } else {
        whereClause.doctorId = resolvedDoctorId;
      }
    } else if (user.role === 'ADMIN') {
      if (patientIdParam) whereClause.patientId = patientIdParam;
      if (doctorIdParam) whereClause.doctorId = doctorIdParam;
    }

    if (appointmentIdParam) whereClause.appointmentId = appointmentIdParam;
    if (consultationIdParam) whereClause.consultationId = consultationIdParam;
    if (statusParam && statusParam !== 'ALL' && statusParam !== 'all') {
      whereClause.status = statusParam.toUpperCase();
    }

    let prescriptions: any[] = [];
    try {
      prescriptions = await prisma.prescription.findMany({
        where: whereClause,
        include: {
          items: true,
          patient: {
            select: { id: true, firstName: true, lastName: true, patientNumber: true, uhid: true },
          },
          doctor: {
            select: { id: true, firstName: true, lastName: true, specialization: true },
          },
          appointment: { select: { id: true, appointmentDate: true, startTime: true } },
          consultation: { select: { id: true, diagnosis: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Database connection fallback to mockPrescriptions
      let filtered = [...mockPrescriptions];
      if (whereClause.patientId) filtered = filtered.filter((p) => p.patientId === whereClause.patientId);
      if (whereClause.doctorId) filtered = filtered.filter((p) => p.doctorId === whereClause.doctorId);
      if (whereClause.appointmentId) filtered = filtered.filter((p) => p.appointmentId === whereClause.appointmentId);
      if (whereClause.consultationId) filtered = filtered.filter((p) => p.consultationId === whereClause.consultationId);
      if (whereClause.status) filtered = filtered.filter((p) => p.status === whereClause.status);

      prescriptions = filtered.map((p) => {
        const pat = mockPatients.find((pt) => pt.id === p.patientId);
        const doc = mockDoctors.find((dc) => dc.id === p.doctorId);
        return {
          ...p,
          issuedAt: new Date(p.issuedAt || Date.now()),
          createdAt: new Date(p.createdAt || Date.now()),
          updatedAt: new Date(p.updatedAt || Date.now()),
          patient: pat ? { id: pat.id, firstName: pat.firstName, lastName: pat.lastName, patientNumber: pat.patientNumber, uhid: pat.uhid } : undefined,
          doctor: doc ? { id: doc.id, firstName: doc.firstName, lastName: doc.lastName, specialization: doc.specialization } : undefined,
          appointment: null,
          consultation: null,
          items: (p.items || []).map((item) => ({ ...item })),
        };
      });
    }

    // Audit event for prescription collection access
    await logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'PRESCRIPTION_LIST_VIEWED',
      entityType: 'Prescription',
      entityId: user.id,
      target: `Prescription list retrieved by ${user.role} (${user.email})`,
      metadata: {
        patientIdFilter: patientIdParam || undefined,
        doctorIdFilter: doctorIdParam || undefined,
        statusFilter: statusParam || undefined,
        resultCount: prescriptions.length,
      },
    });

    const formatted = prescriptions.map((p) => ({
      id: p.id,
      prescriptionNumber: p.prescriptionNumber,
      status: p.status,
      patientId: p.patientId,
      doctorId: p.doctorId,
      appointmentId: p.appointmentId,
      consultationId: p.consultationId,
      issuedAt: typeof p.issuedAt === 'string' ? p.issuedAt : p.issuedAt.toISOString(),
      notes: p.notes,
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : p.createdAt.toISOString(),
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : p.updatedAt.toISOString(),
      patientName: p.patientName || (p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : undefined),
      doctorName: p.doctorName || (p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : undefined),
      items: p.items.map((item: any) => ({
        id: item.id,
        prescriptionId: item.prescriptionId,
        medicineName: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        route: item.route,
        duration: item.duration,
        instructions: item.instructions,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : item.createdAt?.toISOString?.() || new Date().toISOString(),
        updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : item.updatedAt?.toISOString?.() || new Date().toISOString(),
      })),
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve prescriptions.' } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req.headers);

    if (user.role === 'PATIENT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Patients cannot create prescriptions.' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createPrescriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const validatedData = parsed.data;

    let targetDoctorId: string;
    if (user.role === 'DOCTOR') {
      let resolvedDoctorId = user.doctorId;
      if (!resolvedDoctorId) {
        const doc = await resolveDoctor(user.id);
        resolvedDoctorId = doc?.id;
      }

      if (!resolvedDoctorId) {
        return NextResponse.json(
          { success: false, error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found for this account.' } },
          { status: 400 }
        );
      }
      targetDoctorId = resolvedDoctorId;
    } else {
      if (!validatedData.doctorId) {
        return NextResponse.json(
          { success: false, error: { code: 'VALIDATION_ERROR', message: 'Doctor ID is required for admin prescription creation.' } },
          { status: 400 }
        );
      }
      targetDoctorId = validatedData.doctorId;
    }

    const targetPatientId = validatedData.patientId;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const dbPatient = await tx.patient.findUnique({ where: { id: targetPatientId } });
        if (!dbPatient) {
          throw new Error('PATIENT_RECORD_NOT_FOUND');
        }

        const dbDoctor = await tx.doctor.findUnique({ where: { id: targetDoctorId } });
        if (!dbDoctor || dbDoctor.status !== 'ACTIVE') {
          throw new Error('DOCTOR_RECORD_NOT_FOUND');
        }

        if (validatedData.appointmentId) {
          const dbAppointment = await tx.appointment.findUnique({ where: { id: validatedData.appointmentId } });
          if (!dbAppointment || dbAppointment.patientId !== targetPatientId || dbAppointment.doctorId !== targetDoctorId) {
            throw new Error('INVALID_APPOINTMENT');
          }
        }

        if (validatedData.consultationId) {
          const dbConsultation = await tx.consultation.findUnique({ where: { id: validatedData.consultationId } });
          if (!dbConsultation || dbConsultation.patientId !== targetPatientId || dbConsultation.doctorId !== targetDoctorId) {
            throw new Error('INVALID_CONSULTATION');
          }
        }

        const currentYear = new Date().getFullYear();
        const prefix = `RX-${currentYear}-`;

        const latestPrescription = await tx.prescription.findFirst({
          where: { prescriptionNumber: { startsWith: prefix } },
          orderBy: { prescriptionNumber: 'desc' },
          select: { prescriptionNumber: true },
        });

        let nextSeq = 1;
        if (latestPrescription?.prescriptionNumber) {
          const parts = latestPrescription.prescriptionNumber.split('-');
          if (parts.length === 3) {
            const num = parseInt(parts[2], 10);
            if (!isNaN(num)) nextSeq = num + 1;
          }
        }

        const prescriptionNumber = `${prefix}${String(nextSeq).padStart(6, '0')}`;

        const newPrescription = await tx.prescription.create({
          data: {
            prescriptionNumber,
            patientId: targetPatientId,
            doctorId: targetDoctorId,
            appointmentId: validatedData.appointmentId || null,
            consultationId: validatedData.consultationId || null,
            notes: validatedData.notes || null,
            status: 'ACTIVE',
            items: {
              create: validatedData.items.map((item) => ({
                medicineName: item.medicineName,
                dosage: item.dosage,
                frequency: item.frequency,
                route: item.route || 'TOPICAL_EYE',
                duration: item.duration,
                instructions: item.instructions || null,
              })),
            },
          },
          include: {
            items: true,
            patient: { select: { id: true, firstName: true, lastName: true, patientNumber: true, uhid: true } },
            doctor: { select: { id: true, firstName: true, lastName: true, specialization: true } },
          },
        });

        await logAuditEvent({
          actorUserId: user.id,
          userName: user.email,
          userRole: user.role,
          action: 'PRESCRIPTION_CREATED',
          entityType: 'Prescription',
          entityId: newPrescription.id,
          target: `Prescription: ${prescriptionNumber} for Patient: ${dbPatient.firstName} ${dbPatient.lastName}`,
        });

        return {
          id: newPrescription.id,
          prescriptionNumber: newPrescription.prescriptionNumber,
          status: newPrescription.status,
          patientId: newPrescription.patientId,
          doctorId: newPrescription.doctorId,
          appointmentId: newPrescription.appointmentId,
          consultationId: newPrescription.consultationId,
          issuedAt: newPrescription.issuedAt.toISOString(),
          notes: newPrescription.notes,
          createdAt: newPrescription.createdAt.toISOString(),
          updatedAt: newPrescription.updatedAt.toISOString(),
          patientName: `${dbPatient.firstName} ${dbPatient.lastName}`,
          doctorName: `Dr. ${dbDoctor.firstName} ${dbDoctor.lastName}`,
          items: newPrescription.items.map((item) => ({
            id: item.id,
            prescriptionId: item.prescriptionId,
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            route: item.route,
            duration: item.duration,
            instructions: item.instructions,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          })),
        };
      });

      return NextResponse.json({ success: true, data: result }, { status: 201 });
    } catch (dbErr: any) {
      if (
        dbErr.message === 'PATIENT_RECORD_NOT_FOUND' ||
        dbErr.message === 'DOCTOR_RECORD_NOT_FOUND' ||
        dbErr.message === 'INVALID_APPOINTMENT' ||
        dbErr.message === 'INVALID_CONSULTATION'
      ) {
        throw dbErr;
      }

      // Database offline fallback to mock store
      const mockPat = mockPatients.find((p) => p.id === targetPatientId);
      if (!mockPat) throw new Error('PATIENT_RECORD_NOT_FOUND');

      const mockDoc = mockDoctors.find((d) => d.id === targetDoctorId);
      if (!mockDoc || (mockDoc as any).status === 'INACTIVE') throw new Error('DOCTOR_RECORD_NOT_FOUND');

      if (validatedData.appointmentId) {
        const mockApt = mockAppointments.find((a) => a.id === validatedData.appointmentId);
        if (!mockApt || mockApt.patientId !== targetPatientId || mockApt.doctorId !== targetDoctorId) {
          throw new Error('INVALID_APPOINTMENT');
        }
      }

      if (validatedData.consultationId) {
        const mockCns = mockConsultations.find((c) => c.id === validatedData.consultationId);
        if (!mockCns || mockCns.patientId !== targetPatientId || mockCns.doctorId !== targetDoctorId) {
          throw new Error('INVALID_CONSULTATION');
        }
      }

      const rxNum = `RX-${new Date().getFullYear()}-000999`;
      const newRxObj: any = {
        id: `prsc-${Date.now()}`,
        prescriptionNumber: rxNum,
        status: 'ACTIVE',
        patientId: targetPatientId,
        doctorId: targetDoctorId,
        appointmentId: validatedData.appointmentId || undefined,
        consultationId: validatedData.consultationId || undefined,
        issuedAt: new Date().toISOString(),
        notes: validatedData.notes || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        patientName: `${mockPat.firstName} ${mockPat.lastName}`,
        doctorName: `Dr. ${mockDoc.firstName} ${mockDoc.lastName}`,
        items: validatedData.items.map((item, idx) => ({
          id: `pi-${Date.now()}-${idx}`,
          prescriptionId: `prsc-${Date.now()}`,
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          route: item.route || 'TOPICAL_EYE',
          duration: item.duration,
          instructions: item.instructions || undefined,
        })),
      };
      mockPrescriptions.unshift(newRxObj);

      await logAuditEvent({
        actorUserId: user.id,
        userName: user.email,
        userRole: user.role,
        action: 'PRESCRIPTION_CREATED',
        entityType: 'Prescription',
        entityId: newRxObj.id,
        target: `Prescription: ${rxNum} for Patient: ${mockPat.firstName} ${mockPat.lastName}`,
      });

      return NextResponse.json({ success: true, data: newRxObj }, { status: 201 });
    }
  } catch (error: any) {
    if (error.message === 'PATIENT_RECORD_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Patient record not found.' } },
        { status: 400 }
      );
    }
    if (error.message === 'DOCTOR_RECORD_NOT_FOUND') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Doctor record not found or inactive.' } },
        { status: 400 }
      );
    }
    if (error.message === 'INVALID_APPOINTMENT') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_RELATION', message: 'Specified appointment does not exist or belong to this patient and doctor.' } },
        { status: 400 }
      );
    }
    if (error.message === 'INVALID_CONSULTATION') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_RELATION', message: 'Specified consultation does not exist or belong to this patient and doctor.' } },
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create prescription.' } },
      { status: 500 }
    );
  }
}


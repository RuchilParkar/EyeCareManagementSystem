import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { createConsultationSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import {
  mockDoctors,
  mockPatients,
  mockAppointments,
  mockConsultations,
  mockPrescriptions,
  mockAuditLogs,
} from '@/mock';

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
      if (patientIdParam && patientIdParam !== resolvedPatientId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: "Forbidden. You do not have permission to view another patient's consultations.",
            },
          },
          { status: 403 }
        );
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
    if (statusParam && statusParam !== 'ALL' && statusParam !== 'all') {
      whereClause.status = statusParam.toUpperCase();
    }

    let consultations: any[] = [];
    try {
      consultations = await prisma.consultation.findMany({
        where: whereClause,
        include: {
          patient: {
            select: { id: true, firstName: true, lastName: true, patientNumber: true, uhid: true },
          },
          doctor: {
            select: { id: true, firstName: true, lastName: true, specialization: true },
          },
          appointment: { select: { id: true, appointmentDate: true, startTime: true } },
          prescription: { include: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Fallback to mock store
      let filtered = [...mockConsultations];
      if (whereClause.patientId) filtered = filtered.filter((c) => c.patientId === whereClause.patientId);
      if (whereClause.doctorId) filtered = filtered.filter((c) => c.doctorId === whereClause.doctorId);
      if (whereClause.appointmentId) filtered = filtered.filter((c) => c.appointmentId === whereClause.appointmentId);
      if (whereClause.status) {
        filtered = filtered.filter(
          (c) => (c.status || '').toUpperCase() === whereClause.status
        );
      }
      consultations = filtered.map((c) => {
        const pObj = mockPatients.find((p) => p.id === c.patientId);
        const dObj = mockDoctors.find((d) => d.id === c.doctorId);
        const aObj = mockAppointments.find((a) => a.id === c.appointmentId);
        const rxObj = mockPrescriptions.find((rx) => rx.consultationId === c.id);
        return {
          ...c,
          patient: pObj ? { id: pObj.id, firstName: pObj.firstName, lastName: pObj.lastName } : null,
          doctor: dObj ? { id: dObj.id, firstName: dObj.firstName, lastName: dObj.lastName } : null,
          appointment: aObj ? { id: aObj.id, appointmentDate: aObj.appointmentDate } : null,
          prescription: rxObj || null,
        };
      });
    }

    await logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'CONSULTATION_VIEWED',
      entityType: 'Consultation',
      entityId: 'collection',
      target: `Consultation collection viewed (count: ${consultations.length})`,
    });

    return NextResponse.json({
      success: true,
      data: consultations,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve consultations.' } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req.headers);

    if (user.role === 'PATIENT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Patients are forbidden from creating consultations.' } },
        { status: 403 }
      );
    }

    let resolvedDoctorId: string | undefined;
    if (user.role === 'DOCTOR') {
      const doc = await resolveDoctor(user.id, user.doctorId);
      if (!doc || doc.status !== 'ACTIVE') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Forbidden. Inactive doctors cannot create consultations.',
            },
          },
          { status: 403 }
        );
      }
      resolvedDoctorId = doc.id;
    }

    const body = await req.json();
    const parsed = createConsultationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const validatedData = parsed.data;
    const targetStatus = (validatedData.status || 'COMPLETED').toUpperCase();

    let targetPatientId = validatedData.patientId;
    let targetDoctorId = user.role === 'DOCTOR' ? resolvedDoctorId! : validatedData.doctorId || resolvedDoctorId;

    if (user.role === 'ADMIN' && !targetDoctorId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Doctor ID is required.' } },
        { status: 400 }
      );
    }

    // Appointment verification & Duplicate Check
    if (validatedData.appointmentId) {
      let appointment: any = null;
      try {
        appointment = await prisma.appointment.findUnique({
          where: { id: validatedData.appointmentId },
        });
      } catch {
        appointment = mockAppointments.find((a) => a.id === validatedData.appointmentId);
      }

      if (!appointment) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Appointment record not found.' } },
          { status: 404 }
        );
      }

      if (!targetPatientId) {
        targetPatientId = appointment.patientId;
      } else if (appointment.patientId !== targetPatientId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Appointment does not belong to the specified target patient.',
            },
          },
          { status: 400 }
        );
      }

      if (user.role === 'DOCTOR' && appointment.doctorId !== targetDoctorId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Forbidden. Doctors cannot attach a consultation to another doctor\'s appointment.',
            },
          },
          { status: 403 }
        );
      }

      // Check duplicate consultation for this appointment
      let existingConsultation: any = null;
      try {
        existingConsultation = await prisma.consultation.findFirst({
          where: { appointmentId: validatedData.appointmentId },
        });
      } catch {
        existingConsultation = mockConsultations.find(
          (c) => c.appointmentId === validatedData.appointmentId
        );
      }

      if (existingConsultation) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'A consultation record already exists for this appointment.',
            },
          },
          { status: 409 }
        );
      }
    }

    if (targetStatus === 'COMPLETED') {
      if (!validatedData.chiefComplaint || validatedData.chiefComplaint.trim().length < 3) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Chief complaint is required and must be at least 3 characters for completed consultations.',
            },
          },
          { status: 400 }
        );
      }
      if (!validatedData.diagnosis || validatedData.diagnosis.trim().length < 3) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Diagnosis is required and must be at least 3 characters for completed consultations.',
            },
          },
          { status: 400 }
        );
      }
    }

    if (!targetPatientId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Patient ID is required.' } },
        { status: 400 }
      );
    }

    // Process creation with Transaction (with DB offline fallback)
    try {
      const result = await prisma.$transaction(async (tx) => {
        const newConsultation = await tx.consultation.create({
          data: {
            appointmentId: validatedData.appointmentId || null,
            patientId: targetPatientId!,
            doctorId: targetDoctorId!,
            chiefComplaint: validatedData.chiefComplaint || '',
            diagnosis: validatedData.diagnosis || '',
            visualAcuityOD: validatedData.visualAcuity?.odDistance || null,
            visualAcuityOS: validatedData.visualAcuity?.osDistance || null,
            iopOD: validatedData.iop?.odIop || null,
            iopOS: validatedData.iop?.osIop || null,
            clinicalNotes: validatedData.clinicalNotes || null,
            treatmentPlan:
              typeof validatedData.treatmentPlan === 'string'
                ? validatedData.treatmentPlan
                : validatedData.treatmentPlan?.plan || null,
            status: targetStatus,
          },
        });

        if (targetStatus === 'COMPLETED' && validatedData.appointmentId) {
          await tx.appointment.update({
            where: { id: validatedData.appointmentId },
            data: { status: 'COMPLETED' },
          });
          await tx.oPDToken.updateMany({
            where: { appointmentId: validatedData.appointmentId },
            data: { status: 'COMPLETED' },
          });
        }

        const rxItems = validatedData.items || validatedData.medications;
        let createdPrescription: any = null;
        if (rxItems && rxItems.length > 0) {
          const rxNumber = `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
          createdPrescription = await tx.prescription.create({
            data: {
              prescriptionNumber: rxNumber,
              patientId: targetPatientId!,
              doctorId: targetDoctorId!,
              appointmentId: validatedData.appointmentId || null,
              consultationId: newConsultation.id,
              status: 'ACTIVE',
              notes: validatedData.clinicalNotes || null,
              items: {
                create: rxItems.map((item: any) => ({
                  medicineName: item.medicineName,
                  dosage: item.dosage,
                  frequency: item.frequency,
                  route: item.route || 'TOPICAL_EYE',
                  duration: item.duration,
                  instructions: item.instructions || null,
                })),
              },
            },
            include: { items: true },
          });
        }

        const auditAction =
          targetStatus === 'COMPLETED' ? 'CONSULTATION_COMPLETED' : 'CONSULTATION_DRAFT_SAVED';
        await logAuditEvent({
          actorUserId: user.id,
          userName: user.email,
          userRole: user.role,
          action: auditAction,
          entityType: 'Consultation',
          entityId: newConsultation.id,
          target: `Consultation ${newConsultation.id} (${targetStatus})`,
        });

        return { consultation: newConsultation, prescription: createdPrescription };
      });

      return NextResponse.json({ success: true, data: result }, { status: 201 });
    } catch (txError: any) {
      // DB offline fallback to mock in-memory store
      const cId = `cns-${Date.now()}`;
      const mockRecord: any = {
        id: cId,
        appointmentId: validatedData.appointmentId || null,
        patientId: targetPatientId,
        doctorId: targetDoctorId,
        chiefComplaint: validatedData.chiefComplaint || '',
        symptoms: validatedData.symptoms || '',
        clinicalNotes: validatedData.clinicalNotes || '',
        examinationNotes: validatedData.examinationNotes || '',
        diagnosis: validatedData.diagnosis || '',
        followUpDate: validatedData.followUpDate,
        status: targetStatus.toLowerCase(),
        visualAcuity: validatedData.visualAcuity,
        iop: validatedData.iop,
        refraction: validatedData.refraction,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockConsultations.push(mockRecord);

      if (targetStatus === 'COMPLETED' && validatedData.appointmentId) {
        const apt = mockAppointments.find((a) => a.id === validatedData.appointmentId);
        if (apt) apt.status = 'COMPLETED';
      }

      const rxItems = validatedData.items || validatedData.medications;
      let mockRx: any = null;
      if (rxItems && rxItems.length > 0) {
        mockRx = {
          id: `prsc-${Date.now()}`,
          prescriptionNumber: `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'ACTIVE',
          consultationId: cId,
          appointmentId: validatedData.appointmentId || null,
          patientId: targetPatientId,
          doctorId: targetDoctorId,
          issuedAt: new Date().toISOString(),
          notes: validatedData.clinicalNotes || null,
          items: rxItems.map((item: any, idx: number) => ({
            id: `pi-${Date.now()}-${idx}`,
            medicineName: item.medicineName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions || null,
          })),
        };
        mockPrescriptions.unshift(mockRx);
      }

      const auditAction =
        targetStatus === 'COMPLETED' ? 'CONSULTATION_COMPLETED' : 'CONSULTATION_DRAFT_SAVED';
      await logAuditEvent({
        actorUserId: user.id,
        userName: user.email,
        userRole: user.role,
        action: auditAction,
        entityType: 'Consultation',
        entityId: cId,
        target: `Consultation ${cId} (${targetStatus})`,
      });

      return NextResponse.json(
        { success: true, data: { consultation: mockRecord, prescription: mockRx } },
        { status: 201 }
      );
    }
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create consultation.' } },
      { status: 500 }
    );
  }
}

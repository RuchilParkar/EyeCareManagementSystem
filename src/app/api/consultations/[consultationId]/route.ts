import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { updateConsultationSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import {
  mockDoctors,
  mockPatients,
  mockAppointments,
  mockConsultations,
  mockPrescriptions,
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

async function findConsultation(paramId: string) {
  try {
    const consultation = await prisma.consultation.findFirst({
      where: {
        OR: [{ id: paramId }, { appointmentId: paramId }],
      },
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
    });
    if (consultation) return consultation;
  } catch {
    // Database connection fallback
  }

  const mockC = mockConsultations.find(
    (c) => c.id === paramId || c.appointmentId === paramId
  );
  if (mockC) {
    const pObj = mockPatients.find((p) => p.id === mockC.patientId);
    const dObj = mockDoctors.find((d) => d.id === mockC.doctorId);
    const aObj = mockAppointments.find((a) => a.id === mockC.appointmentId);
    const rxObj = mockPrescriptions.find((rx) => rx.consultationId === mockC.id);
    return {
      ...mockC,
      patient: pObj ? { id: pObj.id, firstName: pObj.firstName, lastName: pObj.lastName } : null,
      doctor: dObj ? { id: dObj.id, firstName: dObj.firstName, lastName: dObj.lastName } : null,
      appointment: aObj ? { id: aObj.id, appointmentDate: aObj.appointmentDate } : null,
      prescription: rxObj || null,
    };
  }

  return null;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ consultationId: string }> }
) {
  try {
    const user = await requireAuth(req.headers);
    const { consultationId: paramId } = await context.params;

    const consultation = await findConsultation(paramId);
    if (!consultation) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Consultation record not found.' } },
        { status: 404 }
      );
    }

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
      if (consultation.patientId !== resolvedPatientId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: "Forbidden. You do not have permission to view another patient's consultation.",
            },
          },
          { status: 403 }
        );
      }
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
      if (consultation.doctorId !== resolvedDoctorId) {
        const hasAccess = await checkClinicalAccess(consultation.patientId, resolvedDoctorId);
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
      }
    }

    await logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'CONSULTATION_VIEWED',
      entityType: 'Consultation',
      entityId: consultation.id,
      target: `Consultation detail viewed (${consultation.id})`,
    });

    return NextResponse.json({
      success: true,
      data: consultation,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch consultation details.' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ consultationId: string }> }
) {
  try {
    const user = await requireAuth(req.headers);
    const { consultationId: paramId } = await context.params;

    if (user.role === 'PATIENT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Patients are forbidden from updating consultations.' } },
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
              message: 'Forbidden. Inactive doctors cannot update consultations.',
            },
          },
          { status: 403 }
        );
      }
      resolvedDoctorId = doc.id;
    }

    const existing = await findConsultation(paramId);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Consultation record not found.' } },
        { status: 404 }
      );
    }

    if (user.role === 'DOCTOR' && existing.doctorId !== resolvedDoctorId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Forbidden. Doctors can only modify their own consultations.',
          },
        },
        { status: 403 }
      );
    }

    // State machine check: COMPLETED consultations are terminal records and cannot be modified!
    const currentStatus = (existing.status || '').toUpperCase();
    if (currentStatus === 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'Completed consultations are terminal clinical records and cannot be modified.',
          },
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateConsultationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const validatedData = parsed.data;
    const newStatus = (validatedData.status || currentStatus).toUpperCase();

    const updatedChiefComplaint =
      validatedData.chiefComplaint !== undefined ? validatedData.chiefComplaint : existing.chiefComplaint;
    const updatedDiagnosis =
      validatedData.diagnosis !== undefined ? validatedData.diagnosis : existing.diagnosis;

    if (newStatus === 'COMPLETED') {
      if (!updatedChiefComplaint || updatedChiefComplaint.trim().length < 3) {
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
      if (!updatedDiagnosis || updatedDiagnosis.trim().length < 3) {
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

    try {
      const result = await prisma.$transaction(async (tx) => {
        const updatedConsultation = await tx.consultation.update({
          where: { id: existing.id },
          data: {
            chiefComplaint: updatedChiefComplaint,
            diagnosis: updatedDiagnosis,
            visualAcuityOD:
              validatedData.visualAcuity?.odDistance !== undefined
                ? validatedData.visualAcuity.odDistance
                : (existing as any).visualAcuityOD || null,
            visualAcuityOS:
              validatedData.visualAcuity?.osDistance !== undefined
                ? validatedData.visualAcuity.osDistance
                : (existing as any).visualAcuityOS || null,
            iopOD:
              validatedData.iop?.odIop !== undefined
                ? validatedData.iop.odIop
                : (existing as any).iopOD || null,
            iopOS:
              validatedData.iop?.osIop !== undefined
                ? validatedData.iop.osIop
                : (existing as any).iopOS || null,
            clinicalNotes:
              validatedData.clinicalNotes !== undefined
                ? validatedData.clinicalNotes
                : (existing as any).clinicalNotes || null,
            treatmentPlan:
              typeof validatedData.treatmentPlan === 'string'
                ? validatedData.treatmentPlan
                : validatedData.treatmentPlan?.plan !== undefined
                ? validatedData.treatmentPlan.plan
                : (existing as any).treatmentPlan || null,
            status: newStatus,
            updatedAt: new Date(),
          },
        });

        if (newStatus === 'COMPLETED' && existing.appointmentId) {
          await tx.appointment.update({
            where: { id: existing.appointmentId },
            data: { status: 'COMPLETED' },
          });
          await tx.oPDToken.updateMany({
            where: { appointmentId: existing.appointmentId },
            data: { status: 'COMPLETED' },
          });
        }

        const rxItems = validatedData.items || validatedData.medications;
        let createdPrescription: any = null;
        if (rxItems && rxItems.length > 0) {
          const existingRx = await tx.prescription.findFirst({
            where: { consultationId: existing.id },
          });
          if (!existingRx) {
            const rxNumber = `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`;
            createdPrescription = await tx.prescription.create({
              data: {
                prescriptionNumber: rxNumber,
                patientId: existing.patientId,
                doctorId: existing.doctorId,
                appointmentId: existing.appointmentId || null,
                consultationId: existing.id,
                status: 'ACTIVE',
                notes: validatedData.clinicalNotes || (existing as any).clinicalNotes || null,
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
        }

        const auditAction =
          newStatus === 'COMPLETED' ? 'CONSULTATION_COMPLETED' : 'CONSULTATION_DRAFT_SAVED';
        await logAuditEvent({
          actorUserId: user.id,
          userName: user.email,
          userRole: user.role,
          action: auditAction,
          entityType: 'Consultation',
          entityId: existing.id,
          target: `Consultation ${existing.id} updated (${newStatus})`,
        });

        return { consultation: updatedConsultation, prescription: createdPrescription };
      });

      return NextResponse.json({ success: true, data: result });
    } catch {
      // Fallback update to mock in-memory store
      const mockIndex = mockConsultations.findIndex((c) => c.id === existing.id);
      if (mockIndex !== -1) {
        mockConsultations[mockIndex] = {
          ...mockConsultations[mockIndex],
          chiefComplaint: updatedChiefComplaint,
          diagnosis: updatedDiagnosis,
          clinicalNotes: validatedData.clinicalNotes ?? mockConsultations[mockIndex].clinicalNotes,
          status: newStatus.toLowerCase() as any,
          updatedAt: new Date().toISOString(),
        };
      }

      if (newStatus === 'COMPLETED' && existing.appointmentId) {
        const apt = mockAppointments.find((a) => a.id === existing.appointmentId);
        if (apt) apt.status = 'COMPLETED';
      }

      const rxItems = validatedData.items || validatedData.medications;
      let mockRx: any = null;
      if (rxItems && rxItems.length > 0) {
        const existingRx = mockPrescriptions.find((rx) => rx.consultationId === existing.id);
        if (!existingRx) {
          mockRx = {
            id: `prsc-${Date.now()}`,
            prescriptionNumber: `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`,
            status: 'ACTIVE',
            consultationId: existing.id,
            appointmentId: existing.appointmentId || null,
            patientId: existing.patientId,
            doctorId: existing.doctorId,
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
      }

      const auditAction =
        newStatus === 'COMPLETED' ? 'CONSULTATION_COMPLETED' : 'CONSULTATION_DRAFT_SAVED';
      await logAuditEvent({
        actorUserId: user.id,
        userName: user.email,
        userRole: user.role,
        action: auditAction,
        entityType: 'Consultation',
        entityId: existing.id,
        target: `Consultation ${existing.id} updated (${newStatus})`,
      });

      return NextResponse.json({
        success: true,
        data: {
          consultation: mockIndex !== -1 ? mockConsultations[mockIndex] : existing,
          prescription: mockRx,
        },
      });
    }
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update consultation.' } },
      { status: 500 }
    );
  }
}

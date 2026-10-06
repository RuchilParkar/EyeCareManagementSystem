import { NextResponse } from 'next/server';
import { requireAuth, verifyPatientOwnership } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { updatePrescriptionStatusSchema, isValidPrescriptionStatusTransition } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { mockDoctors, mockPatients, mockAppointments, mockConsultations, mockPrescriptions } from '@/mock';

async function findDoctorRecord(userId: string, doctorId?: string) {
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
  const mockDoc = mockDoctors.find((d) => (doctorId && d.id === doctorId) || (userId && d.userId === userId));
  if (mockDoc) {
    return { ...mockDoc, status: (mockDoc as any).status || 'ACTIVE' };
  }
  return null;
}

async function findPrescriptionById(prescriptionId: string) {
  try {
    const rx = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        items: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
            uhid: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            licenseNumber: true,
            qualification: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            type: true,
          },
        },
        consultation: {
          select: {
            id: true,
            chiefComplaint: true,
            diagnosis: true,
          },
        },
      },
    });
    if (rx) return rx;
  } catch {
    // Database connection fallback
  }

  const mockRx = mockPrescriptions.find((p) => p.id === prescriptionId);
  if (!mockRx) return null;

  const mockPat = mockPatients.find((p) => p.id === mockRx.patientId);
  const mockDoc = mockDoctors.find((d) => d.id === mockRx.doctorId);
  const mockApt = mockAppointments.find((a) => a.id === mockRx.appointmentId);
  const mockCns = mockConsultations.find((c) => c.id === mockRx.consultationId);

  return {
    ...mockRx,
    issuedAt: new Date(mockRx.issuedAt || Date.now()),
    createdAt: new Date(mockRx.createdAt || Date.now()),
    updatedAt: new Date(mockRx.updatedAt || Date.now()),
    patient: mockPat ? { ...mockPat } : { id: mockRx.patientId, firstName: 'Patient', lastName: mockRx.patientId },
    doctor: mockDoc ? { ...mockDoc } : { id: mockRx.doctorId, firstName: 'Doctor', lastName: mockRx.doctorId },
    appointment: mockApt ? { ...mockApt } : null,
    consultation: mockCns ? { ...mockCns } : null,
    items: (mockRx.items || []).map((item) => ({ ...item })),
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ prescriptionId: string }> }
) {
  try {
    const user = await requireAuth(req.headers);
    const { prescriptionId } = await params;

    const prescription: any = await findPrescriptionById(prescriptionId);

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Prescription record not found.' } },
        { status: 404 }
      );
    }

    // IDOR Protection Strategy
    if (user.role === 'PATIENT') {
      await verifyPatientOwnership(prescription.patientId, user);
    } else if (user.role === 'DOCTOR') {
      let resolvedDoctorId = user.doctorId;
      if (!resolvedDoctorId) {
        const doc = await findDoctorRecord(user.id);
        resolvedDoctorId = doc?.id;
      }
      if (resolvedDoctorId && prescription.doctorId !== resolvedDoctorId) {
        let hasPatientAccess = false;
        try {
          const hasApt = await prisma.appointment.findFirst({
            where: {
              patientId: prescription.patientId,
              doctorId: resolvedDoctorId,
            },
          });
          hasPatientAccess = !!hasApt;
        } catch {
          hasPatientAccess = mockAppointments.some((a) => a.patientId === prescription.patientId && a.doctorId === resolvedDoctorId);
        }

        if (!hasPatientAccess) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized. You do not have clinical access to this patient prescription.' } },
            { status: 403 }
          );
        }
      }
    }

    await logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'PRESCRIPTION_VIEWED',
      entityType: 'Prescription',
      entityId: prescription.id,
      target: `Prescription: ${prescription.prescriptionNumber}`,
    });

    const formatted = {
      id: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      status: prescription.status,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      appointmentId: prescription.appointmentId,
      consultationId: prescription.consultationId,
      issuedAt: typeof prescription.issuedAt === 'string' ? prescription.issuedAt : prescription.issuedAt.toISOString(),
      notes: prescription.notes,
      createdAt: typeof prescription.createdAt === 'string' ? prescription.createdAt : prescription.createdAt.toISOString(),
      updatedAt: typeof prescription.updatedAt === 'string' ? prescription.updatedAt : prescription.updatedAt.toISOString(),
      patientName: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
      doctorName: `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`,
      patient: prescription.patient,
      doctor: prescription.doctor,
      appointment: prescription.appointment,
      consultation: prescription.consultation,
      items: prescription.items.map((item: any) => ({
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
    };

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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch prescription details.' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ prescriptionId: string }> }
) {
  try {
    const user = await requireAuth(req.headers);

    if (user.role === 'PATIENT') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Patients are not permitted to modify prescriptions.' } },
        { status: 403 }
      );
    }

    const { prescriptionId } = await params;
    const body = await req.json();

    const parsed = updatePrescriptionStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 }
      );
    }

    const existing: any = await findPrescriptionById(prescriptionId);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Prescription record not found.' } },
        { status: 404 }
      );
    }

    if (user.role === 'DOCTOR') {
      let resolvedDoctorId = user.doctorId;
      let dbDoctor;
      if (!resolvedDoctorId) {
        dbDoctor = await findDoctorRecord(user.id);
        resolvedDoctorId = dbDoctor?.id;
      } else {
        dbDoctor = await findDoctorRecord(user.id, resolvedDoctorId);
      }

      if (!dbDoctor || dbDoctor.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Inactive doctors are not permitted to modify prescriptions.' } },
          { status: 403 }
        );
      }

      if (resolvedDoctorId !== existing.doctorId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Only the issuing doctor or an administrator can update this prescription.' } },
          { status: 403 }
        );
      }
    }

    // State machine transition validation
    if (!isValidPrescriptionStatusTransition(existing.status, parsed.data.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TRANSITION',
            message: `Invalid prescription status transition from ${existing.status} to ${parsed.data.status}.`,
          },
        },
        { status: 400 }
      );
    }

    let updated: any;
    try {
      updated = await prisma.prescription.update({
        where: { id: prescriptionId },
        data: {
          status: parsed.data.status,
          ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
        },
        include: {
          items: true,
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { firstName: true, lastName: true } },
        },
      });
    } catch {
      // Database connection fallback to in-memory mock store
      const mockIndex = mockPrescriptions.findIndex((p) => p.id === prescriptionId);
      if (mockIndex !== -1) {
        mockPrescriptions[mockIndex].status = parsed.data.status;
        if (parsed.data.notes !== undefined) {
          mockPrescriptions[mockIndex].notes = parsed.data.notes;
        }
        const mockRx = mockPrescriptions[mockIndex];
        const mockPat = mockPatients.find((p) => p.id === mockRx.patientId);
        const mockDoc = mockDoctors.find((d) => d.id === mockRx.doctorId);

        updated = {
          ...mockRx,
          issuedAt: new Date(mockRx.issuedAt || Date.now()),
          createdAt: new Date(mockRx.createdAt || Date.now()),
          updatedAt: new Date(mockRx.updatedAt || Date.now()),
          patient: { firstName: mockPat?.firstName || 'Patient', lastName: mockPat?.lastName || mockRx.patientId },
          doctor: { firstName: mockDoc?.firstName || 'Doctor', lastName: mockDoc?.lastName || mockRx.doctorId },
          items: (mockRx.items || []).map((item) => ({ ...item })),
        };
      } else {
        throw new Error('NOT_FOUND');
      }
    }

    // Write Security Audit Event with structured metadata
    await logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'PRESCRIPTION_STATUS_UPDATED',
      entityType: 'Prescription',
      entityId: updated.id,
      target: `Prescription: ${updated.prescriptionNumber} status changed from ${existing.status} to ${updated.status}`,
      metadata: {
        previousStatus: existing.status,
        newStatus: updated.status,
        prescriptionId: updated.id,
        prescriptionNumber: updated.prescriptionNumber,
      },
    });

    const formatted = {
      id: updated.id,
      prescriptionNumber: updated.prescriptionNumber,
      status: updated.status,
      patientId: updated.patientId,
      doctorId: updated.doctorId,
      appointmentId: updated.appointmentId,
      consultationId: updated.consultationId,
      issuedAt: typeof updated.issuedAt === 'string' ? updated.issuedAt : updated.issuedAt.toISOString(),
      notes: updated.notes,
      createdAt: typeof updated.createdAt === 'string' ? updated.createdAt : updated.createdAt.toISOString(),
      updatedAt: typeof updated.updatedAt === 'string' ? updated.updatedAt : updated.updatedAt.toISOString(),
      patientName: `${updated.patient.firstName} ${updated.patient.lastName}`,
      doctorName: `Dr. ${updated.doctor.firstName} ${updated.doctor.lastName}`,
      items: updated.items.map((item: any) => ({
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
    };

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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update prescription status.' } },
      { status: 500 }
    );
  }
}



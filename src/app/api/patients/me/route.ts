import { NextResponse } from 'next/server';
import { requirePatient } from '@/lib/auth/session';
import { updatePatientMeSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { formatIndianMobile } from '@/lib/utils/localization';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const user = await requirePatient(request.headers);

    if (!user.patientId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No patient record associated with this account.' } },
        { status: 404 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: user.patientId },
      include: {
        user: { select: { email: true, status: true, role: true } },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Patient profile not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (err: unknown) {
    const error = err as Error & { code?: string; statusCode?: number };
    return NextResponse.json(
      { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
      { status: error.statusCode || 401 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requirePatient(request.headers);

    if (!user.patientId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No patient record associated with this account.' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updatePatientMeSchema.parse(body);

    // Format phone if provided
    const updateData: Record<string, unknown> = { ...validated };
    if (validated.phone) {
      updateData.phone = formatIndianMobile(validated.phone);
    }

    // Never allow updating protected system identifier fields
    delete updateData.id;
    delete updateData.userId;
    delete updateData.patientNumber;
    delete updateData.uhid;
    delete updateData.mrn;

    const updatedPatient = await prisma.patient.update({
      where: { id: user.patientId },
      data: updateData,
      include: {
        user: { select: { email: true, status: true, role: true } },
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      userName: `${updatedPatient.firstName} ${updatedPatient.lastName}`,
      userRole: 'PATIENT',
      action: 'PATIENT_PROFILE_UPDATED',
      entityType: 'Patient',
      entityId: updatedPatient.id,
      target: `Self-update profile for patient ${updatedPatient.uhid || updatedPatient.patientNumber}`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({ success: true, data: updatedPatient });
  } catch (err: unknown) {
    const error = err as Error & { code?: string; statusCode?: number };
    return NextResponse.json(
      { success: false, error: { code: error.code || 'VALIDATION_ERROR', message: error.message } },
      { status: error.statusCode || 400 }
    );
  }
}

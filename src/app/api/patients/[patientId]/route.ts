import { NextResponse } from 'next/server';
import { requireAuth, verifyPatientOwnership } from '@/lib/auth/session';
import { updatePatientMeSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { formatIndianMobile } from '@/lib/utils/localization';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const user = await requireAuth(request.headers);
    const { patientId } = await params;
    await verifyPatientOwnership(patientId, user);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: { select: { email: true, status: true, role: true } } },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Patient record not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: patient });
  } catch (err: unknown) {
    const error = err as Error & { code?: string; statusCode?: number };
    return NextResponse.json(
      { success: false, error: { code: error.code || 'FORBIDDEN', message: error.message } },
      { status: error.statusCode || 403 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const user = await requireAuth(request.headers);
    const { patientId } = await params;

    // Verify ownership (or Admin/Doctor authorization)
    await verifyPatientOwnership(patientId, user);

    const body = await request.json();
    const validated = updatePatientMeSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.phone) {
      updateData.phone = formatIndianMobile(validated.phone);
    }

    // Protect system immutable fields
    delete updateData.id;
    delete updateData.userId;
    delete updateData.patientNumber;
    delete updateData.uhid;
    delete updateData.mrn;

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: updateData,
      include: { user: { select: { email: true, status: true, role: true } } },
    });

    await logAuditEvent({
      actorUserId: user.id,
      userName: `${user.role}: ${user.email}`,
      userRole: user.role,
      action: 'PATIENT_RECORD_UPDATED',
      entityType: 'Patient',
      entityId: updatedPatient.id,
      target: `Update patient ${updatedPatient.uhid || updatedPatient.patientNumber}`,
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

export async function PUT(
  request: Request,
  context: { params: Promise<{ patientId: string }> }
) {
  return PATCH(request, context);
}

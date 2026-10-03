import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { updateDoctorAdminSchema, updateDoctorMeSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        department: true,
        user: { select: { email: true, status: true, role: true } },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Doctor record not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: doctor });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const user = await requireAuth(request.headers);
    const { doctorId } = await params;

    let updateData: Record<string, unknown> = {};
    const body = await request.json();

    if (user.role === 'ADMIN') {
      const validated = updateDoctorAdminSchema.parse(body);
      updateData = { ...validated };
    } else if (user.role === 'DOCTOR') {
      if (user.doctorId !== doctorId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Doctors cannot modify another doctor\'s profile.' } },
          { status: 403 }
        );
      }
      const validated = updateDoctorMeSchema.parse(body);
      updateData = { ...validated };
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized role.' } },
        { status: 403 }
      );
    }

    // Protect system immutable fields
    delete updateData.id;
    delete updateData.userId;
    delete updateData.doctorNumber;
    delete updateData.licenseNumber;

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: updateData,
      include: {
        department: true,
        user: { select: { email: true, status: true, role: true } },
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      userName: `User: ${user.email}`,
      userRole: user.role,
      action: 'DOCTOR_RECORD_UPDATED',
      entityType: 'Doctor',
      entityId: updatedDoctor.id,
      target: `Update doctor record ${updatedDoctor.doctorNumber}`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    return NextResponse.json({ success: true, data: updatedDoctor });
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
  context: { params: Promise<{ doctorId: string }> }
) {
  return PATCH(request, context);
}

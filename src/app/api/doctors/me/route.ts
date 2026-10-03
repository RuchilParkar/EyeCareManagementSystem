import { NextResponse } from 'next/server';
import { requireDoctor } from '@/lib/auth/session';
import { updateDoctorMeSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const user = await requireDoctor(request.headers);

    if (!user.doctorId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No doctor profile associated with this account.' } },
        { status: 404 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: user.doctorId },
      include: {
        department: true,
        user: { select: { email: true, status: true, role: true } },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: doctor });
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
    const user = await requireDoctor(request.headers);

    if (!user.doctorId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'No doctor profile associated with this account.' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = updateDoctorMeSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };

    // Never allow doctor to self-update system identifier or administrative role fields
    delete updateData.id;
    delete updateData.userId;
    delete updateData.doctorNumber;
    delete updateData.licenseNumber;
    delete updateData.departmentId;
    delete updateData.status;

    const updatedDoctor = await prisma.doctor.update({
      where: { id: user.doctorId },
      data: updateData,
      include: {
        department: true,
        user: { select: { email: true, status: true, role: true } },
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      userName: `Dr. ${updatedDoctor.firstName} ${updatedDoctor.lastName}`,
      userRole: 'DOCTOR',
      action: 'DOCTOR_PROFILE_UPDATED',
      entityType: 'Doctor',
      entityId: updatedDoctor.id,
      target: `Self-update profile for doctor ${updatedDoctor.doctorNumber}`,
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

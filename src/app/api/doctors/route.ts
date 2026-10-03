import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/session';
import { doctorSchema } from '@/lib/validation/schemas';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        department: true,
        user: { select: { email: true, status: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: doctors });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(['ADMIN'], request.headers);
    const body = await request.json();
    const validated = doctorSchema.parse(body);

    const email = `${validated.firstName.toLowerCase()}.${validated.lastName.toLowerCase()}@clearvisioneyecare.com`;
    const docNum = validated.doctorNumber || `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDoctor = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          role: 'DOCTOR',
          status: 'ACTIVE',
        },
      });

      return tx.doctor.create({
        data: {
          userId: newUser.id,
          doctorNumber: docNum,
          firstName: validated.firstName,
          lastName: validated.lastName,
          specialization: validated.specialization,
          qualification: validated.qualification,
          licenseNumber: validated.licenseNumber,
          phone: validated.phone,
          bio: validated.bio,
          profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250',
          departmentId: validated.departmentId,
          experience: validated.experience || 5,
          status: (validated.status || 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
        },
        include: {
          department: true,
          user: { select: { email: true, status: true, role: true } },
        },
      });
    });

    return NextResponse.json({ success: true, data: newDoctor });
  } catch (err: unknown) {
    const error = err as Error & { code?: string; statusCode?: number };
    return NextResponse.json(
      { success: false, error: { code: error.code || 'VALIDATION_ERROR', message: error.message } },
      { status: error.statusCode || 400 }
    );
  }
}

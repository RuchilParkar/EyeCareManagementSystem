import { NextResponse } from 'next/server';
import { requireAuth, requireRole, verifyPatientOwnership } from '@/lib/auth/session';
import { patientSchema } from '@/lib/validation/schemas';
import { generateUHID, formatIndianMobile } from '@/lib/utils/localization';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request.headers);

    if (user.role === 'PATIENT') {
      if (!user.patientId) {
        return NextResponse.json({ success: true, data: [] });
      }
      await verifyPatientOwnership(user.patientId, user);
      const patient = await prisma.patient.findUnique({
        where: { id: user.patientId },
        include: { user: { select: { email: true, status: true, role: true } } },
      });
      return NextResponse.json({ success: true, data: patient ? [patient] : [] });
    }

    // DOCTOR or ADMIN role can retrieve patient listing
    const patients = await prisma.patient.findMany({
      include: { user: { select: { email: true, status: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: patients });
  } catch (err: unknown) {
    const error = err as Error & { code?: string; statusCode?: number };
    return NextResponse.json(
      { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
      { status: error.statusCode || 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(['ADMIN', 'DOCTOR'], request.headers);
    const body = await request.json();
    const validated = patientSchema.parse(body);

    const email = `patient.${Date.now()}@eyecare.local`;
    const patientNum = validated.patientNumber || `PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const mrnNum = validated.mrn || `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
    const totalPatients = await prisma.patient.count().catch(() => 0);
    // Ignore any client-provided UHID to guarantee server-side assignment
    const generatedUHID = generateUHID(totalPatients + 1);
    const formattedPhone = formatIndianMobile(validated.phone);

    const newPatient = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          role: 'PATIENT',
          status: 'ACTIVE',
        },
      });

      return tx.patient.create({
        data: {
          userId: newUser.id,
          patientNumber: patientNum,
          uhid: generatedUHID,
          mrn: mrnNum,
          firstName: validated.firstName,
          lastName: validated.lastName,
          dateOfBirth: validated.dateOfBirth,
          gender: validated.gender as 'MALE' | 'FEMALE' | 'OTHER',
          phone: formattedPhone,
          address: validated.address,
          addressLine: validated.addressLine || validated.address,
          locality: validated.locality || '',
          city: validated.city || 'Mumbai',
          district: validated.district || '',
          state: validated.state || 'Maharashtra',
          pincode: validated.pincode || '',
          emergencyContact: validated.emergencyContact,
          bloodGroup: validated.bloodGroup || 'O+',
          aadhaarNumber: validated.aadhaarNumber || null,
        },
        include: { user: { select: { email: true, status: true, role: true } } },
      });
    });

    return NextResponse.json({ success: true, data: newPatient });
  } catch (err: unknown) {
    const error = err as Error & { code?: string; statusCode?: number };
    return NextResponse.json(
      { success: false, error: { code: error.code || 'VALIDATION_ERROR', message: error.message } },
      { status: error.statusCode || 400 }
    );
  }
}

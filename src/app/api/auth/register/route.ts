import { NextResponse } from 'next/server';
import { registerPatientSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { hashPassword } from '@/lib/security/password';
import { generateUHID, formatIndianMobile } from '@/lib/utils/localization';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerPatientSchema.parse(body);
    const emailLower = validated.email.toLowerCase();

    // 1. Check existing user in Prisma DB
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: emailLower },
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Unable to access registration database.',
          },
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'An account with this email address already exists.',
            fields: { email: 'Email address is already registered.' },
          },
        },
        { status: 400 }
      );
    }

    // 2. Hash password with upgraded 100k iteration PBKDF2-HMAC-SHA512
    const hashedPassword = hashPassword(validated.password);
    const patientNum = `PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const mrnNum = `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
    const totalPatients = await prisma.patient.count().catch(() => 0);
    const generatedUHID = generateUHID(totalPatients + 1);
    const formattedPhone = formatIndianMobile(validated.phone);

    // 3. Create User + Patient in single Prisma transaction (Strictly PATIENT role with UHID & Indian address)
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: emailLower,
          passwordHash: hashedPassword,
          role: 'PATIENT',
          status: 'ACTIVE',
          lastLoginAt: new Date(),
        },
      });

      const newPatient = await tx.patient.create({
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
      });

      return { newUser, newPatient };
    });

    await logAuditEvent({
      actorUserId: result.newUser.id,
      userName: `${validated.firstName} ${validated.lastName}`,
      userRole: 'PATIENT',
      action: 'PATIENT_REGISTERED',
      entityType: 'Patient',
      entityId: result.newPatient.id,
      target: `Database registration for ${emailLower} with UHID ${generatedUHID}`,
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.newUser.id,
          email: result.newUser.email,
          role: result.newUser.role,
          status: result.newUser.status,
          createdAt: result.newUser.createdAt.toISOString(),
          updatedAt: result.newUser.updatedAt.toISOString(),
        },
        patient: {
          id: result.newPatient.id,
          userId: result.newPatient.userId,
          patientNumber: result.newPatient.patientNumber,
          uhid: result.newPatient.uhid,
          mrn: result.newPatient.mrn,
          firstName: result.newPatient.firstName,
          lastName: result.newPatient.lastName,
          dateOfBirth: result.newPatient.dateOfBirth,
          gender: result.newPatient.gender,
          phone: result.newPatient.phone,
          address: result.newPatient.address,
          city: result.newPatient.city,
          state: result.newPatient.state,
          pincode: result.newPatient.pincode,
          emergencyContact: result.newPatient.emergencyContact,
          bloodGroup: result.newPatient.bloodGroup,
          createdAt: result.newPatient.createdAt.toISOString(),
          updatedAt: result.newPatient.updatedAt.toISOString(),
        },
      },
    });

    const now = Date.now();
    const maxAge = 86400 * 7; // 7 days

    response.cookies.set(
      'eyecare_session',
      JSON.stringify({
        userId: result.newUser.id,
        role: 'PATIENT',
        email: result.newUser.email,
        createdAt: now,
        expiresAt: now + maxAge * 1000,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/',
      }
    );

    return response;
  } catch (error: unknown) {
    const err = error as Error & { errors?: { message: string }[] };
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.errors ? err.errors[0]?.message : 'Invalid registration data.',
        },
      },
      { status: 400 }
    );
  }
}

import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { verifyPassword } from '@/lib/security/password';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(ip, 10, 15 * 60 * 1000); // 10 attempts per 15 min

    if (rateLimit.isRateLimited) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many failed login attempts. Please try again after 15 minutes.',
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = loginSchema.parse(body);
    const emailLower = validated.email.toLowerCase();

    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { email: emailLower },
        include: { patient: true, doctor: true },
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Unable to connect to authentication database.',
          },
        },
        { status: 500 }
      );
    }

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
          },
        },
        { status: 401 }
      );
    }

    if (dbUser.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_INACTIVE',
            message: 'Your account is inactive or suspended. Please contact hospital administration.',
          },
        },
        { status: 403 }
      );
    }

    const isValid = verifyPassword(validated.password, dbUser.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password.',
          },
        },
        { status: 401 }
      );
    }

    // Update last login timestamp
    try {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() },
      });
    } catch {
      // Non-blocking timestamp update
    }

    await logAuditEvent({
      actorUserId: dbUser.id,
      userName: dbUser.email,
      userRole: dbUser.role,
      action: 'USER_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: dbUser.id,
      target: `Database authentication for ${dbUser.email}`,
      ipAddress: ip,
    });

    const userResponse = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status,
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
      lastLoginAt: new Date().toISOString(),
      patientId: dbUser.patient?.id,
      doctorId: dbUser.doctor?.id,
    };

    const response = NextResponse.json({
      success: true,
      data: userResponse,
    });

    const now = Date.now();
    const maxAge = 86400 * 7; // 7 days

    response.cookies.set(
      'eyecare_session',
      JSON.stringify({
        userId: dbUser.id,
        role: dbUser.role,
        email: dbUser.email,
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
          message: err.errors ? err.errors[0]?.message : 'Invalid credentials format provided.',
        },
      },
      { status: 400 }
    );
  }
}

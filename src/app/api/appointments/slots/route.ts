import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_SLOTS = [
  { startTime: '09:00', endTime: '09:30' },
  { startTime: '09:30', endTime: '10:00' },
  { startTime: '10:00', endTime: '10:30' },
  { startTime: '10:30', endTime: '11:00' },
  { startTime: '11:15', endTime: '11:45' },
  { startTime: '11:45', endTime: '12:15' },
  { startTime: '14:00', endTime: '14:30' },
  { startTime: '14:30', endTime: '15:00' },
  { startTime: '15:00', endTime: '15:30' },
  { startTime: '15:30', endTime: '16:00' },
  { startTime: '16:00', endTime: '16:30' },
];

export async function GET(req: Request) {
  try {
    await requireAuth(req.headers);

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    const date = searchParams.get('date');

    if (!doctorId || !date) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_QUERY', message: 'Both doctorId and date query parameters are required.' } },
        { status: 400 }
      );
    }

    // Fetch existing active bookings for this doctor & date from PostgreSQL
    let bookedStartTimes = new Set<string>();
    try {
      const existingBookings = await prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: date,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        select: { startTime: true },
      });

      bookedStartTimes = new Set(existingBookings.map((b) => b.startTime));
    } catch {
      // Fallback if DB query errors in dev
    }

    const availableSlots = DEFAULT_SLOTS.map((slot) => ({
      ...slot,
      available: !bookedStartTimes.has(slot.startTime),
    }));

    return NextResponse.json({
      success: true,
      data: availableSlots,
    });
  } catch (error: any) {
    if (error.statusCode) {
      return NextResponse.json(
        { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to compute doctor availability slots.' } },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { updateAppointmentStatusSchema, rescheduleAppointmentSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';

export async function GET(
  req: Request,
  context: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const user = await requireAuth(req.headers);
    const { appointmentId } = await context.params;

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        department: true,
        opdToken: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Appointment record not found.' } },
        { status: 404 }
      );
    }

    // RBAC & IDOR Verification
    if (user.role === 'PATIENT') {
      let resolvedPatId = user.patientId;
      if (!resolvedPatId) {
        const pat = await prisma.patient.findUnique({ where: { userId: user.id } });
        resolvedPatId = pat?.id;
      }
      if (appointment.patientId !== resolvedPatId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden. You do not have permission to view another patient\'s appointment.' } },
          { status: 403 }
        );
      }
    } else if (user.role === 'DOCTOR') {
      let resolvedDocId = user.doctorId;
      if (!resolvedDocId) {
        const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
        resolvedDocId = doc?.id;
      }
      if (appointment.doctorId !== resolvedDocId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden. Doctors can only view their own assigned appointments.' } },
          { status: 403 }
        );
      }
    }

    const formatted = {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      departmentId: appointment.departmentId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      type: appointment.type,
      status: appointment.status,
      reason: appointment.reason,
      tokenNumber: appointment.tokenNumber || appointment.opdToken?.tokenNumber,
      notes: appointment.notes,
      fee: appointment.fee,
      createdAt: appointment.createdAt.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
      patientName: appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Patient',
      doctorName: appointment.doctor ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` : 'Doctor',
      serviceName: appointment.type ? appointment.type.replace('_', ' ') : 'General Consultation',
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch appointment details.' } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const user = await requireAuth(req.headers);
    const { appointmentId } = await context.params;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, doctor: true },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Appointment record not found.' } },
        { status: 404 }
      );
    }

    // Authorization & Ownership Verification
    let isOwnerPatient = false;
    let isAssignedDoctor = false;

    if (user.role === 'PATIENT') {
      let resolvedPatId = user.patientId;
      if (!resolvedPatId) {
        const pat = await prisma.patient.findUnique({ where: { userId: user.id } });
        resolvedPatId = pat?.id;
      }
      if (existingAppointment.patientId !== resolvedPatId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden. Cannot modify another patient\'s appointment.' } },
          { status: 403 }
        );
      }
      isOwnerPatient = true;
    } else if (user.role === 'DOCTOR') {
      let resolvedDocId = user.doctorId;
      if (!resolvedDocId) {
        const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
        resolvedDocId = doc?.id;
      }
      if (existingAppointment.doctorId !== resolvedDocId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden. Doctors can only update their assigned appointments.' } },
          { status: 403 }
        );
      }
      isAssignedDoctor = true;
    }

    const body = await req.json();

    // Check if payload is Reschedule or Status Update
    const isReschedulePayload = body.appointmentDate && body.startTime;

    const updatedResult = await prisma.$transaction(async (tx) => {
      if (isReschedulePayload) {
        // Rescheduling Flow
        const parsedReschedule = rescheduleAppointmentSchema.safeParse(body);
        if (!parsedReschedule.success) {
          throw new Error(`VALIDATION:${parsedReschedule.error.issues[0].message}`);
        }

        const { appointmentDate, startTime, reason } = parsedReschedule.data;

        // Check if current status allows rescheduling
        if (existingAppointment.status === 'COMPLETED' || existingAppointment.status === 'CANCELLED') {
          throw new Error('CANNOT_RESCHEDULE_FINALIZED');
        }

        // Slot Conflict Protection for new date & time
        const slotConflict = await tx.appointment.findFirst({
          where: {
            doctorId: existingAppointment.doctorId,
            appointmentDate,
            startTime,
            id: { not: appointmentId },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          },
        });

        if (slotConflict) {
          throw new Error('SLOT_ALREADY_BOOKED');
        }

        const updated = await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            appointmentDate,
            startTime,
            endTime: body.endTime || '10:30',
            status: 'RESCHEDULED',
            reason: reason || existingAppointment.reason,
            updatedAt: new Date(),
          },
        });

        // Write Security Audit Log
        await logAuditEvent({
          actorUserId: user.id,
          userName: user.email,
          userRole: user.role,
          action: 'APPOINTMENT_RESCHEDULED',
          entityType: 'Appointment',
          entityId: appointmentId,
          target: `Rescheduled to ${appointmentDate} ${startTime}`,
        });

        return updated;
      } else {
        // Status Update Flow
        const parsedStatus = updateAppointmentStatusSchema.safeParse(body);
        if (!parsedStatus.success) {
          throw new Error(`VALIDATION:${parsedStatus.error.issues[0].message}`);
        }

        const { status, notes } = parsedStatus.data;

        // Patient restriction: Patient can only CANCEL
        if (isOwnerPatient && status !== 'CANCELLED') {
          throw new Error('PATIENT_CAN_ONLY_CANCEL');
        }

        const updated = await tx.appointment.update({
          where: { id: appointmentId },
          data: {
            status,
            notes: notes !== undefined ? notes : existingAppointment.notes,
            updatedAt: new Date(),
          },
        });

        // If appointment is CANCELLED, also update linked OPDToken status to CANCELLED
        if (status === 'CANCELLED') {
          await tx.oPDToken.updateMany({
            where: { appointmentId },
            data: { status: 'CANCELLED' },
          });
        }

        // Write Security Audit Log
        await logAuditEvent({
          actorUserId: user.id,
          userName: user.email,
          userRole: user.role,
          action: status === 'CANCELLED' ? 'APPOINTMENT_CANCELLED' : `APPOINTMENT_STATUS_${status}`,
          entityType: 'Appointment',
          entityId: appointmentId,
          target: `Status changed to ${status}`,
        });

        return updated;
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedResult,
    });
  } catch (error: any) {
    if (error.message?.startsWith('VALIDATION:')) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.message.replace('VALIDATION:', '') } },
        { status: 400 }
      );
    }
    if (error.message === 'SLOT_ALREADY_BOOKED') {
      return NextResponse.json(
        { success: false, error: { code: 'SLOT_CONFLICT', message: 'The requested appointment time slot has already been booked.' } },
        { status: 409 }
      );
    }
    if (error.message === 'CANNOT_RESCHEDULE_FINALIZED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Completed or cancelled appointments cannot be rescheduled.' } },
        { status: 400 }
      );
    }
    if (error.message === 'PATIENT_CAN_ONLY_CANCEL') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Patients can only request appointment cancellation.' } },
        { status: 403 }
      );
    }
    if (error.statusCode) {
      return NextResponse.json(
        { success: false, error: { code: error.code || 'UNAUTHORIZED', message: error.message } },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to update appointment.' } },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { updateInvoiceSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { mockInvoices, mockPatients, mockAppointments, mockConsultations, mockPrescriptions } from '@/mock';

async function checkClinicalAccess(patientId: string, doctorId: string): Promise<boolean> {
  try {
    const hasAppointment = await prisma.appointment.findFirst({ where: { patientId, doctorId } });
    const hasConsultation = await prisma.consultation.findFirst({ where: { patientId, doctorId } });
    const hasPrescription = await prisma.prescription.findFirst({ where: { patientId, doctorId } });
    if (hasAppointment || hasConsultation || hasPrescription) return true;
  } catch {
    // Fallback to mock checks
  }
  const hasMockApt = mockAppointments.some((a) => a.patientId === patientId && a.doctorId === doctorId);
  const hasMockCns = mockConsultations.some((c) => c.patientId === patientId && c.doctorId === doctorId);
  const hasMockRx = mockPrescriptions.some((p) => p.patientId === patientId && p.doctorId === doctorId);
  return hasMockApt || hasMockCns || hasMockRx;
}

export async function GET(req: Request, context: { params: Promise<{ invoiceId: string }> }) {
  try {
    const user = await requireAuth(req.headers);
    const { invoiceId } = await context.params;

    let invoice: any = null;
    try {
      invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          patient: true,
          items: true,
          payments: true,
        },
      });
    } catch {
      invoice = mockInvoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    }

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found.' } },
        { status: 404 }
      );
    }

    // IDOR / Access Control Validation
    if (user.role === 'PATIENT') {
      let patientId = user.patientId;
      if (!patientId) {
        try {
          const pat = await prisma.patient.findUnique({ where: { userId: user.id } });
          patientId = pat?.id;
        } catch {
          const mockPat = mockPatients.find((p) => p.userId === user.id);
          patientId = mockPat?.id;
        }
      }

      if (invoice.patientId !== patientId) {
        return NextResponse.json(
          { success: false, error: { code: 'IDOR_FORBIDDEN', message: 'You are not authorized to view another patient invoice.' } },
          { status: 403 }
        );
      }
    } else if (user.role === 'DOCTOR') {
      let doctorId = user.doctorId;
      if (!doctorId) {
        try {
          const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
          doctorId = doc?.id;
        } catch {
          // mock doctor fallback
        }
      }

      if (doctorId) {
        const hasAccess = await checkClinicalAccess(invoice.patientId, doctorId);
        if (!hasAccess) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Doctor does not have a clinical relationship with this patient.' } },
            { status: 403 }
          );
        }
      }
    }

    logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'INVOICE_VIEWED',
      entityType: 'Invoice',
      entityId: invoice.id,
      target: `Invoice #${invoice.invoiceNumber}`,
      metadata: { invoiceId: invoice.id, patientId: invoice.patientId },
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (err: any) {
    if (err.statusCode) {
      return NextResponse.json({ success: false, error: { code: err.code || 'UNAUTHORIZED', message: err.message } }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Server error' } }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ invoiceId: string }> }) {
  try {
    const user = await requireAuth(req.headers);
    const { invoiceId } = await context.params;

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only hospital billing administrators can modify invoice status.' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateInvoiceSchema.parse(body);

    let existingInvoice: any = null;
    try {
      existingInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    } catch {
      existingInvoice = mockInvoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    }

    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found.' } },
        { status: 404 }
      );
    }

    // Financial Immutability Protection
    if (existingInvoice.status === 'PAID' || existingInvoice.status === 'REFUNDED' || existingInvoice.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `Invoices in status '${existingInvoice.status}' are financially immutable and cannot be updated.` } },
        { status: 400 }
      );
    }

    const subtotal = existingInvoice.subtotal;
    const discount = parsed.discount !== undefined ? parsed.discount : (existingInvoice.discount || 0);
    const tax = parsed.tax !== undefined ? parsed.tax : (existingInvoice.tax || 0);
    const totalAmount = Math.max(0, subtotal + tax - discount);
    const newStatus = parsed.status || (parsed.status === 'PAID' ? 'PAID' : existingInvoice.status);
    const amountPaid = newStatus === 'PAID' ? totalAmount : (existingInvoice.amountPaid || 0);
    const amountDue = Math.max(0, totalAmount - amountPaid);

    let updatedInvoice: any = null;
    try {
      updatedInvoice = await prisma.invoice.update({
        where: { id: existingInvoice.id },
        data: {
          serviceName: parsed.serviceName || existingInvoice.serviceName,
          status: newStatus as any,
          discount,
          tax,
          totalAmount,
          amountPaid,
          amountDue,
          dueDate: parsed.dueDate || existingInvoice.dueDate,
          notes: parsed.notes || existingInvoice.notes,
        },
        include: {
          items: true,
          payments: true,
        },
      });
    } catch {
      // Memory mock store fallback
      const idx = mockInvoices.findIndex((i) => i.id === existingInvoice.id);
      if (idx !== -1) {
        mockInvoices[idx] = {
          ...mockInvoices[idx],
          serviceName: parsed.serviceName || mockInvoices[idx].serviceName,
          status: newStatus as any,
          discount,
          tax,
          totalAmount,
          amountPaid,
          amountDue,
          dueDate: parsed.dueDate || mockInvoices[idx].dueDate,
        };
        updatedInvoice = mockInvoices[idx];
      }
    }

    logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'INVOICE_STATUS_UPDATED',
      entityType: 'Invoice',
      entityId: existingInvoice.id,
      target: `Invoice #${existingInvoice.invoiceNumber} (${existingInvoice.status} -> ${newStatus})`,
      metadata: {
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoiceNumber,
        previousStatus: existingInvoice.status,
        newStatus,
        totalAmount,
      },
    });

    return NextResponse.json({ success: true, data: updatedInvoice });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid update payload', fields: err.flatten() } },
        { status: 400 }
      );
    }
    if (err.statusCode) {
      return NextResponse.json({ success: false, error: { code: err.code || 'UNAUTHORIZED', message: err.message } }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Server error' } }, { status: 500 });
  }
}

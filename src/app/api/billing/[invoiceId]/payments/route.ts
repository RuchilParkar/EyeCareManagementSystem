import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { recordPaymentSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { generatePaymentNumber } from '@/lib/utils/localization';
import { mockInvoices } from '@/mock';

export async function POST(req: Request, context: { params: Promise<{ invoiceId: string }> }) {
  try {
    const user = await requireAuth(req.headers);
    const { invoiceId } = await context.params;

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only hospital billing administrators can record payment collection.' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = recordPaymentSchema.parse(body);

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

    // Status Validation
    if (existingInvoice.status === 'PAID' || existingInvoice.status === 'CANCELLED' || existingInvoice.status === 'REFUNDED') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: `Cannot record payment on invoice in status '${existingInvoice.status}'.` } },
        { status: 400 }
      );
    }

    const currentPaid = existingInvoice.amountPaid || 0;
    const totalAmount = existingInvoice.totalAmount;
    const currentDue = existingInvoice.amountDue > 0 ? existingInvoice.amountDue : Math.max(0, totalAmount - currentPaid);

    // Overpayment Protection
    if (parsed.amount > currentDue + 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OVERPAYMENT_EXCEEDED',
            message: `Payment amount (₹${parsed.amount}) cannot exceed remaining balance due (₹${currentDue}).`,
          },
        },
        { status: 400 }
      );
    }

    const newAmountPaid = currentPaid + parsed.amount;
    const newAmountDue = Math.max(0, totalAmount - newAmountPaid);
    const newStatus = newAmountDue <= 0.01 ? 'PAID' : 'PARTIALLY_PAID';

    let resultData: any = null;
    try {
      const count = await prisma.paymentRecord.count();
      const paymentNumber = generatePaymentNumber(count + 1);

      resultData = await prisma.$transaction(async (tx) => {
        const paymentRecord = await tx.paymentRecord.create({
          data: {
            paymentNumber,
            invoiceId: existingInvoice.id,
            amount: parsed.amount,
            paymentMode: parsed.paymentMode as any,
            transactionRef: parsed.transactionRef,
            notes: parsed.notes,
            receivedByUserId: user.id,
          },
        });

        const updatedInvoice = await tx.invoice.update({
          where: { id: existingInvoice.id },
          data: {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            status: newStatus as any,
            paymentMode: parsed.paymentMode as any,
          },
          include: {
            items: true,
            payments: true,
          },
        });

        return { paymentRecord, invoice: updatedInvoice };
      });
    } catch {
      // Memory mock store fallback
      const idx = mockInvoices.findIndex((i) => i.id === existingInvoice.id);
      const paymentNumber = generatePaymentNumber(Date.now() % 100000);
      const mockPaymentRecord = {
        id: `pay-${Date.now()}`,
        paymentNumber,
        invoiceId: existingInvoice.id,
        amount: parsed.amount,
        paymentMode: parsed.paymentMode,
        transactionRef: parsed.transactionRef,
        notes: parsed.notes,
        receivedByUserId: user.id,
        createdAt: new Date().toISOString(),
      };

      if (idx !== -1) {
        mockInvoices[idx] = {
          ...mockInvoices[idx],
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus as any,
          paymentMode: parsed.paymentMode,
        };
        resultData = { paymentRecord: mockPaymentRecord, invoice: mockInvoices[idx] };
      }
    }

    logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'PAYMENT_RECORDED',
      entityType: 'Invoice',
      entityId: existingInvoice.id,
      target: `Invoice #${existingInvoice.invoiceNumber} (Paid: ₹${parsed.amount}, Due: ₹${newAmountDue})`,
      metadata: {
        invoiceId: existingInvoice.id,
        invoiceNumber: existingInvoice.invoiceNumber,
        paymentId: resultData?.paymentRecord?.id,
        paymentNumber: resultData?.paymentRecord?.paymentNumber,
        amountPaid: parsed.amount,
        totalAmountPaid: newAmountPaid,
        remainingDue: newAmountDue,
        newStatus,
        paymentMode: parsed.paymentMode,
      },
    });

    return NextResponse.json({ success: true, data: resultData }, { status: 201 });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payment data', fields: err.flatten() } },
        { status: 400 }
      );
    }
    if (err.statusCode) {
      return NextResponse.json({ success: false, error: { code: err.code || 'UNAUTHORIZED', message: err.message } }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Server error' } }, { status: 500 });
  }
}

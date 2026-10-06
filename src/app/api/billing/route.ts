import { NextResponse } from 'next/server';
import { requireAuth, verifyPatientOwnership } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { createInvoiceSchema } from '@/lib/validation/schemas';
import { logAuditEvent } from '@/lib/security/audit';
import { generateInvoiceNumber } from '@/lib/utils/localization';
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

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req.headers);

    const { searchParams } = new URL(req.url);
    const patientIdParam = searchParams.get('patientId');
    const statusParam = searchParams.get('status');
    const appointmentIdParam = searchParams.get('appointmentId');

    let targetPatientId: string | undefined = undefined;

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

      if (patientIdParam && patientIdParam !== patientId) {
        return NextResponse.json(
          { success: false, error: { code: 'IDOR_FORBIDDEN', message: 'You are not authorized to view invoices for another patient.' } },
          { status: 403 }
        );
      }
      targetPatientId = patientId;
    } else if (user.role === 'DOCTOR') {
      let doctorId = user.doctorId;
      if (!doctorId) {
        try {
          const doc = await prisma.doctor.findUnique({ where: { userId: user.id } });
          doctorId = doc?.id;
        } catch {
          // mock fallback
        }
      }

      if (patientIdParam) {
        if (doctorId) {
          const hasAccess = await checkClinicalAccess(patientIdParam, doctorId);
          if (!hasAccess) {
            return NextResponse.json(
              { success: false, error: { code: 'FORBIDDEN', message: 'Doctor does not have clinical relationship with this patient.' } },
              { status: 403 }
            );
          }
        }
        targetPatientId = patientIdParam;
      }
    } else if (user.role === 'ADMIN') {
      if (patientIdParam) {
        targetPatientId = patientIdParam;
      }
    }

    let invoices: any[] = [];
    try {
      const where: any = {};
      if (targetPatientId) where.patientId = targetPatientId;
      if (statusParam) where.status = statusParam;
      if (appointmentIdParam) where.appointmentId = appointmentIdParam;

      invoices = await prisma.invoice.findMany({
        where,
        include: {
          patient: true,
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Memory mock fallback
      invoices = mockInvoices.filter((inv) => {
        if (targetPatientId && inv.patientId !== targetPatientId) return false;
        if (statusParam && inv.status !== statusParam) return false;
        if (appointmentIdParam && inv.appointmentId !== appointmentIdParam) return false;
        return true;
      });
    }

    logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'INVOICE_LIST_VIEWED',
      entityType: 'Invoice',
      entityId: targetPatientId || 'ALL',
      metadata: { patientId: targetPatientId, totalFound: invoices.length },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (err: any) {
    if (err.statusCode) {
      return NextResponse.json({ success: false, error: { code: err.code || 'UNAUTHORIZED', message: err.message } }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Server error' } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth(req.headers);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only hospital billing administrators can generate invoices.' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createInvoiceSchema.parse(body);

    const subtotal = parsed.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = parsed.discount || 0;
    const tax = parsed.tax || 0;
    const totalAmount = Math.max(0, subtotal + tax - discount);
    const amountPaid = parsed.status === 'PAID' ? totalAmount : 0;
    const amountDue = totalAmount - amountPaid;

    let createdInvoice: any = null;
    try {
      const count = await prisma.invoice.count();
      const invoiceNumber = generateInvoiceNumber(count + 1);

      createdInvoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoice.create({
          data: {
            invoiceNumber,
            patientId: parsed.patientId,
            appointmentId: parsed.appointmentId,
            consultationId: parsed.consultationId,
            prescriptionId: parsed.prescriptionId,
            serviceName: parsed.serviceName || 'Ophthalmology Services',
            subtotal,
            discount,
            tax,
            totalAmount,
            amountPaid,
            amountDue,
            paymentMode: parsed.paymentMode as any,
            status: parsed.status as any,
            notes: parsed.notes,
            dueDate: parsed.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
            items: {
              create: parsed.items.map((item) => ({
                description: item.description,
                category: item.category || 'CONSULTATION',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
              })),
            },
          },
          include: {
            items: true,
            patient: true,
          },
        });
        return inv;
      });
    } catch {
      // Mock store fallback for memory execution
      const patient = mockPatients.find((p) => p.id === parsed.patientId);
      const invoiceNumber = generateInvoiceNumber(mockInvoices.length + 1);
      const newMockInv: any = {
        id: `inv-${Date.now()}`,
        invoiceNumber,
        patientId: parsed.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient',
        appointmentId: parsed.appointmentId,
        consultationId: parsed.consultationId,
        prescriptionId: parsed.prescriptionId,
        serviceName: parsed.serviceName || 'Ophthalmology Services',
        subtotal,
        discount,
        tax,
        totalAmount,
        amountPaid,
        amountDue,
        paymentMode: parsed.paymentMode,
        status: parsed.status,
        notes: parsed.notes,
        dueDate: parsed.dueDate || new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        items: parsed.items.map((item, idx) => ({
          id: `ii-mock-${Date.now()}-${idx}`,
          description: item.description,
          category: item.category || 'CONSULTATION',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      };
      mockInvoices.unshift(newMockInv);
      createdInvoice = newMockInv;
    }

    logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'INVOICE_CREATED',
      entityType: 'Invoice',
      entityId: createdInvoice.id,
      target: `Invoice #${createdInvoice.invoiceNumber} (₹${totalAmount})`,
      metadata: {
        invoiceId: createdInvoice.id,
        invoiceNumber: createdInvoice.invoiceNumber,
        patientId: parsed.patientId,
        totalAmount,
        subtotal,
        discount,
        tax,
      },
    });

    return NextResponse.json({ success: true, data: createdInvoice }, { status: 201 });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid invoice request data', fields: err.flatten() } },
        { status: 400 }
      );
    }
    if (err.statusCode) {
      return NextResponse.json({ success: false, error: { code: err.code || 'UNAUTHORIZED', message: err.message } }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Server error' } }, { status: 500 });
  }
}

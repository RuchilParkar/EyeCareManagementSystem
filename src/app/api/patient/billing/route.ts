import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { logAuditEvent } from '@/lib/security/audit';
import { mockInvoices, mockPatients } from '@/mock';

export async function GET(req: Request) {
  try {
    const user = await requireAuth(req.headers);

    let resolvedPatientId = user.patientId;
    if (!resolvedPatientId) {
      try {
        const pat = await prisma.patient.findUnique({ where: { userId: user.id } });
        resolvedPatientId = pat?.id;
      } catch {
        const mockPat = mockPatients.find((p) => p.userId === user.id);
        resolvedPatientId = mockPat?.id;
      }
    }

    if (!resolvedPatientId && user.role === 'PATIENT') {
      return NextResponse.json({ success: true, data: [] });
    }

    let invoices: any[] = [];
    try {
      invoices = await prisma.invoice.findMany({
        where: { patientId: resolvedPatientId },
        include: {
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      invoices = mockInvoices.filter((i) => i.patientId === resolvedPatientId);
    }

    logAuditEvent({
      actorUserId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'PATIENT_BILLING_VIEWED',
      entityType: 'Invoice',
      entityId: resolvedPatientId || user.id,
      metadata: { patientId: resolvedPatientId, count: invoices.length },
    });

    return NextResponse.json({ success: true, data: invoices });
  } catch (err: any) {
    if (err.statusCode) {
      return NextResponse.json({ success: false, error: { code: err.code || 'UNAUTHORIZED', message: err.message } }, { status: err.statusCode });
    }
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message || 'Server error' } }, { status: 500 });
  }
}

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AdminGuard,
  PortalShell,
  Card,
  Badge,
  Button,
  useToast,
} from '@/components/shared';
import { billingService } from '@/lib/api/billingService';
import { Invoice } from '@/types';
import { formatINR } from '@/lib/utils/localization';

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      billingService.getInvoiceById(invoiceId).then((res) => {
        setLoading(false);
        if (res.success && res.data) {
          setInvoice(res.data);
        }
      });
    }
  }, [invoiceId]);

  const handleMarkPaid = async () => {
    if (!invoice) return;
    setUpdating(true);
    const res = await billingService.markInvoicePaid(invoice.id);
    setUpdating(false);
    if (res.success && res.data) {
      setInvoice(res.data);
      addToast({
        type: 'success',
        title: 'Invoice Paid',
        message: `Invoice ${invoice.invoiceNumber} status updated to PAID.`,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not mark invoice as paid.',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AdminGuard>
        <PortalShell activePath="/admin/billing">
          <div className="p-8 text-center text-gray-500">Loading invoice details...</div>
        </PortalShell>
      </AdminGuard>
    );
  }

  if (!invoice) {
    return (
      <AdminGuard>
        <PortalShell activePath="/admin/billing">
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-gray-800">Invoice Not Found</h2>
            <Button className="mt-4" onClick={() => router.push('/admin/billing')}>
              Return to Billing List
            </Button>
          </div>
        </PortalShell>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <PortalShell activePath="/admin/billing">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/billing')}>
                ← Back to Billing
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Invoice {invoice.invoiceNumber}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                🖨️ Print Invoice
              </Button>
              {invoice.status !== 'PAID' && (
                <Button size="sm" isLoading={updating} onClick={handleMarkPaid}>
                  ✓ Mark as Paid
                </Button>
              )}
            </div>
          </div>

          {/* Printable Invoice Card */}
          <Card className="p-8 bg-white shadow-lg border border-gray-200">
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6">
              <div>
                <h2 className="text-xl font-bold text-brand-700">CLEARVISION EYE HOSPITAL</h2>
                <p className="text-xs text-gray-500 mt-1">100 Vision Care Blvd, Suite 400</p>
                <p className="text-xs text-gray-500">Contact: +1 (800) 555-EYES | billing@clearvision.org</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-2xl font-extrabold text-gray-900">INVOICE</span>
                <p className="text-sm font-mono text-brand-600 font-semibold">{invoice.invoiceNumber}</p>
                <div className="mt-2">
                  <Badge variant={invoice.status === 'PAID' ? 'success' : 'warning'}>
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Patient & Metadata Grid */}
            <div className="grid grid-cols-2 gap-6 my-6 text-sm">
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Billed To</h3>
                <p className="font-bold text-gray-900 mt-1">{invoice.patientName}</p>
                <p className="text-xs text-gray-600">Patient ID: {invoice.patientId}</p>
              </div>
              <div className="text-right">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Billing Dates</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Issue Date: <strong className="text-gray-900">{invoice.issueDate}</strong>
                </p>
                <p className="text-xs text-gray-600">
                  Due Date: <strong className="text-gray-900">{invoice.dueDate}</strong>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-8">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 text-gray-900 font-medium">{item.description}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatINR(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right text-gray-900 font-semibold">{formatINR(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Calculation */}
            <div className="flex justify-end mt-8 border-t border-gray-200 pt-4 text-sm">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatINR(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax Amount:</span>
                  <span>{formatINR(invoice.taxAmount || invoice.tax || 0)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-brand-700">{formatINR(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-12 pt-6 border-t border-gray-100 text-center text-xs text-gray-500">
              Thank you for choosing ClearVision Eye Hospital. For inquiries regarding this invoice, please contact our financial services department.
            </div>
          </Card>
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

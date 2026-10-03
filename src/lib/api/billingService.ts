import { Invoice, ApiResponse } from '@/types';
import { mockInvoices, mockAuditLogs } from '@/mock';

const DELAY_MS = 250;

export const billingService = {
  async getInvoices(): Promise<ApiResponse<Invoice[]>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/billing');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback to mock
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    return { success: true, data: mockInvoices };
  },

  async getInvoiceById(invoiceId: string): Promise<ApiResponse<Invoice>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/billing/${invoiceId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback to mock
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const invoice = mockInvoices.find((i) => i.id === invoiceId) || mockInvoices[0];
    return { success: true, data: invoice };
  },

  async markInvoicePaid(invoiceId: string): Promise<ApiResponse<Invoice>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/billing/${invoiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PAID' }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback to mock
      }
    }
    await new Promise((res) => setTimeout(res, 300));
    const index = mockInvoices.findIndex((i) => i.id === invoiceId);
    if (index !== -1) {
      mockInvoices[index] = {
        ...mockInvoices[index],
        status: 'PAID',
      };

      // Security Audit Log
      mockAuditLogs.unshift({
        id: `log-${Date.now()}`,
        actorUserId: 'usr-adm-01',
        userName: 'Admin User',
        userRole: 'ADMIN',
        action: 'INVOICE_MARKED_PAID',
        entityType: 'Invoice',
        entityId: invoiceId,
        target: `Invoice #${mockInvoices[index].invoiceNumber} ($${mockInvoices[index].totalAmount})`,
        ipAddress: '192.168.1.10',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      return { success: true, data: mockInvoices[index] };
    }
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Invoice not found' },
    };
  },
};

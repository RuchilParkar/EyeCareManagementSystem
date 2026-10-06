'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AdminGuard,
  PortalShell,
  Card,
  Table,
  Badge,
  Button,
  Tabs,
  SearchBar,
} from '@/components/shared';
import { billingService } from '@/lib/api/billingService';
import { Invoice } from '@/types';
import { formatINR } from '@/lib/utils/localization';

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    billingService.getInvoices().then((res) => {
      setLoading(false);
      if (res.success && res.data) {
        setInvoices(res.data);
      }
    });
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'ALL' || inv.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalRevenue = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const paidRevenue = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);
  const pendingRevenue = invoices
    .filter((i) => i.status === 'PENDING')
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const tabItems = [
    { id: 'ALL', label: 'All Invoices' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'PAID', label: 'Paid' },
    { id: 'DRAFT', label: 'Draft' },
    { id: 'OVERDUE', label: 'Overdue' },
  ];

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      cell: (inv: Invoice) => (
        <span className="font-mono text-sm font-semibold text-brand-700">
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient Name',
      cell: (inv: Invoice) => (
        <div>
          <p className="font-semibold text-gray-900">{inv.patientName}</p>
          <p className="text-xs text-gray-500">ID: {inv.patientId}</p>
        </div>
      ),
    },
    {
      key: 'issueDate',
      header: 'Issue Date',
      cell: (inv: Invoice) => (
        <span className="text-sm text-gray-600">{inv.issueDate}</span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      cell: (inv: Invoice) => (
        <span className="text-sm text-gray-600">{inv.dueDate}</span>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      cell: (inv: Invoice) => (
        <span className="text-sm font-bold text-gray-900">
          {formatINR(inv.totalAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (inv: Invoice) => {
        let variant: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
        if (inv.status === 'PAID') variant = 'success';
        if (inv.status === 'PENDING') variant = 'warning';
        if (inv.status === 'OVERDUE') variant = 'danger';
        return <Badge variant={variant}>{inv.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: (inv: Invoice) => (
        <Link href={`/admin/billing/${inv.id}`}>
          <Button variant="outline" size="sm">
            View / Print
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <AdminGuard>
      <PortalShell activePath="/admin/billing">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hospital Billing & Financial Invoices</h1>
              <p className="text-sm text-gray-600 mt-1">Manage consultation charges, eyewear orders, optical service billing, and payment collection.</p>
            </div>
          </div>

          {/* Revenue Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-l-4 border-l-brand-600">
              <p className="text-xs font-medium text-gray-500 uppercase">Total Billed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(totalRevenue)}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-emerald-600">
              <p className="text-xs font-medium text-gray-500 uppercase">Collected Revenue</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{formatINR(paidRevenue)}</p>
            </Card>
            <Card className="p-4 border-l-4 border-l-amber-500">
              <p className="text-xs font-medium text-gray-500 uppercase">Pending Payments</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{formatINR(pendingRevenue)}</p>
            </Card>
          </div>

          {/* Filters & Tabs */}
          <Card className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search invoice number or patient..."
              />
            </div>
            <Tabs items={tabItems} activeId={activeTab} onChange={setActiveTab} />
          </Card>

          {/* Invoice Table */}
          <Card>
            {loading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading billing records...</div>
            ) : (
              <Table
                data={filteredInvoices}
                columns={columns}
                emptyMessage="No billing records match your search criteria."
              />
            )}
          </Card>
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

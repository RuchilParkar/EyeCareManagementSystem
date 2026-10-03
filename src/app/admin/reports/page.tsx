'use client';

import React, { useState } from 'react';
import {
  AdminGuard,
  PortalShell,
  Card,
  Button,
  Select,
  useToast,
} from '@/components/shared';
import { mockReportSummary } from '@/mock';

export default function AdminReportsPage() {
  const { addToast } = useToast();
  const [timeRange, setTimeRange] = useState('THIS_MONTH');

  const report = mockReportSummary;

  const handleExport = () => {
    addToast({
      type: 'info',
      title: 'Exporting Report',
      message: 'Generating CSV export for hospital operational metrics...',
    });
  };

  return (
    <AdminGuard>
      <PortalShell activePath="/admin/reports">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hospital Analytics & Operational Reports</h1>
              <p className="text-sm text-gray-600 mt-1">Comprehensive insights on revenue trends, OPD volume, surgery counts, and clinical efficiency.</p>
            </div>
            <div className="flex items-center space-x-3">
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                options={[
                  { value: 'THIS_MONTH', label: 'This Month (September 2026)' },
                  { value: 'LAST_90_DAYS', label: 'Last 90 Days' },
                  { value: 'THIS_YEAR', label: 'Year to Date (2026)' },
                ]}
              />
              <Button variant="outline" onClick={handleExport}>
                📥 Export Report
              </Button>
            </div>
          </div>

          {/* Core Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5 border-t-4 border-t-brand-600">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-2">${report.totalRevenue.toLocaleString()}</p>
              <span className="inline-block mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                +14.2% vs previous period
              </span>
            </Card>

            <Card className="p-5 border-t-4 border-t-sky-500">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">OPD Consultations</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-2">{report.totalAppointments}</p>
              <span className="inline-block mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                94.8% completion rate
              </span>
            </Card>

            <Card className="p-5 border-t-4 border-t-purple-500">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Surgeries Performed</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-2">{report.totalSurgeries}</p>
              <span className="inline-block mt-2 text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                Cataract & Refractive
              </span>
            </Card>

            <Card className="p-5 border-t-4 border-t-emerald-500">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Satisfaction</p>
              <p className="text-3xl font-extrabold text-gray-900 mt-2">{report.satisfactionRate}%</p>
              <span className="inline-block mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                Based on 420 reviews
              </span>
            </Card>
          </div>

          {/* Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue breakdown */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Stream Breakdown</h2>
              <div className="space-y-4">
                {report.revenueByCategory.map((cat, idx) => {
                  const percentage = ((cat.amount / report.totalRevenue) * 100).toFixed(1);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700">{cat.category}</span>
                        <span className="font-bold text-gray-900">${cat.amount.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-brand-600 h-2.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Department Volume */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Consultation Volume by Specialty</h2>
              <div className="space-y-4">
                {report.appointmentsBySpecialty.map((spec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{spec.specialty}</p>
                      <p className="text-xs text-gray-500">OPD & Surgical consults</p>
                    </div>
                    <span className="font-mono font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full text-sm">
                      {spec.count} visits
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

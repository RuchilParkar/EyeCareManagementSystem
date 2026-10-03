'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  FileText,
  Eye,
  CreditCard,
} from 'lucide-react';
import { PortalShell, AdminGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  Skeleton,
  EmptyState,
} from '@/components/ui';
import { patientService } from '@/lib/api/patientService';
import { billingService } from '@/lib/api/billingService';
import { Patient, Consultation, Prescription, Invoice } from '@/types';

export default function AdminPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.patientId;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [pRes, rRes, prRes, invRes] = await Promise.all([
        patientService.getPatientProfile(patientId),
        patientService.getMedicalRecords(patientId),
        patientService.getPrescriptions(patientId),
        billingService.getInvoices(),
      ]);

      if (pRes.success && pRes.data) setPatient(pRes.data);
      if (rRes.success && rRes.data) setRecords(rRes.data);
      if (prRes.success && prRes.data) setPrescriptions(prRes.data);
      if (invRes.success && invRes.data) {
        setInvoices(invRes.data.filter((i) => i.patientId === patientId));
      }
      setIsLoading(false);
    }
    loadData();
  }, [patientId]);

  return (
    <AdminGuard>
      <PortalShell>
        <div className="space-y-6">
          <div>
            <Link
              href="/admin/patients"
              className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient Directory
            </Link>
            <h1 className="text-2xl font-bold text-[#0F172A]">Master Patient Record</h1>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : !patient ? (
            <EmptyState title="Patient Not Found" description="Could not locate patient profile." />
          ) : (
            <div className="space-y-6">
              {/* Header Banner */}
              <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={`${patient.firstName} ${patient.lastName}`}
                      size="xl"
                      status="online"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="scheduled" dot={false}>PATIENT</Badge>
                        <span className="text-xs font-mono font-semibold text-[#0D9488]">
                          {patient.patientNumber}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#0F172A]">
                        {patient.firstName} {patient.lastName}
                      </h2>
                      <p className="text-xs text-[#64748B]">
                        DOB: {patient.dateOfBirth} ({patient.gender}) • Blood Group: {patient.bloodGroup || 'O+'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-[#64748B] space-y-1">
                    <p className="flex items-center justify-end gap-1 font-medium text-[#0F172A]">
                      <Phone className="w-3.5 h-3.5 text-[#0F4C81]" /> {patient.phone}
                    </p>
                    <p className="text-[11px]">{patient.address}</p>
                    <p className="text-[11px] font-semibold text-rose-600">
                      Emergency: {patient.emergencyContact}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Consultation & Prescriptions & Billing Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-[#0F4C81]">
                      <FileText className="w-4 h-4 text-[#0F4C81]" />
                      Clinical Consultations ({records.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-slate-700 space-y-2">
                    {records.map((r) => (
                      <div key={r.id} className="p-2 bg-slate-50 rounded border border-slate-100">
                        <p className="font-bold text-[#0F172A]">{r.diagnosis}</p>
                        <p className="text-[11px] text-[#64748B]">{r.createdAt.slice(0, 10)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-[#0D9488]">
                      <Eye className="w-4 h-4 text-[#0D9488]" />
                      Optical Eyewear Prescriptions ({prescriptions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-slate-700 space-y-2">
                    {prescriptions.map((pr) => (
                      <div key={pr.id} className="p-2 bg-slate-50 rounded border border-slate-100">
                        <p className="font-bold text-[#0F172A]">{pr.items[0]?.medicineName}</p>
                        <p className="text-[11px] text-[#64748B]">{pr.issuedAt.slice(0, 10)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      Billing Invoices ({invoices.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-slate-700 space-y-2">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-[#0F172A]">${inv.totalAmount}</p>
                          <p className="text-[11px] text-[#64748B]">{inv.serviceName}</p>
                        </div>
                        <Badge variant={inv.status === 'PAID' ? 'completed' : 'pending'}>
                          {inv.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

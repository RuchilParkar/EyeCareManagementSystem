'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
} from 'lucide-react';
import { PortalShell, AdminGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  Badge,
  Button,
  SearchBar,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { adminService } from '@/lib/api/adminService';
import { Patient } from '@/types';

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadPatients() {
      setIsLoading(true);
      const res = await adminService.getPatients();
      if (res.success && res.data) {
        setPatients(res.data);
      }
      setIsLoading(false);
    }
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.patientNumber.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }, [patients, searchQuery]);

  return (
    <AdminGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Patient Directory Management</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Master database of hospital registered patients and clinical histories.
              </p>
            </div>

            <div className="w-full sm:w-72 shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search patient name, ID or phone..."
              />
            </div>
          </div>

          {/* Patients Table */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : filteredPatients.length === 0 ? (
            <EmptyState
              title="No Patients Found"
              description={
                searchQuery
                  ? `No patient records matching "${searchQuery}".`
                  : 'No hospital patients registered.'
              }
            />
          ) : (
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-2xl bg-white shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0] font-semibold text-[#0F172A] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Patient Number</th>
                    <th className="p-4">Full Name</th>
                    <th className="p-4">DOB / Gender</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4">Blood Group</th>
                    <th className="p-4">Registered Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredPatients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#0D9488]">{pat.patientNumber}</td>
                      <td className="p-4 font-bold text-[#0F172A]">
                        {pat.firstName} {pat.lastName}
                      </td>
                      <td className="p-4 text-slate-700">
                        {pat.dateOfBirth} ({pat.gender})
                      </td>
                      <td className="p-4 text-slate-700">{pat.phone}</td>
                      <td className="p-4">
                        <Badge variant="active" dot={false}>{pat.bloodGroup || 'O+'}</Badge>
                      </td>
                      <td className="p-4 text-slate-600">{pat.createdAt.slice(0, 10)}</td>
                      <td className="p-4 text-right">
                        <Link href={`/admin/patients/${pat.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          >
                            View Record
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

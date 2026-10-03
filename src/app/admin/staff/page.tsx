'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalShell, AdminGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  Badge,
  SearchBar,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { adminService } from '@/lib/api/adminService';
import { StaffMember } from '@/types';

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadStaff() {
      setIsLoading(true);
      const res = await adminService.getStaffMembers();
      if (res.success && res.data) {
        setStaff(res.data);
      }
      setIsLoading(false);
    }
    loadStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff;
    const q = searchQuery.toLowerCase();
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [staff, searchQuery]);

  return (
    <AdminGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Hospital Staff Directory</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Overview of clinical nurses, receptionists, opticians, and administrative personnel.
              </p>
            </div>

            <div className="w-full sm:w-72 shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search staff name or role..."
              />
            </div>
          </div>

          {/* Staff Table */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : filteredStaff.length === 0 ? (
            <EmptyState
              title="No Staff Members Found"
              description={
                searchQuery
                  ? `No staff records match "${searchQuery}".`
                  : 'No hospital staff records available.'
              }
            />
          ) : (
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-2xl bg-white shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0] font-semibold text-[#0F172A] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Staff Name</th>
                    <th className="p-4">Assigned Role</th>
                    <th className="p-4">Phone Contact</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredStaff.map((stf) => (
                    <tr key={stf.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-[#0F172A] text-sm">{stf.name}</td>
                      <td className="p-4 font-semibold text-[#0F4C81]">{stf.role}</td>
                      <td className="p-4 text-slate-700">{stf.phone}</td>
                      <td className="p-4 text-slate-600 font-mono">{stf.email}</td>
                      <td className="p-4 text-slate-600">{stf.joinedDate}</td>
                      <td className="p-4 text-right">
                        <Badge variant="active">{stf.status}</Badge>
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

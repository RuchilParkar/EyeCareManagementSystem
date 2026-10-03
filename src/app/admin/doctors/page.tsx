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
  Avatar,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { adminService } from '@/lib/api/adminService';
import { Doctor } from '@/types';

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadDoctors() {
      setIsLoading(true);
      const res = await adminService.getDoctors();
      if (res.success && res.data) {
        setDoctors(res.data);
      }
      setIsLoading(false);
    }
    loadDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctors;
    const q = searchQuery.toLowerCase();
    return doctors.filter(
      (d) =>
        d.firstName.toLowerCase().includes(q) ||
        d.lastName.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q)
    );
  }, [doctors, searchQuery]);

  return (
    <AdminGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Doctor Roster Management</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage ophthalmologist specialists, license certifications, and schedules.
              </p>
            </div>

            <div className="w-full sm:w-72 shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search doctor or specialty..."
              />
            </div>
          </div>

          {/* Doctors Roster Cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDoctors.length === 0 ? (
            <EmptyState
              title="No Doctors Found"
              description={
                searchQuery
                  ? `No doctor profiles match "${searchQuery}".`
                  : 'No hospital doctors registered.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doc) => (
                <Card key={doc.id} hoverable>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar
                        name={`Dr. ${doc.firstName} ${doc.lastName}`}
                        src={doc.profileImage}
                        size="xl"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-[#0F172A]">
                            Dr. {doc.firstName} {doc.lastName}
                          </h3>
                          <Badge variant="active">ON DUTY</Badge>
                        </div>
                        <p className="text-xs font-semibold text-[#0D9488]">
                          {doc.specialization}
                        </p>
                        <p className="text-xs text-[#64748B]">{doc.qualification}</p>
                        <p className="text-[11px] font-mono text-slate-500">
                          Lic: {doc.licenseNumber} • Phone: {doc.phone}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-[#64748B] bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                      {doc.bio}
                    </p>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end gap-2">
                      <Link href={`/admin/doctors/${doc.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Manage Schedule & Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

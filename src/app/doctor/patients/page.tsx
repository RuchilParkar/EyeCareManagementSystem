'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
} from 'lucide-react';
import { PortalShell, DoctorGuard } from '@/components/shared';
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
import { doctorService } from '@/lib/api/doctorService';
import { Patient } from '@/types';

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadPatients() {
      setIsLoading(true);
      const res = await doctorService.getPatientsDirectory();
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
    <DoctorGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Patient Clinical Directory</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Browse hospital patient records, past consultation histories, and clinical summaries.
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

          {/* Directory Cards */}
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
          ) : filteredPatients.length === 0 ? (
            <EmptyState
              title="No Patients Found"
              description={
                searchQuery
                  ? `No patient profiles match "${searchQuery}".`
                  : 'No registered patients available.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPatients.map((pat) => (
                <Card key={pat.id} hoverable>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={`${pat.firstName} ${pat.lastName}`}
                          size="lg"
                          status="online"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[#0F172A]">
                              {pat.firstName} {pat.lastName}
                            </h3>
                            <Badge variant="active" dot={false}>
                              {pat.bloodGroup || 'O+'}
                            </Badge>
                          </div>
                          <p className="text-xs font-mono font-semibold text-[#0D9488]">
                            {pat.patientNumber}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                      <div>
                        <span className="block font-medium">DOB / Gender</span>
                        <span className="font-semibold text-[#0F172A]">
                          {pat.dateOfBirth} ({pat.gender})
                        </span>
                      </div>
                      <div>
                        <span className="block font-medium">Phone</span>
                        <span className="font-semibold text-[#0F172A]">{pat.phone}</span>
                      </div>
                    </div>

                    <div className="text-xs text-[#64748B] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <strong>Emergency Contact:</strong> {pat.emergencyContact}
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end">
                      <Link href={`/doctor/patients/${pat.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          View Full Patient Profile
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
    </DoctorGuard>
  );
}

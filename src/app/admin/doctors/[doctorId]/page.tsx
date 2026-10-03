'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { PortalShell, AdminGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  Badge,
  Avatar,
  Skeleton,
  EmptyState,
} from '@/components/ui';
import { doctorService } from '@/lib/api/doctorService';
import { Doctor, Appointment } from '@/types';

export default function AdminDoctorDetailPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const resolvedParams = use(params);
  const doctorId = resolvedParams.doctorId;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [dRes, aRes] = await Promise.all([
        doctorService.getDoctorProfile(doctorId),
        doctorService.getSchedule(doctorId),
      ]);

      if (dRes.success && dRes.data) setDoctor(dRes.data);
      if (aRes.success && aRes.data) setAppointments(aRes.data);
      setIsLoading(false);
    }
    loadData();
  }, [doctorId]);

  return (
    <AdminGuard>
      <PortalShell>
        <div className="space-y-6">
          <div>
            <Link
              href="/admin/doctors"
              className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Doctor Roster
            </Link>
            <h1 className="text-2xl font-bold text-[#0F172A]">Doctor Profile & Schedule</h1>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : !doctor ? (
            <EmptyState title="Doctor Not Found" description="Could not locate doctor profile." />
          ) : (
            <div className="space-y-6">
              {/* Doctor Header Banner */}
              <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                      src={doctor.profileImage}
                      size="xl"
                      status="online"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="in_consultation" dot={false}>OPHTHALMOLOGIST</Badge>
                        <span className="text-xs font-mono font-semibold text-[#0D9488]">
                          ID: {doctor.doctorNumber}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#0F172A]">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h2>
                      <p className="text-xs font-medium text-[#0D9488]">{doctor.specialization}</p>
                      <p className="text-xs text-[#64748B]">{doctor.qualification}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-[#64748B] space-y-1">
                    <p className="font-semibold text-[#0F172A]">Lic: {doctor.licenseNumber}</p>
                    <p>Phone: {doctor.phone}</p>
                    <Badge variant="active">ACTIVE ON CLINIC DUTY</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Appointments Queue */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#0F4C81]" />
                  Assigned OPD Consultations ({appointments.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointments.map((apt) => (
                    <Card key={apt.id} hoverable>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="scheduled">{apt.status}</Badge>
                          <span className="text-xs font-bold text-[#0F4C81]">{apt.startTime}</span>
                        </div>
                        <h4 className="font-bold text-sm text-[#0F172A]">
                          Patient: {apt.patientName || 'John Doe'}
                        </h4>
                        <p className="text-xs text-[#64748B]">{apt.serviceName}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

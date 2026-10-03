'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  PlayCircle,
} from 'lucide-react';
import { PortalShell, DoctorGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  Badge,
  BadgeVariant,
  Button,
  SearchBar,
  Tabs,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { doctorService } from '@/lib/api/doctorService';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment } from '@/types';

function getBadgeVariant(status: string): BadgeVariant {
  if (status === 'CONFIRMED' || status === 'RESCHEDULED' || status === 'REQUESTED' || status === 'scheduled' || status === 'confirmed' || status === 'rescheduled') return 'scheduled';
  if (status === 'COMPLETED' || status === 'completed') return 'completed';
  if (status === 'CANCELLED' || status === 'NO_SHOW' || status === 'cancelled' || status === 'no_show') return 'cancelled';
  if (status === 'IN_CONSULTATION' || status === 'in_consultation') return 'in_consultation';
  if (status === 'CHECKED_IN' || status === 'ARRIVED' || status === 'checked_in' || status === 'pending') return 'pending';
  return 'default';
}

export default function DoctorQueuePage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    async function loadQueue() {
      setIsLoading(true);
      const res = await doctorService.getSchedule(user?.doctorId || 'me');
      if (res.success && res.data) {
        setAppointments(res.data);
      }
      setIsLoading(false);
    }
    loadQueue();
  }, [user?.doctorId]);

  const tabs = [
    { id: 'all', label: 'All OPD Queue', count: appointments.length },
    {
      id: 'waiting',
      label: 'Waiting',
      count: appointments.filter(
        (a) => ['CONFIRMED', 'REQUESTED', 'CHECKED_IN', 'ARRIVED', 'RESCHEDULED'].includes(a.status)
      ).length,
    },
    {
      id: 'in_consultation',
      label: 'In Consultation',
      count: appointments.filter((a) => a.status === 'IN_CONSULTATION').length,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: appointments.filter((a) => a.status === 'COMPLETED').length,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: appointments.filter((a) => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length,
    },
  ];

  const filteredQueue = useMemo(() => {
    return appointments.filter((apt) => {
      // Tab filter
      if (
        activeTab === 'waiting' &&
        !['CONFIRMED', 'REQUESTED', 'CHECKED_IN', 'ARRIVED', 'RESCHEDULED'].includes(apt.status)
      ) {
        return false;
      }
      if (activeTab === 'in_consultation' && apt.status !== 'IN_CONSULTATION') {
        return false;
      }
      if (activeTab === 'completed' && apt.status !== 'COMPLETED') {
        return false;
      }
      if (activeTab === 'cancelled' && apt.status !== 'CANCELLED' && apt.status !== 'NO_SHOW') {
        return false;
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = apt.patientName?.toLowerCase().includes(q);
        const matchesId = apt.patientId.toLowerCase().includes(q) || apt.id.toLowerCase().includes(q);
        const matchesService = apt.serviceName?.toLowerCase().includes(q);
        return matchesName || matchesId || matchesService;
      }

      return true;
    });
  }, [appointments, activeTab, searchQuery]);

  return (
    <DoctorGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">OPD Clinical Queue</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Live consultation queue management for registered outpatient appointments.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0]">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
            <div className="w-full md:w-72 shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search patient name or ID..."
              />
            </div>
          </div>

          {/* OPD Queue List / Table */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredQueue.length === 0 ? (
            <EmptyState
              title="No Queue Entries Found"
              description={
                searchQuery
                  ? `No patient records match "${searchQuery}".`
                  : 'No appointments in this queue view.'
              }
            />
          ) : (
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-2xl bg-white shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0] font-semibold text-[#0F172A] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Time & ID</th>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Service / Exam</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredQueue.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-[#0F4C81]">{apt.startTime}</div>
                        <div className="text-[11px] font-mono text-[#64748B]">{apt.id}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-[#0F172A] text-sm">
                          {apt.patientName || 'John Doe'}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          ID: {apt.patientId} • Male (38y)
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-[#0F172A]">{apt.serviceName}</div>
                        <div className="text-[11px] text-[#64748B] line-clamp-1">
                          Reason: {apt.reason || 'General vision check'}
                        </div>
                      </td>

                      <td className="p-4">
                        <Badge variant={getBadgeVariant(apt.status)}>{apt.status}</Badge>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/doctor/patients/${apt.patientId}`}>
                            <Button variant="ghost" size="sm">
                              History
                            </Button>
                          </Link>

                          <Link href={`/doctor/consultations/${apt.id}`}>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                            >
                              {apt.status === 'COMPLETED'
                                ? 'View EMR'
                                : apt.status === 'IN_CONSULTATION'
                                ? 'Continue EMR'
                                : 'Start Consult'}
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PortalShell>
    </DoctorGuard>
  );
}

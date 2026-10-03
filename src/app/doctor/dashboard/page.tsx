'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Users,
  CheckCircle,
  Clock,
  ArrowRight,
  PlayCircle,
} from 'lucide-react';
import { PortalShell, DoctorGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  Badge,
  BadgeVariant,
  Button,
  Avatar,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { doctorService } from '@/lib/api/doctorService';
import { useAuth } from '@/contexts/AuthContext';
import { Doctor, Appointment } from '@/types';

function getBadgeVariant(status: string): BadgeVariant {
  if (status === 'CONFIRMED' || status === 'RESCHEDULED' || status === 'REQUESTED' || status === 'scheduled' || status === 'confirmed' || status === 'rescheduled') return 'scheduled';
  if (status === 'COMPLETED' || status === 'completed') return 'completed';
  if (status === 'CANCELLED' || status === 'NO_SHOW' || status === 'cancelled' || status === 'no_show') return 'cancelled';
  if (status === 'IN_CONSULTATION' || status === 'in_consultation') return 'in_consultation';
  if (status === 'CHECKED_IN' || status === 'ARRIVED' || status === 'checked_in' || status === 'pending') return 'pending';
  return 'default';
}

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      const docId = user?.doctorId || 'me';
      const [profRes, aptRes] = await Promise.all([
        doctorService.getDoctorProfile(docId),
        doctorService.getSchedule(docId),
      ]);

      if (profRes.success && profRes.data) setProfile(profRes.data);
      if (aptRes.success && aptRes.data) setAppointments(aptRes.data);
      setIsLoading(false);
    }
    loadDashboard();
  }, [user?.doctorId]);

  const waitingQueue = appointments.filter(
    (a) => ['CONFIRMED', 'REQUESTED', 'CHECKED_IN', 'ARRIVED', 'RESCHEDULED', 'scheduled', 'pending', 'checked_in', 'rescheduled'].includes(a.status)
  );

  const inConsultationQueue = appointments.filter((a) => a.status === 'IN_CONSULTATION');
  const completedQueue = appointments.filter((a) => a.status === 'COMPLETED');

  return (
    <DoctorGuard>
      <PortalShell>
        <div className="space-y-8">
          {/* Doctor Greeting Header */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                name={profile ? `Dr. ${profile.firstName} ${profile.lastName}` : 'Dr. Elena Vance'}
                src={profile?.profileImage}
                size="xl"
                status="online"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="in_consultation" dot={false}>
                    OPHTHALMOLOGY CLINIC
                  </Badge>
                  <span className="text-xs font-mono font-semibold text-[#0D9488]">
                    ID: {profile?.doctorNumber || 'DOC-1001'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A]">
                  Good Morning, Dr. {profile?.lastName || 'Vance'}
                </h1>
                <p className="text-xs text-[#64748B]">
                  {profile?.specialization || 'Cornea & Refractive Specialist'} • Lic:{' '}
                  {profile?.licenseNumber || 'MD-OPHTH-88492'}
                </p>
              </div>
            </div>

            <Link href="/doctor/queue">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to OPD Queue ({waitingQueue.length + inConsultationQueue.length})
              </Button>
            </Link>
          </div>

          {/* Quick OPD Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Today&apos;s Appointments</p>
                  <p className="text-2xl font-bold text-[#0F172A] mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : appointments.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0F4C81] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Waiting Room</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : waitingQueue.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">In Consultation</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : inConsultationQueue.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Completed Today</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : completedQueue.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's OPD Queue Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0F4C81]" />
                Today&apos;s OPD Queue Preview
              </h2>
              <Link
                href="/doctor/queue"
                className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1"
              >
                View Full Queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <Card>
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ) : appointments.length === 0 ? (
              <EmptyState
                title="OPD Queue Empty"
                description="No patient consultations registered for today's clinic hours."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.slice(0, 4).map((apt) => (
                  <Card key={apt.id} hoverable>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant={getBadgeVariant(apt.status)}>{apt.status}</Badge>
                          <h3 className="text-base font-bold text-[#0F172A] mt-2">
                            {apt.patientName || 'John Doe'}
                          </h3>
                          <p className="text-xs text-[#64748B]">{apt.serviceName}</p>
                        </div>

                        <div className="text-right text-xs">
                          <p className="font-bold text-[#0F4C81]">{apt.startTime}</p>
                          <p className="text-[11px] text-[#64748B]">{apt.appointmentDate}</p>
                        </div>
                      </div>

                      {apt.reason && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                          <strong>Chief Complaint:</strong> {apt.reason}
                        </p>
                      )}

                      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                        <Link
                          href={`/doctor/patients/${apt.patientId}`}
                          className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
                        >
                          View Patient History
                        </Link>

                        <Link href={`/doctor/consultations/${apt.id}`}>
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                          >
                            {apt.status === 'COMPLETED'
                              ? 'View Consultation'
                              : apt.status === 'IN_CONSULTATION'
                              ? 'Continue Consultation'
                              : 'Start Consultation'}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </PortalShell>
    </DoctorGuard>
  );
}

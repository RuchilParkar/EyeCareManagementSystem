'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  FileText,
  Eye,
  PlusCircle,
  UserCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  MapPin,
  Stethoscope,
} from 'lucide-react';
import { PortalShell, PatientGuard } from '@/components/shared';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Avatar,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { patientService } from '@/lib/api/patientService';
import { Appointment, Consultation, Prescription, Patient } from '@/types';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      const targetId = user?.patientId || 'me';
      const [profRes, aptRes, recRes, prscRes] = await Promise.all([
        patientService.getPatientProfile(targetId),
        patientService.getAppointments(targetId),
        patientService.getMedicalRecords(targetId),
        patientService.getPrescriptions(targetId),
      ]);

      if (profRes.success && profRes.data) setProfile(profRes.data);
      if (aptRes.success && aptRes.data) setAppointments(aptRes.data);
      if (recRes.success && recRes.data) setRecords(recRes.data);
      if (prscRes.success && prscRes.data) setPrescriptions(prscRes.data);
      setIsLoading(false);
    }

    loadDashboardData();
  }, [user]);

  const upcomingAppointment = appointments.find(
    (a) => ['CONFIRMED', 'REQUESTED', 'CHECKED_IN', 'ARRIVED', 'IN_CONSULTATION', 'RESCHEDULED'].includes(a.status)
  );

  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <PatientGuard>
      <PortalShell>
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar
                name={profile ? `${profile.firstName} ${profile.lastName}` : 'John Doe'}
                size="xl"
                status="online"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="scheduled" dot={false}>PATIENT PORTAL</Badge>
                  <span className="text-xs font-semibold text-[#0D9488]">
                    ID: {profile?.patientNumber || 'PAT-2026-0042'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[#0F172A]">
                  Welcome back, {profile?.firstName || 'John'} {profile?.lastName || 'Doe'}
                </h1>
                <p className="text-xs text-[#64748B]">
                  ClearVision Optical Portal • Blood Group: {profile?.bloodGroup || 'O+'}
                </p>
              </div>
            </div>

            <Link href="/patient/appointments/book">
              <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Book New Appointment
              </Button>
            </Link>
          </div>

          {/* Quick Summary Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Upcoming Visits</p>
                  <p className="text-2xl font-bold text-[#0F172A] mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : upcomingAppointment ? 1 : 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Completed Visits</p>
                  <p className="text-2xl font-bold text-[#0F172A] mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : completedCount}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Medical Records</p>
                  <p className="text-2xl font-bold text-[#0F172A] mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : records.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Active Prescriptions</p>
                  <p className="text-2xl font-bold text-[#0F172A] mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : prescriptions.length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Featured Upcoming Appointment Card & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upcoming Appointment */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0F4C81]" />
                  Next Scheduled Appointment
                </h2>
                <Link href="/patient/appointments" className="text-xs font-semibold text-[#0F4C81] hover:underline">
                  View All Appointments
                </Link>
              </div>

              {isLoading ? (
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ) : upcomingAppointment ? (
                <Card hoverable className="border-[#0F4C81]/30 bg-gradient-to-r from-white to-sky-50/30">
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <div>
                      <Badge
                        variant={
                          upcomingAppointment.status === 'CONFIRMED' ||
                          upcomingAppointment.status === 'RESCHEDULED' ||
                          upcomingAppointment.status === 'REQUESTED'
                            ? 'scheduled'
                            : upcomingAppointment.status === 'IN_CONSULTATION'
                            ? 'in_consultation'
                            : upcomingAppointment.status === 'CHECKED_IN' || upcomingAppointment.status === 'ARRIVED'
                            ? 'pending'
                            : upcomingAppointment.status === 'COMPLETED'
                            ? 'completed'
                            : upcomingAppointment.status === 'CANCELLED' || upcomingAppointment.status === 'NO_SHOW'
                            ? 'cancelled'
                            : 'default'
                        }
                      >
                        {upcomingAppointment.status}
                      </Badge>
                      <CardTitle className="text-lg mt-2">{upcomingAppointment.serviceName}</CardTitle>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-[#0F4C81]">{upcomingAppointment.appointmentDate}</p>
                      <p className="text-xs font-medium text-[#64748B]">{upcomingAppointment.startTime} - {upcomingAppointment.endTime}</p>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 pt-2 text-xs text-[#0F172A]">
                      <Stethoscope className="w-4 h-4 text-[#0D9488] shrink-0" />
                      <span className="font-semibold">{upcomingAppointment.doctorName}</span>
                      <span className="text-[#64748B]">• Cornea & Refractive Center</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#64748B]">
                      <MapPin className="w-4 h-4 text-[#0D9488] shrink-0" />
                      <span>100 Medical Center Pkwy, Suite 400 (Room 302)</span>
                    </div>

                    {upcomingAppointment.reason && (
                      <p className="text-xs text-slate-600 bg-white/80 p-2.5 rounded-lg border border-[#E2E8F0]">
                        <strong>Reason:</strong> {upcomingAppointment.reason}
                      </p>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Link href="/patient/appointments" className="w-full">
                      <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Manage Appointment Details
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ) : (
                <EmptyState
                  title="No Upcoming Appointments"
                  description="You have no active eye care appointments scheduled at this time."
                  action={
                    <Link href="/patient/appointments/book">
                      <Button size="sm" variant="primary">
                        Book Consultation
                      </Button>
                    </Link>
                  }
                />
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0F172A]">Quick Patient Actions</h2>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Link href="/patient/appointments/book" className="block">
                    <Button variant="primary" className="w-full justify-start h-11" leftIcon={<Calendar className="w-4 h-4" />}>
                      Book Eye Consultation
                    </Button>
                  </Link>

                  <Link href="/patient/records" className="block">
                    <Button variant="outline" className="w-full justify-start h-11" leftIcon={<FileText className="w-4 h-4" />}>
                      View Consultation Records
                    </Button>
                  </Link>

                  <Link href="/patient/prescriptions" className="block">
                    <Button variant="outline" className="w-full justify-start h-11" leftIcon={<Eye className="w-4 h-4" />}>
                      View Optical Prescriptions
                    </Button>
                  </Link>

                  <Link href="/patient/profile" className="block">
                    <Button variant="ghost" className="w-full justify-start h-11 text-[#64748B]" leftIcon={<UserCheck className="w-4 h-4" />}>
                      Update Personal Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Recent Optical Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Consultation Record */}
              {records.length > 0 && (
                <Card hoverable>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="completed">Consultation Completed</Badge>
                      <span className="text-[10px] text-[#64748B]">{records[0].createdAt.slice(0, 10)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A]">{records[0].diagnosis}</h3>
                    <p className="text-xs text-[#64748B] line-clamp-2">{records[0].chiefComplaint}</p>
                    <div className="pt-2">
                      <Link href="/patient/records" className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1">
                        View Clinical Report <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Prescription */}
              {prescriptions.length > 0 && (
                <Card hoverable>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="active">Active RX</Badge>
                      <span className="text-[10px] text-[#64748B]">{prescriptions[0].issuedAt.slice(0, 10)}</span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A]">{prescriptions[0].items[0]?.medicineName}</h3>
                    <p className="text-xs text-[#64748B]">{prescriptions[0].notes || 'Wear corrective optical lenses as prescribed.'}</p>
                    <div className="pt-2">
                      <Link href="/patient/prescriptions" className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1">
                        View Complete Prescription <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </PortalShell>
    </PatientGuard>
  );
}

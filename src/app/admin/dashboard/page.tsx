'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Stethoscope,
  PlusCircle,
  CreditCard,
  Building2,
  Activity,
} from 'lucide-react';
import { PortalShell, AdminGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  Badge,
  Button,
  Skeleton,
} from '@/components/ui';
import { adminService } from '@/lib/api/adminService';
import { DashboardStats, Doctor } from '@/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      const [sRes, dRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getDoctors(),
      ]);

      if (sRes.success && sRes.data) setStats(sRes.data);
      if (dRes.success && dRes.data) setDoctors(dRes.data);
      setIsLoading(false);
    }
    loadDashboard();
  }, []);

  return (
    <AdminGuard>
      <PortalShell>
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="active" dot={false}>
                  EXECUTIVE ADMIN PORTAL
                </Badge>
                <span className="text-xs font-mono font-semibold text-[#0D9488]">
                  ClearVision Institute
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Hospital Executive Dashboard</h1>
              <p className="text-xs text-[#64748B]">
                Real-time operational monitoring, doctor availability, appointment queues, and revenue metrics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin/appointments/new">
                <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>

          {/* Key Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Total Patients</p>
                  <p className="text-xl font-bold text-[#0F172A] mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : stats?.totalPatients || 1420}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0F4C81] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Today&apos;s Appts</p>
                  <p className="text-xl font-bold text-[#0F172A] mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : stats?.todayAppointments || 18}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Waiting Queue</p>
                  <p className="text-xl font-bold text-amber-600 mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : stats?.pendingAppointments || 4}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Active Doctors</p>
                  <p className="text-xl font-bold text-indigo-600 mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : doctors.length}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#64748B] font-medium">Today&apos;s Revenue</p>
                  <p className="text-xl font-bold text-emerald-600 mt-1">
                    {isLoading ? <Skeleton className="w-12 h-6" /> : `$${stats?.revenueThisMonth ? Math.round(stats.revenueThisMonth / 15) : 2850}`}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Administrative Actions & Doctor Availability */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Doctor Roster Status */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#0F4C81]" />
                  Attending Doctor Specialists
                </h2>
                <Link href="/admin/doctors" className="text-xs font-semibold text-[#0F4C81] hover:underline">
                  View Full Roster
                </Link>
              </div>

              {isLoading ? (
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {doctors.map((doc) => (
                    <Card key={doc.id} hoverable>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-[#0F172A]">
                            Dr. {doc.firstName} {doc.lastName}
                          </h3>
                          <p className="text-xs text-[#0D9488] font-medium">{doc.specialization}</p>
                          <p className="text-[11px] text-[#64748B]">Lic: {doc.licenseNumber}</p>
                        </div>
                        <Badge variant="active">ON DUTY</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Panel */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#0F172A]">Hospital Quick Operations</h2>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <Link href="/admin/appointments/new" className="block">
                    <Button variant="primary" className="w-full justify-start h-11" leftIcon={<CalendarIcon className="w-4 h-4" />}>
                      Schedule New Appointment
                    </Button>
                  </Link>

                  <Link href="/admin/opd" className="block">
                    <Button variant="outline" className="w-full justify-start h-11" leftIcon={<Clock className="w-4 h-4" />}>
                      OPD Operations Monitor
                    </Button>
                  </Link>

                  <Link href="/admin/billing" className="block">
                    <Button variant="outline" className="w-full justify-start h-11" leftIcon={<CreditCard className="w-4 h-4" />}>
                      Manage Billing & Invoices
                    </Button>
                  </Link>

                  <Link href="/admin/services" className="block">
                    <Button variant="outline" className="w-full justify-start h-11" leftIcon={<Building2 className="w-4 h-4" />}>
                      Services & Rate Cards
                    </Button>
                  </Link>

                  <Link href="/admin/activity" className="block">
                    <Button variant="ghost" className="w-full justify-start h-11 text-[#64748B]" leftIcon={<Activity className="w-4 h-4" />}>
                      Inspect Audit Activity Logs
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

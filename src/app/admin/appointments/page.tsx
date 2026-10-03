'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { PortalShell, AdminGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  Badge,
  BadgeVariant,
  Button,
  SearchBar,
  Tabs,
  Modal,
  DatePicker,
  TimeSlotPicker,
  ConfirmationDialog,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { appointmentService, TimeSlot } from '@/lib/api/appointmentService';
import { patientService } from '@/lib/api/patientService';
import { useToast } from '@/contexts/ToastContext';
import { Appointment } from '@/types';

function getBadgeVariant(status: string): BadgeVariant {
  if (status === 'CONFIRMED' || status === 'RESCHEDULED' || status === 'REQUESTED' || status === 'scheduled' || status === 'confirmed' || status === 'rescheduled') return 'scheduled';
  if (status === 'COMPLETED' || status === 'completed') return 'completed';
  if (status === 'CANCELLED' || status === 'NO_SHOW' || status === 'cancelled' || status === 'no_show') return 'cancelled';
  if (status === 'IN_CONSULTATION' || status === 'in_consultation') return 'in_consultation';
  if (status === 'CHECKED_IN' || status === 'ARRIVED' || status === 'checked_in' || status === 'pending') return 'pending';
  return 'default';
}

export default function AdminAppointmentsPage() {
  const { toastSuccess, toastError } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Reschedule state
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState<boolean>(false);

  // Cancel state
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  useEffect(() => {
    async function loadAppointments() {
      setIsLoading(true);
      const res = await appointmentService.getAppointments();
      if (res.success && res.data) {
        setAppointments(res.data);
      }
      setIsLoading(false);
    }
    loadAppointments();
  }, []);

  // Fetch slots for reschedule
  useEffect(() => {
    if (!rescheduleAppointment || !rescheduleDate) return;

    async function loadSlots() {
      setIsLoadingSlots(true);
      const res = await appointmentService.getAvailableSlots(
        rescheduleAppointment?.doctorId,
        rescheduleDate
      );
      if (res.success && res.data) {
        setAvailableSlots(res.data);
      }
      setIsLoadingSlots(false);
    }

    loadSlots();
  }, [rescheduleDate, rescheduleAppointment]);

  const tabs = [
    { id: 'all', label: 'All Appointments', count: appointments.length },
    {
      id: 'scheduled',
      label: 'Scheduled',
      count: appointments.filter(
        (a) => ['CONFIRMED', 'REQUESTED', 'CHECKED_IN', 'ARRIVED', 'RESCHEDULED'].includes(a.status)
      ).length,
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

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // Tab filter
      if (
        activeTab === 'scheduled' &&
        !['CONFIRMED', 'REQUESTED', 'CHECKED_IN', 'ARRIVED', 'RESCHEDULED'].includes(apt.status)
      ) {
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
        const matchesDoctor = apt.doctorName?.toLowerCase().includes(q);
        const matchesPatient = apt.patientName?.toLowerCase().includes(q);
        const matchesService = apt.serviceName?.toLowerCase().includes(q);
        const matchesId = apt.id.toLowerCase().includes(q);
        return matchesDoctor || matchesPatient || matchesService || matchesId;
      }

      return true;
    });
  }, [appointments, activeTab, searchQuery]);

  const handleOpenReschedule = (apt: Appointment) => {
    setRescheduleAppointment(apt);
    setRescheduleDate(apt.appointmentDate);
    setRescheduleSlot(apt.startTime);
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleAppointment || !rescheduleDate || !rescheduleSlot) {
      toastError('Validation Error', 'Please select a new date and time slot.');
      return;
    }

    setIsSubmittingReschedule(true);
    const res = await appointmentService.rescheduleAppointment(
      rescheduleAppointment.id,
      rescheduleDate,
      rescheduleSlot
    );

    if (res.success && res.data) {
      toastSuccess('Rescheduled', `Appointment date updated to ${rescheduleDate} at ${rescheduleSlot}.`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === rescheduleAppointment.id ? res.data! : a))
      );
      setRescheduleAppointment(null);
    } else {
      toastError('Reschedule Failed', res.error?.message);
    }
    setIsSubmittingReschedule(false);
  };

  const handleConfirmCancel = async () => {
    if (!cancelAppointment) return;

    setIsSubmittingCancel(true);
    const res = await appointmentService.cancelAppointment(cancelAppointment.id);

    if (res.success) {
      toastSuccess('Cancelled', 'Appointment status updated to cancelled.');
      setAppointments((prev) =>
        prev.map((a) => (a.id === cancelAppointment.id ? { ...a, status: 'CANCELLED' } : a))
      );
      setCancelAppointment(null);
    } else {
      toastError('Cancellation Failed', res.error?.message);
    }
    setIsSubmittingCancel(false);
  };

  return (
    <AdminGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Master Appointment Scheduling</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage, reschedule, cancel, or schedule appointments for hospital patients.
              </p>
            </div>

            <Link href="/admin/appointments/new">
              <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Book New Appointment
              </Button>
            </Link>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0]">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
            <div className="w-full md:w-72 shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search patient, doctor or service..."
              />
            </div>
          </div>

          {/* Appointment Table */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              title="No Appointments Found"
              description={
                searchQuery
                  ? `No appointment records matching "${searchQuery}".`
                  : 'No hospital appointments scheduled under this view.'
              }
            />
          ) : (
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-2xl bg-white shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 border-b border-[#E2E8F0] font-semibold text-[#0F172A] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Ref ID</th>
                    <th className="p-4">Patient Name</th>
                    <th className="p-4">Attending Doctor</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredAppointments.map((apt) => {
                    const isUpcoming = ['scheduled', 'pending', 'rescheduled'].includes(apt.status);

                    return (
                      <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-4 font-mono font-bold text-[#0D9488]">{apt.id}</td>
                        <td className="p-4 font-bold text-[#0F172A]">
                          {apt.patientName || 'John Doe'}
                        </td>
                        <td className="p-4 text-slate-700">{apt.doctorName || 'Dr. Elena Vance'}</td>
                        <td className="p-4 text-slate-700">{apt.serviceName}</td>
                        <td className="p-4 text-slate-700">
                          {apt.appointmentDate} at {apt.startTime}
                        </td>
                        <td className="p-4">
                          <Badge variant={getBadgeVariant(apt.status)}>{apt.status}</Badge>
                        </td>
                        <td className="p-4 text-right">
                          {isUpcoming ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<RotateCcw className="w-3 h-3" />}
                                onClick={() => handleOpenReschedule(apt)}
                              >
                                Reschedule
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                leftIcon={<XCircle className="w-3 h-3" />}
                                onClick={() => setCancelAppointment(apt)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">Archived</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Reschedule Modal */}
          <Modal
            isOpen={!!rescheduleAppointment}
            onClose={() => setRescheduleAppointment(null)}
            title="Admin Appointment Reschedule"
            description="Reassign date and time slot for patient appointment."
            maxWidth="md"
            footer={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRescheduleAppointment(null)}
                  disabled={isSubmittingReschedule}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingReschedule}
                  onClick={handleConfirmReschedule}
                >
                  Update Appointment
                </Button>
              </>
            }
          >
            {rescheduleAppointment && (
              <div className="space-y-4 py-1">
                <DatePicker
                  label="Select New Date"
                  value={rescheduleDate}
                  onChange={setRescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />

                {isLoadingSlots ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <TimeSlotPicker
                    label="Available Slots"
                    slots={availableSlots}
                    selectedSlot={rescheduleSlot}
                    onSelectSlot={setRescheduleSlot}
                  />
                )}
              </div>
            )}
          </Modal>

          {/* Cancel Dialog */}
          <ConfirmationDialog
            isOpen={!!cancelAppointment}
            onClose={() => setCancelAppointment(null)}
            onConfirm={handleConfirmCancel}
            title="Cancel Appointment?"
            message={`Cancel appointment ${cancelAppointment?.id} for ${cancelAppointment?.patientName}?`}
            confirmText="Cancel Appointment"
            cancelText="Keep Appointment"
            variant="danger"
            isLoading={isSubmittingCancel}
          />
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

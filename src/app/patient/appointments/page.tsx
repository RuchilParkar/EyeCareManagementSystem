'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  PlusCircle,
  Stethoscope,
  MapPin,
  FileText,
  AlertCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { PortalShell, PatientGuard } from '@/components/shared';
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
import { patientService } from '@/lib/api/patientService';
import { appointmentService, TimeSlot } from '@/lib/api/appointmentService';
import { useToast } from '@/contexts/ToastContext';
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

export default function PatientAppointmentsPage() {
  const { toastSuccess, toastError } = useToast();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  // Modal States
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Reschedule Modal State
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);

  // Cancel Dialog State
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const res = await appointmentService.getAppointments();
      if (isMounted) {
        if (res.success && res.data) {
          setAppointments(res.data);
        } else {
          toastError('Failed to load appointments', res.error?.message);
        }
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [toastError]);

  // Fetch slots when reschedule date changes
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
      id: 'upcoming',
      label: 'Upcoming',
      count: appointments.filter(
        (a) => ['CONFIRMED', 'REQUESTED', 'CHECKED_IN', 'ARRIVED', 'IN_CONSULTATION', 'RESCHEDULED'].includes(a.status)
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
        activeTab === 'upcoming' &&
        !['CONFIRMED', 'REQUESTED', 'CHECKED_IN', 'ARRIVED', 'IN_CONSULTATION', 'RESCHEDULED'].includes(apt.status)
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
        const matchesService = apt.serviceName?.toLowerCase().includes(q);
        const matchesDate = apt.appointmentDate.includes(q);
        const matchesReason = apt.reason?.toLowerCase().includes(q);
        return matchesDoctor || matchesService || matchesDate || matchesReason;
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
      toastError('Validation Error', 'Please select both a new date and time slot.');
      return;
    }

    setIsSubmittingReschedule(true);
    const res = await appointmentService.rescheduleAppointment(
      rescheduleAppointment.id,
      rescheduleDate,
      rescheduleSlot
    );

    if (res.success && res.data) {
      toastSuccess('Appointment Rescheduled', `Updated date to ${rescheduleDate} at ${rescheduleSlot}.`);
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
      toastSuccess('Appointment Cancelled', 'Your appointment has been cancelled.');
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
    <PatientGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">My Appointments</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage, reschedule, or review your optical consultations and eye test history.
              </p>
            </div>
            <Link href="/patient/appointments/book">
              <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Book New Consultation
              </Button>
            </Link>
          </div>

          {/* Controls Bar: Tabs & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0]">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
            <div className="w-full md:w-72 shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search doctor or service..."
              />
            </div>
          </div>

          {/* Appointments Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <EmptyState
              title="No Appointments Found"
              description={
                searchQuery
                  ? `No appointments matching "${searchQuery}". Try clearing your search.`
                  : 'You have no appointments registered under this view.'
              }
              action={
                <Link href="/patient/appointments/book">
                  <Button size="sm" variant="primary">
                    Book An Appointment
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((apt) => {
                const isUpcoming = ['scheduled', 'pending', 'rescheduled'].includes(apt.status);

                return (
                  <Card key={apt.id} hoverable className="flex flex-col justify-between">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant={getBadgeVariant(apt.status)}>{apt.status}</Badge>
                          <h3 className="text-base font-bold text-[#0F172A] mt-2">
                            {apt.serviceName}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F4C81]">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            <span>{apt.appointmentDate}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-[#64748B] justify-end mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>
                              {apt.startTime} - {apt.endTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
                        <div className="flex items-center gap-2 text-xs text-[#0F172A]">
                          <Stethoscope className="w-4 h-4 text-[#0D9488] shrink-0" />
                          <span className="font-semibold">{apt.doctorName}</span>
                          <span className="text-[#64748B] text-[11px]">
                            • ClearVision Department
                          </span>
                        </div>

                        {apt.reason && (
                          <div className="text-xs text-[#64748B] bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <p className="line-clamp-2">
                              <strong>Reason:</strong> {apt.reason}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAppointment(apt);
                            setIsDetailOpen(true);
                          }}
                        >
                          View Details
                        </Button>

                        {isUpcoming && (
                          <div className="flex items-center gap-2">
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
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Details Modal */}
          <Modal
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            title="Appointment Details"
            description={`Reference ID: ${selectedAppointment?.id}`}
            maxWidth="md"
          >
            {selectedAppointment && (
              <div className="space-y-4 py-1 text-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                  <span className="text-xs text-[#64748B] font-medium">Status</span>
                  <Badge variant={getBadgeVariant(selectedAppointment.status)}>
                    {selectedAppointment.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#64748B]">Service Name</p>
                    <p className="font-semibold text-[#0F172A]">
                      {selectedAppointment.serviceName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Attending Specialist</p>
                    <p className="font-semibold text-[#0F172A]">
                      {selectedAppointment.doctorName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#64748B]">Scheduled Date</p>
                    <p className="font-semibold text-[#0F172A]">
                      {selectedAppointment.appointmentDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748B]">Time Slot</p>
                    <p className="font-semibold text-[#0F172A]">
                      {selectedAppointment.startTime} - {selectedAppointment.endTime}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#64748B]">Facility Location</p>
                  <p className="font-medium text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0D9488]" />
                    ClearVision Eye Institute • Suite 400, Examination Room 3B
                  </p>
                </div>

                {selectedAppointment.reason && (
                  <div>
                    <p className="text-xs text-[#64748B]">Patient Reason for Visit</p>
                    <p className="p-3 bg-slate-50 rounded-lg text-xs text-[#0F172A] mt-1 border border-slate-200">
                      {selectedAppointment.reason}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Modal>

          {/* Reschedule Modal */}
          <Modal
            isOpen={!!rescheduleAppointment}
            onClose={() => setRescheduleAppointment(null)}
            title="Reschedule Appointment"
            description="Select a new date and available time slot for your appointment."
            maxWidth="md"
            footer={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRescheduleAppointment(null)}
                  disabled={isSubmittingReschedule}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingReschedule}
                  onClick={handleConfirmReschedule}
                >
                  Confirm Reschedule
                </Button>
              </>
            }
          >
            {rescheduleAppointment && (
              <div className="space-y-4 py-1">
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#0F4C81] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{rescheduleAppointment.serviceName}</p>
                    <p className="text-[11px] opacity-80">
                      With {rescheduleAppointment.doctorName}
                    </p>
                  </div>
                </div>

                <DatePicker
                  label="Select New Date"
                  value={rescheduleDate}
                  onChange={setRescheduleDate}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />

                {isLoadingSlots ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <TimeSlotPicker
                    label="Available Time Slots"
                    slots={availableSlots}
                    selectedSlot={rescheduleSlot}
                    onSelectSlot={setRescheduleSlot}
                  />
                )}
              </div>
            )}
          </Modal>

          {/* Cancel Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={!!cancelAppointment}
            onClose={() => setCancelAppointment(null)}
            onConfirm={handleConfirmCancel}
            title="Cancel Appointment?"
            message={`Are you sure you want to cancel your ${cancelAppointment?.serviceName} with ${cancelAppointment?.doctorName} on ${cancelAppointment?.appointmentDate}? This action cannot be undone.`}
            confirmText="Yes, Cancel Appointment"
            cancelText="Keep Appointment"
            variant="danger"
            isLoading={isSubmittingCancel}
          />
        </div>
      </PortalShell>
    </PatientGuard>
  );
}

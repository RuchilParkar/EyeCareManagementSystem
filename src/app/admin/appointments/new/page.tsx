'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminGuard,
  PortalShell,
  Card,
  Button,
  Input,
  Select,
  Textarea,
  useToast,
} from '@/components/shared';
import { mockPatients, mockDoctors, mockServices } from '@/mock';
import { appointmentService, TimeSlot } from '@/lib/api/appointmentService';

export default function AdminNewAppointmentPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [reason, setReason] = useState('');

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isSubscribed = true;
    const fetchSlots = async () => {
      if (doctorId && appointmentDate) {
        setLoadingSlots(true);
        const res = await appointmentService.getAvailableSlots(doctorId, appointmentDate);
        if (isSubscribed) {
          setLoadingSlots(false);
          if (res.success && res.data) {
            setAvailableSlots(res.data);
          }
        }
      } else {
        if (isSubscribed) {
          setAvailableSlots([]);
        }
      }
    };
    fetchSlots();
    return () => {
      isSubscribed = false;
    };
  }, [doctorId, appointmentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !doctorId || !serviceId || !appointmentDate || !startTime) {
      addToast({ type: 'warning', title: 'Missing fields', message: 'Please fill out all required appointment details.' });
      return;
    }

    setSubmitting(true);
    const selPatient = mockPatients.find((p) => p.id === patientId);
    const selDoctor = mockDoctors.find((d) => d.id === doctorId);
    const selService = mockServices.find((s) => s.id === serviceId);

    try {
      const res = await appointmentService.bookAppointment({
        patientId,
        doctorId,
        serviceId,
        appointmentDate,
        startTime,
        reason,
        status: 'CONFIRMED',
      });

      if (res.success) {
        addToast({ type: 'success', title: 'Appointment Booked', message: `Appointment scheduled successfully for ${res.data?.patientName}.` });
        router.push('/admin/appointments');
      } else {
        addToast({ type: 'error', title: 'Booking Failed', message: res.error?.message || 'Could not schedule appointment.' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'An error occurred while booking.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <PortalShell activePath="/admin/appointments">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule New Appointment</h1>
              <p className="text-sm text-gray-600 mt-1">Book a patient appointment with specialized ophthalmology consultants.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/appointments')}>
              Back to Appointments
            </Button>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Select Patient *"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  options={[
                    { value: '', label: '-- Choose Patient --' },
                    ...mockPatients.map((p) => ({
                      value: p.id,
                      label: `${p.firstName} ${p.lastName} (${p.mrn})`,
                    })),
                  ]}
                  required
                />

                <Select
                  label="Select Doctor *"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  options={[
                    { value: '', label: '-- Choose Doctor --' },
                    ...mockDoctors.map((d) => ({
                      value: d.id,
                      label: `${d.firstName} ${d.lastName} (${d.specialization})`,
                    })),
                  ]}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Service / Procedure *"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  options={[
                    { value: '', label: '-- Choose Service --' },
                    ...mockServices.map((s) => ({
                      value: s.id,
                      label: `${s.name} ($${s.basePrice})`,
                    })),
                  ]}
                  required
                />

                <Input
                  label="Appointment Date *"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time Slot *
                </label>
                {!doctorId || !appointmentDate ? (
                  <p className="text-xs text-gray-500 italic">Please select a doctor and date first to load available slots.</p>
                ) : loadingSlots ? (
                  <p className="text-xs text-brand-600 animate-pulse">Loading available doctor slots...</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot, i) => (
                      <button
                        type="button"
                        key={i}
                        disabled={!slot.available}
                        onClick={() => setStartTime(slot.startTime)}
                        className={`p-2.5 rounded-lg text-xs font-semibold text-center border transition-all ${
                          !slot.available
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                            : startTime === slot.startTime
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-300'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-brand-500 hover:bg-brand-50'
                        }`}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Textarea
                label="Chief Complaint / Reason for Visit"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Routine vision test, blurred vision in right eye, cataract consult..."
                rows={3}
              />

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/appointments')}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  Confirm & Schedule Appointment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

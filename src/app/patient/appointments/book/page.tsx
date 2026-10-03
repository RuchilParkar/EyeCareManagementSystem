'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Stethoscope,
  Calendar as CalendarIcon,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { PortalShell, PatientGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  Textarea,
  DatePicker,
  TimeSlotPicker,
  Badge,
  Avatar,
  Skeleton,
} from '@/components/ui';
import { mockDepartments, mockServices, mockDoctors } from '@/mock';
import { appointmentService, TimeSlot } from '@/lib/api/appointmentService';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Department, Service, Doctor } from '@/types';

export default function BookAppointmentPage() {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const { user } = useAuth();

  // Wizard state (1: Dept & Service, 2: Doctor, 3: Date & Slot, 4: Review & Confirm)
  const [step, setStep] = useState<number>(1);

  // Form selections
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-01');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv-01');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-01');
  const [appointmentDate, setAppointmentDate] = useState<string>(
    () => new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('10:00');
  const [reason, setReason] = useState<string>('');

  // Slot fetching state
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filteredServices = mockServices.filter(
    (s) => s.departmentId === selectedDeptId
  );

  const filteredDoctors = mockDoctors.filter(
    (d) => !selectedDeptId || d.departmentId === selectedDeptId
  );

  const selectedDepartment: Department | undefined = mockDepartments.find(
    (d) => d.id === selectedDeptId
  );
  const selectedService: Service | undefined = mockServices.find(
    (s) => s.id === selectedServiceId
  );
  const selectedDoctor: Doctor | undefined = mockDoctors.find(
    (d) => d.id === selectedDoctorId
  );

  const handleDeptChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    const servicesInDept = mockServices.filter((s) => s.departmentId === deptId);
    if (servicesInDept.length > 0) {
      setSelectedServiceId(servicesInDept[0].id);
    }
    const doctorsInDept = mockDoctors.filter((d) => d.departmentId === deptId);
    if (doctorsInDept.length > 0) {
      setSelectedDoctorId(doctorsInDept[0].id);
    }
  };

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) return;

    async function loadSlots() {
      setIsLoadingSlots(true);
      const res = await appointmentService.getAvailableSlots(selectedDoctorId, appointmentDate);
      if (res.success && res.data) {
        setAvailableSlots(res.data);
      }
      setIsLoadingSlots(false);
    }

    loadSlots();
  }, [selectedDoctorId, appointmentDate]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedDeptId || !selectedServiceId) {
        toastError('Selection Required', 'Please select a department and a service.');
        return;
      }
    } else if (step === 2) {
      if (!selectedDoctorId) {
        toastError('Selection Required', 'Please select a doctor for your consultation.');
        return;
      }
    } else if (step === 3) {
      if (!appointmentDate || !selectedSlot) {
        toastError('Selection Required', 'Please select both an appointment date and time slot.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    const res = await appointmentService.bookAppointment({
      doctorId: selectedDoctorId,
      serviceId: selectedServiceId,
      appointmentDate,
      startTime: selectedSlot,
      reason: reason || 'Routine eye consultation',
    });

    if (res.success) {
      toastSuccess(
        'Appointment Booked!',
        `Your consultation is scheduled for ${appointmentDate} at ${selectedSlot}.`
      );
      router.push('/patient/appointments');
    } else {
      toastError('Booking Failed', res.error?.message);
    }
    setIsSubmitting(false);
  };

  return (
    <PatientGuard>
      <PortalShell>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/patient/appointments"
                className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Appointments
              </Link>
              <h1 className="text-2xl font-bold text-[#0F172A]">Book Eye Care Consultation</h1>
              <p className="text-xs text-[#64748B]">
                Follow the multi-step booking process to schedule your appointment with our eye specialists.
              </p>
            </div>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-2xs">
            <div className="grid grid-cols-4 gap-2 text-center relative">
              {[
                { stepNum: 1, label: 'Department & Service', icon: Building2 },
                { stepNum: 2, label: 'Choose Specialist', icon: Stethoscope },
                { stepNum: 3, label: 'Date & Time', icon: CalendarIcon },
                { stepNum: 4, label: 'Review & Confirm', icon: ShieldCheck },
              ].map(({ stepNum, label, icon: Icon }) => {
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;

                return (
                  <div key={stepNum} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isActive
                          ? 'bg-[#0F4C81] text-white ring-4 ring-[#0F4C81]/15'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-[11px] font-medium hidden sm:block ${
                        isActive ? 'text-[#0F4C81] font-bold' : isCompleted ? 'text-emerald-700' : 'text-[#64748B]'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {step === 1 && 'Step 1: Select Department & Service'}
                {step === 2 && 'Step 2: Select Eye Specialist'}
                {step === 3 && 'Step 3: Choose Date & Preferred Slot'}
                {step === 4 && 'Step 4: Review Appointment Summary'}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#0F172A]">Clinical Department</label>
                    <Select
                      value={selectedDeptId}
                      onChange={(e) => handleDeptChange(e.target.value)}
                      options={mockDepartments.map((d) => ({
                        value: d.id,
                        label: d.name,
                      }))}
                    />
                    {selectedDepartment && (
                      <p className="text-xs text-[#64748B] bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {selectedDepartment.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#0F172A]">Available Optical Services</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredServices.map((service) => {
                        const isSelected = selectedServiceId === service.id;

                        return (
                          <div
                            key={service.id}
                            onClick={() => setSelectedServiceId(service.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between gap-2 ${
                              isSelected
                                ? 'bg-sky-50/60 border-[#0F4C81] ring-2 ring-[#0F4C81]/20'
                                : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-[#0F172A]">{service.name}</h4>
                                <Badge variant="active" dot={false}>${service.price}</Badge>
                              </div>
                              <p className="text-xs text-[#64748B] mt-1">{service.description}</p>
                            </div>
                            <div className="text-[11px] font-semibold text-[#0F4C81]">
                              Duration: {service.durationMinutes} mins
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-[#64748B]">
                    Select an eye care specialist for your consultation.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredDoctors.map((doc) => {
                      const isSelected = selectedDoctorId === doc.id;

                      return (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoctorId(doc.id)}
                          className={`p-5 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${
                            isSelected
                              ? 'bg-sky-50/60 border-[#0F4C81] ring-2 ring-[#0F4C81]/20'
                              : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                          }`}
                        >
                          <Avatar
                            name={`Dr. ${doc.firstName} ${doc.lastName}`}
                            src={doc.profileImage}
                            size="lg"
                          />
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-[#0F172A]">
                              Dr. {doc.firstName} {doc.lastName}
                            </h4>
                            <p className="text-xs font-medium text-[#0D9488]">
                              {doc.specialization}
                            </p>
                            <p className="text-[11px] text-[#64748B] line-clamp-2">{doc.bio}</p>
                            <span className="inline-block text-[10px] text-slate-500 font-mono pt-1">
                              Lic: {doc.licenseNumber}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  <DatePicker
                    label="Select Consultation Date"
                    value={appointmentDate}
                    onChange={setAppointmentDate}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />

                  {isLoadingSlots ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (
                    <TimeSlotPicker
                      label="Select Time Slot"
                      slots={availableSlots}
                      selectedSlot={selectedSlot}
                      onSelectSlot={setSelectedSlot}
                    />
                  )}
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="space-y-6">
                  <Textarea
                    label="Reason for Visit / Symptoms (Optional)"
                    placeholder="Describe any vision problems, redness, eye strain, or general reasons for this visit..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />

                  <div className="p-5 bg-slate-50 rounded-2xl border border-[#E2E8F0] space-y-4">
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 border-b border-[#E2E8F0] pb-2">
                      <ShieldCheck className="w-4 h-4 text-[#0F4C81]" />
                      Booking Summary Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[#64748B] block">Department & Service</span>
                        <span className="font-bold text-[#0F172A]">
                          {selectedDepartment?.name} • {selectedService?.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#64748B] block">Attending Specialist</span>
                        <span className="font-bold text-[#0F172A]">
                          Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName} (
                          {selectedDoctor?.specialization})
                        </span>
                      </div>

                      <div>
                        <span className="text-[#64748B] block">Date & Time</span>
                        <span className="font-bold text-[#0F4C81]">
                          {appointmentDate} at {selectedSlot}
                        </span>
                      </div>

                      <div>
                        <span className="text-[#64748B] block">Consultation Fee</span>
                        <span className="font-bold text-[#0D9488]">
                          ${selectedService?.price || 85}.00
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                {step > 1 ? (
                  <Button
                    variant="outline"
                    size="md"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                  >
                    Previous Step
                  </Button>
                ) : (
                  <div />
                )}

                {step < 4 ? (
                  <Button
                    variant="primary"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={handleNextStep}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={handleConfirmBooking}
                  >
                    Confirm & Schedule Appointment
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalShell>
    </PatientGuard>
  );
}

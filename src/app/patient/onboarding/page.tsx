'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, UserCheck, Phone, Home, Heart, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input, Select, Button, Card, CardContent, Badge, Alert } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { patientService } from '@/lib/api/patientService';

const onboardingSchema = z.object({
  firstName: z.string().min(2, 'First name is required.'),
  lastName: z.string().min(2, 'Last name is required.'),
  phone: z.string().min(10, 'Valid phone number is required.'),
  dateOfBirth: z.string().min(1, 'Date of birth is required.'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().min(5, 'Street address is required.'),
  emergencyContact: z.string().min(5, 'Emergency contact information is required.'),
  bloodGroup: z.string().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function PatientOnboardingPage() {
  const router = useRouter();
  const { toastSuccess } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1 (555) 234-5678',
      dateOfBirth: '1990-05-15',
      gender: 'MALE',
      address: '742 Evergreen Terrace, Springfield, OR 97477',
      emergencyContact: 'Mary Doe (Wife) - +1 (555) 234-5679',
      bloodGroup: 'O+',
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);

    const res = await patientService.updatePatientProfile(user?.patientId || 'me', {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      emergencyContact: data.emergencyContact,
      bloodGroup: data.bloodGroup,
    });

    setIsLoading(false);

    if (res.success) {
      toastSuccess('Profile Completed!', 'Your patient record has been initialized.');
      router.push('/patient/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-6 text-center space-y-2">
        <Badge variant="scheduled" dot={false}>STEP 2 OF 2 • ONBOARDING</Badge>
        <h1 className="text-2xl font-extrabold text-[#0F172A]">Complete Patient Profile</h1>
        <p className="text-xs text-[#64748B]">
          Initialize your optical patient record to book appointments and view prescriptions.
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-xl mb-6">
        <div className="flex justify-between text-xs font-semibold text-[#0F172A] mb-1.5">
          <span>Profile Progress</span>
          <span className="text-[#0F4C81]">{step === 1 ? '50% Complete' : '100% Complete'}</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0F4C81] transition-all duration-300 rounded-full"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      <Card className="w-full max-w-xl shadow-xl border-[#E2E8F0]">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-[#E2E8F0] pb-3">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#0F4C81]" />
                    1. Personal Information
                  </h3>
                  <p className="text-xs text-[#64748B]">Verify your identity details for medical history tracking.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    error={errors.firstName?.message}
                    {...register('firstName')}
                    required
                  />
                  <Input
                    label="Last Name"
                    error={errors.lastName?.message}
                    {...register('lastName')}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Date of Birth"
                    type="date"
                    error={errors.dateOfBirth?.message}
                    {...register('dateOfBirth')}
                    required
                  />
                  <Select
                    label="Gender"
                    options={[
                      { label: 'Male', value: 'MALE' },
                      { label: 'Female', value: 'FEMALE' },
                      { label: 'Other', value: 'OTHER' },
                    ]}
                    error={errors.gender?.message}
                    {...register('gender')}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contact Phone"
                    leftIcon={<Phone className="w-4 h-4 text-[#64748B]" />}
                    error={errors.phone?.message}
                    {...register('phone')}
                    required
                  />
                  <Select
                    label="Blood Group (Optional)"
                    options={[
                      { label: 'O+', value: 'O+' },
                      { label: 'A+', value: 'A+' },
                      { label: 'B+', value: 'B+' },
                      { label: 'AB+', value: 'AB+' },
                      { label: 'O-', value: 'O-' },
                    ]}
                    {...register('bloodGroup')}
                  />
                </div>

                <Button
                  type="button"
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Emergency & Address
                </Button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-[#E2E8F0] pb-3">
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <Home className="w-4 h-4 text-[#0F4C81]" />
                    2. Address & Emergency Contact
                  </h3>
                  <p className="text-xs text-[#64748B]">Provide facility contact details and emergency person.</p>
                </div>

                <Input
                  label="Residential Address"
                  placeholder="Street, City, State & Zip Code"
                  leftIcon={<Home className="w-4 h-4 text-[#64748B]" />}
                  error={errors.address?.message}
                  {...register('address')}
                  required
                />

                <Input
                  label="Emergency Contact (Name, Relationship & Phone)"
                  placeholder="e.g. Mary Doe (Wife) - +1 (555) 234-5679"
                  leftIcon={<Heart className="w-4 h-4 text-[#64748B]" />}
                  error={errors.emergencyContact?.message}
                  {...register('emergencyContact')}
                  required
                />

                <Alert variant="info" title="Privacy & Security Assurance">
                  Your medical profile details are encrypted and stored in accordance with healthcare privacy guidelines.
                </Alert>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-1/3"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-2/3"
                    isLoading={isLoading}
                    rightIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Complete Profile & Continue
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

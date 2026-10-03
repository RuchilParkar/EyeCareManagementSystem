'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  HeartPulse,
  Save,
} from 'lucide-react';
import { PortalShell, PatientGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  Textarea,
  Avatar,
  Badge,
  Skeleton,
} from '@/components/ui';
import { patientService } from '@/lib/api/patientService';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { Patient } from '@/types';

// Zod Validation Schema for Patient Profile Form
const patientProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  address: z.string().min(5, 'Address is required'),
  emergencyContact: z.string().min(5, 'Emergency contact information is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
});

type PatientProfileFormData = z.infer<typeof patientProfileSchema>;

export default function PatientProfilePage() {
  const { user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [patientData, setPatientData] = useState<Patient | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PatientProfileFormData>({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'MALE',
      phone: '',
      address: '',
      emergencyContact: '',
      bloodGroup: 'O+',
    },
  });

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      const targetId = user?.patientId || 'me';
      const res = await patientService.getPatientProfile(targetId);
      if (res.success && res.data) {
        setPatientData(res.data);
        setValue('firstName', res.data.firstName);
        setValue('lastName', res.data.lastName);
        setValue('dateOfBirth', res.data.dateOfBirth);
        setValue('gender', res.data.gender);
        setValue('phone', res.data.phone);
        setValue('address', res.data.address);
        setValue('emergencyContact', res.data.emergencyContact);
        setValue('bloodGroup', res.data.bloodGroup || 'O+');
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [user, setValue]);

  const onSubmit = async (data: PatientProfileFormData) => {
    setIsSaving(true);
    const targetId = user?.patientId || 'me';
    const res = await patientService.updatePatientProfile(targetId, data);

    if (res.success && res.data) {
      setPatientData(res.data);
      toastSuccess('Profile Updated', 'Your personal and medical information has been updated.');
    } else {
      toastError('Update Failed', res.error?.message);
    }
    setIsSaving(false);
  };

  return (
    <PatientGuard>
      <PortalShell>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Patient Profile & Medical Record</h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Update your personal details, emergency contacts, and blood group info.
            </p>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 space-y-6">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Profile Card Banner */}
              <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={
                        patientData
                          ? `${patientData.firstName} ${patientData.lastName}`
                          : 'John Doe'
                      }
                      size="xl"
                      status="online"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="scheduled" dot={false}>
                          PATIENT
                        </Badge>
                        <span className="text-xs font-mono font-semibold text-[#0D9488]">
                          {patientData?.patientNumber || 'PAT-2026-0042'}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#0F172A]">
                        {patientData?.firstName} {patientData?.lastName}
                      </h2>
                      <p className="text-xs text-[#64748B]">
                        ClearVision Registered Patient • Member since Feb 2026
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSaving}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4 text-[#0F4C81]" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      {...register('firstName')}
                      error={errors.firstName?.message}
                      required
                    />

                    <Input
                      label="Last Name"
                      {...register('lastName')}
                      error={errors.lastName?.message}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Date of Birth"
                      type="date"
                      {...register('dateOfBirth')}
                      error={errors.dateOfBirth?.message}
                      required
                    />

                    <div className="w-full flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#0F172A]">Gender *</label>
                      <Select
                        {...register('gender')}
                        options={[
                          { value: 'MALE', label: 'Male' },
                          { value: 'FEMALE', label: 'Female' },
                          { value: 'OTHER', label: 'Other' },
                        ]}
                      />
                    </div>

                    <Input
                      label="Phone Number"
                      {...register('phone')}
                      error={errors.phone?.message}
                      required
                    />
                  </div>

                  <Textarea
                    label="Residential Address"
                    {...register('address')}
                    error={errors.address?.message}
                    rows={2}
                    required
                  />
                </CardContent>
              </Card>

              {/* Medical & Emergency Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-[#0D9488]" />
                    Medical Background & Emergency Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="w-full flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#0F172A]">Blood Group *</label>
                      <Select
                        {...register('bloodGroup')}
                        options={[
                          { value: 'A+', label: 'A+' },
                          { value: 'A-', label: 'A-' },
                          { value: 'B+', label: 'B+' },
                          { value: 'B-', label: 'B-' },
                          { value: 'AB+', label: 'AB+' },
                          { value: 'AB-', label: 'AB-' },
                          { value: 'O+', label: 'O+' },
                          { value: 'O-', label: 'O-' },
                        ]}
                      />
                    </div>

                    <Input
                      label="Emergency Contact (Name & Relationship & Phone)"
                      {...register('emergencyContact')}
                      error={errors.emergencyContact?.message}
                      placeholder="e.g. Mary Doe (Wife) - +1 (555) 234-5679"
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Submit Bar */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          )}
        </div>
      </PortalShell>
    </PatientGuard>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, UserPlus, Mail, Lock, Phone, User, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input, Select, Button, Card, CardContent, Alert } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authService } from '@/lib/api/authService';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name is required.'),
    lastName: z.string().min(2, 'Last name is required.'),
    email: z.string().email('Please enter a valid email address.'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits.'),
    dateOfBirth: z.string().min(1, 'Date of birth is required.'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string().min(6, 'Confirm password is required.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setRole } = useAuth();
  const { toastSuccess } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: 'MALE',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await authService.registerPatient({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
    });

    setIsLoading(false);

    if (!res.success || !res.data) {
      setErrorMsg(res.error?.message || 'Registration failed. Please check your inputs.');
      return;
    }

    setRole('PATIENT', res.data.user);
    toastSuccess('Account Created!', 'Welcome to ClearVision. Please complete your patient profile.');
    router.push('/patient/onboarding');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C81] to-[#1E3A8A] text-white flex items-center justify-center shadow-md">
            <Eye className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-[#0F172A] tracking-tight">ClearVision</span>
        </Link>
        <h1 className="text-xl font-bold text-[#0F172A]">Create Patient Account</h1>
        <p className="text-xs text-[#64748B] mt-1">Register to book appointments & access digital optical records</p>
      </div>

      <Card className="w-full max-w-xl shadow-xl border-[#E2E8F0]">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <Alert variant="error" title="Registration Error" onDismiss={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Jane"
                leftIcon={<User className="w-4 h-4 text-[#64748B]" />}
                error={errors.firstName?.message}
                {...register('firstName')}
                required
              />

              <Input
                label="Last Name"
                placeholder="Doe"
                leftIcon={<User className="w-4 h-4 text-[#64748B]" />}
                error={errors.lastName?.message}
                {...register('lastName')}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="jane.doe@example.com"
                leftIcon={<Mail className="w-4 h-4 text-[#64748B]" />}
                error={errors.email?.message}
                {...register('email')}
                required
              />

              <Input
                label="Phone Number"
                placeholder="+1 (555) 234-5678"
                leftIcon={<Phone className="w-4 h-4 text-[#64748B]" />}
                error={errors.phone?.message}
                {...register('phone')}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date of Birth"
                type="date"
                leftIcon={<Calendar className="w-4 h-4 text-[#64748B]" />}
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
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-[#64748B]" />}
                error={errors.password?.message}
                {...register('password')}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-[#64748B]" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 mt-2"
              isLoading={isLoading}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Complete Account Registration
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B]">
            Already registered?{' '}
            <Link href="/login" className="text-[#0F4C81] font-bold hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

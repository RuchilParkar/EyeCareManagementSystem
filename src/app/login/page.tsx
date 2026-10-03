'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, LogIn, Lock, Mail, UserCheck, Stethoscope, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, CardContent, Alert, Tabs } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { authService } from '@/lib/api/authService';
import { UserRole } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { role, setRole } = useAuth();
  const { toastSuccess } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultEmails: Record<UserRole, string> = {
    PATIENT: 'john.doe@example.com',
    DOCTOR: 'dr.elena.vance@clearvisioneyecare.com',
    ADMIN: 'admin@clearvisioneyecare.com',
    GUEST: 'john.doe@example.com',
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: defaultEmails[role] || defaultEmails.PATIENT,
      password: 'password123',
    },
  });

  const handleRoleTabChange = (selectedRole: string) => {
    const r = selectedRole as UserRole;
    setRole(r);
    setValue('email', defaultEmails[r] || defaultEmails.PATIENT);
    setErrorMsg(null);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await authService.login(data.email, data.password);

    setIsLoading(false);

    if (!res.success || !res.data) {
      setErrorMsg(res.error?.message || 'Invalid email or password.');
      return;
    }

    const authenticatedUser = res.data;
    setRole(authenticatedUser.role, authenticatedUser);
    toastSuccess('Signed In Successfully', `Welcome back to ClearVision ${authenticatedUser.email}.`);

    if (authenticatedUser.role === 'PATIENT') {
      router.push('/patient/dashboard');
    } else if (authenticatedUser.role === 'DOCTOR') {
      router.push('/doctor/dashboard');
    } else if (authenticatedUser.role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C81] to-[#1E3A8A] text-white flex items-center justify-center shadow-md">
            <Eye className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-[#0F172A] tracking-tight">ClearVision</span>
        </Link>
        <h1 className="text-xl font-bold text-[#0F172A]">Sign in to your Portal</h1>
        <p className="text-xs text-[#64748B] mt-1">Select your account role to continue</p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-[#E2E8F0]">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <Tabs
            variant="pills"
            activeTab={role}
            onChange={handleRoleTabChange}
            tabs={[
              { id: 'PATIENT', label: 'Patient', icon: <UserCheck className="w-3.5 h-3.5" /> },
              { id: 'DOCTOR', label: 'Doctor', icon: <Stethoscope className="w-3.5 h-3.5" /> },
              { id: 'ADMIN', label: 'Admin', icon: <Building className="w-3.5 h-3.5" /> },
            ]}
          />

          {errorMsg && (
            <Alert variant="error" title="Authentication Failed" onDismiss={() => setErrorMsg(null)}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. john.doe@example.com"
              leftIcon={<Mail className="w-4 h-4 text-[#64748B]" />}
              error={errors.email?.message}
              {...register('email')}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-[#64748B]" />}
              error={errors.password?.message}
              {...register('password')}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#64748B]">
                <input type="checkbox" className="rounded border-[#E2E8F0] text-[#0F4C81] focus:ring-[#0F4C81]" defaultChecked />
                <span>Remember me</span>
              </label>

              <Link href="/forgot-password" className="text-[#0F4C81] font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11"
              isLoading={isLoading}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In as {role.charAt(0) + role.slice(1).toLowerCase()}
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B]">
            Don&apos;t have a patient account?{' '}
            <Link href="/register" className="text-[#0F4C81] font-bold hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

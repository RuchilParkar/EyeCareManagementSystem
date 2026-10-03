'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, Lock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input, Button, Card, CardContent, Alert } from '@/components/ui';
import { useToast } from '@/contexts/ToastContext';
import { authService } from '@/lib/api/authService';

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
    confirmPassword: z.string().min(6, 'Confirm password is required.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toastSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pwdValue, setPwdValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Empty', score: 0, color: 'bg-slate-200' };
    if (pwd.length < 6) return { label: 'Too Weak', score: 25, color: 'bg-rose-500' };
    if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { label: 'Strong', score: 100, color: 'bg-emerald-500' };
    }
    return { label: 'Moderate', score: 60, color: 'bg-amber-500' };
  };

  const strength = getPasswordStrength(pwdValue);

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    const res = await authService.resetPassword('user@example.com', data.password);
    setIsLoading(false);

    if (res.success) {
      setIsSuccess(true);
      toastSuccess('Password Updated', 'Your password has been changed successfully.');
    }
  };

  const passwordRegister = register('password');

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C81] to-[#1E3A8A] text-white flex items-center justify-center shadow-md">
            <Eye className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-[#0F172A] tracking-tight">ClearVision</span>
        </Link>
        <h1 className="text-xl font-bold text-[#0F172A]">Set New Account Password</h1>
        <p className="text-xs text-[#64748B] mt-1">Choose a secure password for your portal access</p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-[#E2E8F0]">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {isSuccess ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[#0F172A]">Password Reset Complete</h2>
              <Alert variant="success">Your new password is now active. You may sign in to your account.</Alert>
              <Button variant="primary" className="w-full mt-2" onClick={() => router.push('/login')}>
                Proceed to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-[#64748B]" />}
                error={errors.password?.message}
                {...passwordRegister}
                onChange={(e) => {
                  passwordRegister.onChange(e);
                  setPwdValue(e.target.value);
                }}
                required
              />

              {pwdValue && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold text-[#64748B]">
                    <span>Password Strength:</span>
                    <span className="text-[#0F172A]">{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>
                </div>
              )}

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4 text-[#64748B]" />}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11"
                isLoading={isLoading}
              >
                Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

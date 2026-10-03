'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Input, Button, Card, CardContent, Alert } from '@/components/ui';
import { authService } from '@/lib/api/authService';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    const res = await authService.requestPasswordReset(data.email);
    setIsLoading(false);

    if (res.success && res.data) {
      setSuccessMsg(res.data.message);
    }
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
        <h1 className="text-xl font-bold text-[#0F172A]">Password Recovery</h1>
        <p className="text-xs text-[#64748B] mt-1">Enter your account email to receive password reset instructions</p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-[#E2E8F0]">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {successMsg ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-[#0F172A]">Reset Instructions Dispatched</h2>
              <Alert variant="success">{successMsg}</Alert>
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/reset-password">
                  <Button variant="primary" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Proceed to Reset Password Page
                  </Button>
                </Link>
                <Link href="/login" className="text-xs text-[#64748B] hover:text-[#0F172A] pt-2">
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="e.g. john.doe@example.com"
                leftIcon={<Mail className="w-4 h-4 text-[#64748B]" />}
                error={errors.email?.message}
                {...register('email')}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full h-11"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Instructions
              </Button>

              <div className="text-center pt-2 border-t border-[#E2E8F0] text-xs text-[#64748B]">
                Remember your password?{' '}
                <Link href="/login" className="text-[#0F4C81] font-bold hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

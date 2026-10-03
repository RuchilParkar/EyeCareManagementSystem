'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui';

/**
 * Frontend route guards are UX/access-control measures only.
 * Production authorization must be enforced by the backend/API/database layer.
 */
export interface PatientGuardProps {
  children: React.ReactNode;
}

export const PatientGuard: React.FC<PatientGuardProps> = ({ children }) => {
  const { role, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || role !== 'PATIENT') {
      router.push('/login');
    }
  }, [isAuthenticated, role, router]);

  if (!isAuthenticated || role !== 'PATIENT') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <Skeleton variant="text" className="w-48 h-5" />
        <Skeleton variant="text" className="w-64 h-4" />
      </div>
    );
  }

  return <>{children}</>;
};

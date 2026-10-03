'use client';

import React from 'react';
import { ShieldAlert, UserCheck, Stethoscope, Building } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils/cn';

export const RoleSwitcher: React.FC = () => {
  const { role, setRole } = useAuth();

  const roles: { id: UserRole; label: string; icon: React.ReactNode }[] = [
    { id: 'GUEST', label: 'Guest', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { id: 'PATIENT', label: 'Patient', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { id: 'DOCTOR', label: 'Doctor', icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { id: 'ADMIN', label: 'Hospital Admin', icon: <Building className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-[#0F172A] text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800 z-40 select-none">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
        <span className="font-semibold text-slate-200">Dev Role Switcher:</span>
        <span className="text-slate-400 text-[11px] hidden sm:inline">
          Toggle active role view for testing Phase 1 layout & permissions.
        </span>
      </div>

      <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
        {roles.map((r) => {
          const isActive = role === r.id;

          return (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all text-xs cursor-pointer',
                isActive
                  ? 'bg-[#0F4C81] text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

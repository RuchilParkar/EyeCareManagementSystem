import React from 'react';
import { cn } from '@/lib/utils/cn';

export type BadgeVariant =
  | 'scheduled'
  | 'completed'
  | 'cancelled'
  | 'in_consultation'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  dot = true,
}) => {
  const styles: Record<BadgeVariant, { bg: string; dotBg: string }> = {
    scheduled: { bg: 'bg-sky-50 text-sky-700 border-sky-200', dotBg: 'bg-sky-500' },
    completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotBg: 'bg-emerald-500' },
    cancelled: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dotBg: 'bg-rose-500' },
    in_consultation: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dotBg: 'bg-indigo-500' },
    pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dotBg: 'bg-amber-500' },
    active: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotBg: 'bg-emerald-500' },
    inactive: { bg: 'bg-slate-100 text-slate-600 border-slate-200', dotBg: 'bg-slate-400' },
    default: { bg: 'bg-slate-100 text-slate-700 border-slate-200', dotBg: 'bg-slate-500' },
    success: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dotBg: 'bg-emerald-500' },
    warning: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dotBg: 'bg-amber-500' },
    danger: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dotBg: 'bg-rose-500' },
    info: { bg: 'bg-sky-50 text-sky-700 border-sky-200', dotBg: 'bg-sky-500' },
    neutral: { bg: 'bg-slate-100 text-slate-700 border-slate-200', dotBg: 'bg-slate-500' },
  };

  const current = styles[variant] || styles.default;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
        current.bg,
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', current.dotBg)} />}
      <span>{children}</span>
    </span>
  );
};

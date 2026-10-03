import React from 'react';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-[#E2E8F0] rounded-2xl bg-slate-50/50 my-2',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-[#0F4C81] flex items-center justify-center mb-3 shadow-xs">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-[#0F172A] mb-1">{title}</h3>
      {description && <p className="text-xs text-[#64748B] max-w-sm mb-4 leading-relaxed">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};

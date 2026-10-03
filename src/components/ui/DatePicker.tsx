import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DatePickerProps {
  label?: string;
  value?: string;
  onChange?: (date: string) => void;
  min?: string;
  max?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  error,
  helperText,
  disabled,
  required,
  className,
}) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#0F172A]">
          {label}
          {required && <span className="text-[#DC2626] ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          disabled={disabled}
          required={required}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            'w-full h-10 pl-10 pr-3 py-2 bg-white text-[#0F172A] border border-[#E2E8F0] rounded-lg text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            error && 'border-[#DC2626] focus:ring-[#DC2626]',
            className
          )}
        />
        <div className="absolute left-3 text-[#64748B] pointer-events-none">
          <CalendarIcon className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <p className="text-xs text-[#DC2626] font-medium">{error}</p>
      ) : (
        helperText && <p className="text-xs text-[#64748B]">{helperText}</p>
      )}
    </div>
  );
};

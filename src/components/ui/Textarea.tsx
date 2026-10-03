import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, required, disabled, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-[#0F172A]">
            {label}
            {required && <span className="text-[#DC2626] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full p-3 bg-white text-[#0F172A] placeholder-[#64748B] border border-[#E2E8F0] rounded-lg text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed resize-y',
            error && 'border-[#DC2626] focus:ring-[#DC2626]',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-[#DC2626] font-medium">{error}</p>
        ) : (
          helperText && <p className="text-xs text-[#64748B]">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

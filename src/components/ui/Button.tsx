import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] cursor-pointer';

    const variants = {
      primary:
        'bg-[#0F4C81] text-white hover:bg-[#1E3A8A] focus:ring-[#0F4C81] shadow-sm border border-transparent',
      secondary:
        'bg-[#E0F2FE] text-[#0F4C81] hover:bg-sky-200 focus:ring-[#0F4C81] border border-transparent font-semibold',
      outline:
        'bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-slate-50 hover:border-slate-300 focus:ring-[#0F4C81]',
      ghost:
        'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 focus:ring-slate-400',
      danger:
        'bg-[#DC2626] text-white hover:bg-red-700 focus:ring-[#DC2626] shadow-sm border border-transparent',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5 h-8',
      md: 'px-4 py-2 text-sm gap-2 h-10',
      lg: 'px-5 py-2.5 text-base gap-2.5 h-12',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs text-[#64748B]', className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li className="inline-flex items-center gap-1 hover:text-[#0F172A]">
          <Home className="w-3.5 h-3.5 text-[#0F4C81]" />
          <span className="sr-only">Home</span>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="inline-flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {isLast || !item.href ? (
                <span className={cn('font-semibold text-[#0F172A]', isLast && 'text-[#0F4C81]')}>
                  {item.label}
                </span>
              ) : (
                <a href={item.href} className="hover:text-[#0F4C81] transition-colors">
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

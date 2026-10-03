import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs?: TabItem[];
  items?: TabItem[];
  activeTab?: string;
  activeId?: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  items,
  activeTab,
  activeId,
  onChange,
  className,
  variant = 'underline',
}) => {
  const tabList = tabs || items || [];
  const currentActive = activeTab || activeId || '';

  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto no-scrollbar select-none',
        variant === 'underline' && 'border-b border-[#E2E8F0]',
        className
      )}
      role="tablist"
    >
      {tabList.map((tab) => {
        const isActive = currentActive === tab.id;

        if (variant === 'pills') {
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-[#0F4C81] text-white shadow-xs font-semibold'
                  : 'bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 border border-[#E2E8F0]'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] rounded-full font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap -mb-px cursor-pointer',
              isActive
                ? 'border-[#0F4C81] text-[#0F4C81] font-semibold'
                : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-slate-300'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded-full font-semibold',
                  isActive ? 'bg-[#E0F2FE] text-[#0F4C81]' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

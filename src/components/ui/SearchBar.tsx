import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  isLoading = false,
  className,
  onClear,
}) => {
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <div className="absolute left-3 text-[#64748B] pointer-events-none">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#0F4C81]" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-9 pr-9 py-2 bg-white text-[#0F172A] placeholder-[#64748B] border border-[#E2E8F0] rounded-lg text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 text-[#64748B] hover:text-[#0F172A] p-0.5 rounded-md hover:bg-slate-100 transition-colors"
          aria-label="Clear search query"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

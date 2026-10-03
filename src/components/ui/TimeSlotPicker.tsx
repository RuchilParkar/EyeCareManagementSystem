import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface TimeSlotOption {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface TimeSlotPickerProps {
  label?: string;
  slots: TimeSlotOption[];
  selectedSlot?: string; // e.g. "10:00"
  onSelectSlot?: (startTime: string) => void;
  error?: string;
  disabled?: boolean;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  label,
  slots,
  selectedSlot,
  onSelectSlot,
  error,
  disabled,
}) => {
  return (
    <div className="w-full flex flex-col gap-2">
      {label && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]">
          <Clock className="w-3.5 h-3.5 text-[#0F4C81]" />
          <span>{label}</span>
        </div>
      )}
      {slots.length === 0 ? (
        <p className="text-xs text-[#64748B] italic py-2">No available time slots for this date.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot === slot.startTime;
            const isAvailable = slot.available && !disabled;

            return (
              <button
                key={slot.startTime}
                type="button"
                disabled={!isAvailable}
                onClick={() => isAvailable && onSelectSlot?.(slot.startTime)}
                className={cn(
                  'px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-150 text-center flex flex-col items-center justify-center gap-0.5',
                  isSelected &&
                    'bg-[#0F4C81] text-white border-[#0F4C81] shadow-sm ring-2 ring-[#0F4C81]/20',
                  !isSelected &&
                    isAvailable &&
                    'bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#0F4C81] hover:bg-sky-50/50',
                  !isAvailable &&
                    'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through opacity-60'
                )}
              >
                <span>{slot.startTime}</span>
                <span className="text-[10px] opacity-75">{slot.endTime}</span>
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="text-xs text-[#DC2626] font-medium">{error}</p>}
    </div>
  );
};

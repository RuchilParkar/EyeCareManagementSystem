import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface Column<T> {
  key?: string;
  header: string;
  sortable?: boolean;
  cell?: (item: T) => React.ReactNode;
  accessor?: (item: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
  keyExtractor?: (item: T) => string;
}

export function Table<T>({
  columns,
  data,
  sortColumn,
  sortDirection,
  onSort,
  emptyMessage = 'No records found.',
  isLoading = false,
  className,
  keyExtractor,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto border border-[#E2E8F0] rounded-xl bg-white shadow-xs', className)}>
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-50/80 border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider select-none">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={cn('px-4 py-3.5 font-semibold', col.className)}
                onClick={() => col.sortable && col.key && onSort?.(col.key)}
              >
                <div
                  className={cn(
                    'flex items-center gap-1.5',
                    col.sortable && 'cursor-pointer hover:text-[#0F172A]'
                  )}
                >
                  <span>{col.header}</span>
                  {col.sortable && col.key && (
                    <span className="text-slate-400">
                      {sortColumn === col.key ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#0F4C81]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#0F4C81]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((col, cIdx) => (
                  <td key={col.key || cIdx} className="px-4 py-4">
                    <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[#64748B]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => (
              <tr
                key={keyExtractor ? keyExtractor(item) : (item as Record<string, unknown>)?.id as string || rowIdx}
                className="hover:bg-slate-50/70 transition-colors duration-100 text-[#0F172A]"
              >
                {columns.map((col, cIdx) => (
                  <td key={col.key || cIdx} className={cn('px-4 py-3.5 align-middle', col.className)}>
                    {col.cell ? col.cell(item) : col.accessor ? col.accessor(item) : col.key ? ((item as Record<string, unknown>)[col.key] as React.ReactNode) : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

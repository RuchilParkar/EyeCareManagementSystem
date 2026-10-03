'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  FileText,
  Users,
  LayoutDashboard,
  Eye,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  Clock,
  UserCheck,
  CreditCard,
  BarChart3,
  Activity,
  Settings,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils/cn';

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onItemClick?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  onItemClick,
  className,
}) => {
  const { role, logout } = useAuth();
  const pathname = usePathname();

  const patientNav = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/patient/dashboard' },
    { label: 'Appointments', icon: Calendar, href: '/patient/appointments' },
    { label: 'Medical Records', icon: FileText, href: '/patient/records' },
    { label: 'Prescriptions', icon: Eye, href: '/patient/prescriptions' },
    { label: 'My Profile', icon: UserCheck, href: '/patient/profile' },
  ];

  const doctorNav = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/doctor/dashboard' },
    { label: 'OPD Queue', icon: Clock, href: '/doctor/queue' },
    { label: 'Patient Directory', icon: Users, href: '/doctor/patients' },
    { label: 'Prescriptions', icon: FileText, href: '/doctor/prescriptions' },
  ];

  const adminNav = [
    { label: 'Admin Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { label: 'Patients', icon: Users, href: '/admin/patients' },
    { label: 'Doctors', icon: Stethoscope, href: '/admin/doctors' },
    { label: 'Staff', icon: ShieldCheck, href: '/admin/staff' },
    { label: 'Appointments', icon: Calendar, href: '/admin/appointments' },
    { label: 'OPD Operations', icon: Clock, href: '/admin/opd' },
    { label: 'Billing & Invoices', icon: CreditCard, href: '/admin/billing' },
    { label: 'Services & Rates', icon: Building2, href: '/admin/services' },
    { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
    { label: 'Activity Logs', icon: Activity, href: '/admin/activity' },
    { label: 'System Settings', icon: Settings, href: '/admin/settings' },
  ];

  const navItems =
    role === 'DOCTOR' ? doctorNav : role === 'ADMIN' ? adminNav : patientNav;

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-[#E2E8F0] h-full transition-all duration-200 select-none relative z-20',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E8F0] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F4C81] to-[#1E3A8A] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Eye className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-[#0F172A] truncate">ClearVision</span>
              <span className="text-[10px] font-semibold text-[#0D9488] uppercase tracking-wider">
                {role} Portal
              </span>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 hidden md:flex items-center justify-center cursor-pointer"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '#' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onItemClick}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#0F4C81] text-white shadow-xs font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* Footer Sign Out */}
      <div className="p-3 border-t border-[#E2E8F0] shrink-0">
        <button
          onClick={logout}
          title={collapsed ? 'Sign Out' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

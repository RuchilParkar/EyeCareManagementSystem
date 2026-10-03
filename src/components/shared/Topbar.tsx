'use client';

import React, { useState } from 'react';
import { Bell, Menu, Check, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { SearchBar } from '@/components/ui/SearchBar';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { mockNotifications } from '@/mock';
import { Notification } from '@/types';
import { cn } from '@/lib/utils/cn';

export interface TopbarProps {
  onOpenMobileSidebar?: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileSidebar, className }) => {
  const { user, role, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
    );
  };

  return (
    <header
      className={cn(
        'h-16 bg-white border-b border-[#E2E8F0] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20',
        className
      )}
    >
      {/* Left: Mobile Menu & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search records, appointments, doctors..."
        />
      </div>

      {/* Right Actions: Notifications & Profile */}
      <div className="flex items-center gap-3 relative">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileMenuOpen(false);
            }}
            className="relative p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#DC2626] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-4 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <h4 className="text-sm font-semibold text-[#0F172A]">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#0F4C81] hover:underline font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="py-2 max-h-64 overflow-y-auto flex flex-col gap-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#64748B] text-center py-4">No notifications.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-2.5 rounded-xl text-xs flex flex-col gap-1 transition-colors border',
                        notif.readAt
                          ? 'bg-slate-50 border-transparent text-slate-600'
                          : 'bg-[#E0F2FE]/40 border-sky-200 text-[#0F172A]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{notif.title}</span>
                        <Badge variant={notif.readAt ? 'inactive' : 'scheduled'} dot={false}>
                          {notif.type}
                        </Badge>
                      </div>
                      <p className="text-slate-600">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 self-end mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileMenuOpen(!profileMenuOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors select-none"
          >
            <Avatar name={user?.email || 'User'} size="sm" status="online" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#0F172A] leading-tight">
                {user?.email ? user.email.split('@')[0] : 'Guest'}
              </span>
              <span className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">
                {role}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-[#E2E8F0] mb-1">
                <p className="text-xs font-semibold text-[#0F172A]">{user?.email}</p>
                <p className="text-[10px] text-[#0D9488] font-semibold uppercase">{role} Account</p>
              </div>

              <a
                href="#profile"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#0F172A] rounded-lg hover:bg-slate-100 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-[#64748B]" />
                Profile Settings
              </a>

              <button
                onClick={() => {
                  logout();
                  setProfileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 rounded-lg hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

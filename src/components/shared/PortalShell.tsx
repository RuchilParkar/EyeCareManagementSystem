'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Drawer } from '@/components/ui/Drawer';

export interface PortalShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export const PortalShell: React.FC<PortalShellProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block shrink-0 h-screen sticky top-0 z-30">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title="Portal Navigation"
      >
        <Sidebar
          collapsed={false}
          onItemClick={() => setMobileDrawerOpen(false)}
          className="border-none h-auto"
        />
      </Drawer>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar onOpenMobileSidebar={() => setMobileDrawerOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {children}
        </main>
      </div>
    </div>
  );
};

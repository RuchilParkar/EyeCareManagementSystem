'use client';

import React, { useState } from 'react';
import { Eye, Menu, LogIn, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useAuth } from '@/contexts/AuthContext';

export const PublicHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setRole } = useAuth();

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Services', href: '#services-preview' },
    { label: 'About', href: '#about-preview' },
    { label: 'Doctors', href: '#doctors-preview' },
    { label: 'Contact', href: '#footer' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C81] to-[#1E3A8A] text-white flex items-center justify-center shadow-md shadow-[#0F4C81]/20">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-[#0F172A] tracking-tight block leading-none">
              ClearVision
            </span>
            <span className="text-[10px] text-[#0D9488] font-semibold tracking-wider uppercase block mt-0.5">
              Eye Care Institute
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#64748B] hover:text-[#0F4C81] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRole('PATIENT')}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Sign In
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRole('PATIENT')}
            rightIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Book Appointment
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Navigation */}
      <Drawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Navigation"
      >
        <div className="flex flex-col gap-4 py-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#0F172A] p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <hr className="border-[#E2E8F0] my-2" />
          <Button
            variant="primary"
            onClick={() => {
              setRole('PATIENT');
              setMobileMenuOpen(false);
            }}
          >
            Patient Portal Login
          </Button>
        </div>
      </Drawer>
    </header>
  );
};

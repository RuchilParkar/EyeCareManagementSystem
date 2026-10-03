import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { RoleSwitcher } from '@/components/shared/RoleSwitcher';

export const metadata: Metadata = {
  title: 'Eye Care Management System | ClearVision',
  description: 'Modern healthcare SaaS platform for eye care hospitals and optical consultations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
        <AuthProvider>
          <ToastProvider>
            <RoleSwitcher />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

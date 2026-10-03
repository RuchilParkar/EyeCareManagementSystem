'use client';

import React, { useState, useEffect } from 'react';
import {
  AdminGuard,
  PortalShell,
  Card,
  Button,
  Input,
  Tabs,
  useToast,
} from '@/components/shared';
import { adminService } from '@/lib/api/adminService';
import { HospitalSettings } from '@/types';

export default function AdminSettingsPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('GENERAL');
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<HospitalSettings>({
    name: 'ClearVision Eye Hospital & Research Center',
    hospitalName: 'ClearVision Eye Hospital & Research Center',
    tagline: 'Leading Advanced Ophthalmology Care',
    phone: '+1 (800) 555-EYES',
    emergencyPhone: '+1 (800) 555-9111',
    address: '100 Vision Care Blvd, Suite 400, Boston, MA 02115',
    email: 'contact@clearvision.org',
    operatingHours: 'Mon - Sat: 08:00 AM - 08:00 PM',
    defaultSlotDuration: 30,
    maxDailyAppointmentsPerDoctor: 25,
    requireTriageBeforeDoctor: true,
    tokenPrefix: 'OPD-',
    enableAuditLogging: true,
    sessionTimeoutMinutes: 60,
    requireMfaForStaff: false,
  });

  useEffect(() => {
    adminService.getSettings().then((res) => {
      if (res.success && res.data) {
        setSettings(res.data);
      }
    });
  }, []);

  const handleChange = <K extends keyof HospitalSettings>(key: K, value: HospitalSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await adminService.updateSettings(settings);
    setSaving(false);
    if (res.success && res.data) {
      setSettings(res.data);
      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Hospital system settings have been updated successfully.',
      });
    } else {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save hospital settings.',
      });
    }
  };

  const tabs = [
    { id: 'GENERAL', label: 'Hospital Profile' },
    { id: 'CLINICAL', label: 'Clinical & OPD' },
    { id: 'SECURITY', label: 'Security & Compliance' },
  ];

  return (
    <AdminGuard>
      <PortalShell activePath="/admin/settings">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospital System Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Configure global hospital details, OPD scheduling parameters, and security policies.</p>
          </div>

          <Card className="p-6">
            <div className="mb-6 border-b border-gray-200 pb-4">
              <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {activeTab === 'GENERAL' && (
                <div className="space-y-4">
                  <h3 className="text-md font-bold text-gray-900 border-b border-gray-100 pb-2">Hospital General Details</h3>
                  <Input
                    label="Hospital Name"
                    value={settings.hospitalName}
                    onChange={(e) => handleChange('hospitalName', e.target.value)}
                  />
                  <Input
                    label="Tagline / Motto"
                    value={settings.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Primary Phone"
                      value={settings.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                    <Input
                      label="24/7 Emergency Line"
                      value={settings.emergencyPhone}
                      onChange={(e) => handleChange('emergencyPhone', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Contact Email"
                      value={settings.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                    <Input
                      label="Operating Hours"
                      value={settings.operatingHours}
                      onChange={(e) => handleChange('operatingHours', e.target.value)}
                    />
                  </div>
                  <Input
                    label="Physical Address"
                    value={settings.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
              )}

              {activeTab === 'CLINICAL' && (
                <div className="space-y-4">
                  <h3 className="text-md font-bold text-gray-900 border-b border-gray-100 pb-2">OPD & Clinical Parameters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Default Appointment Slot Duration (Mins)"
                      type="number"
                      value={settings.defaultSlotDuration}
                      onChange={(e) => handleChange('defaultSlotDuration', parseInt(e.target.value, 10))}
                    />
                    <Input
                      label="Max Daily Consultations Per Doctor"
                      type="number"
                      value={settings.maxDailyAppointmentsPerDoctor}
                      onChange={(e) => handleChange('maxDailyAppointmentsPerDoctor', parseInt(e.target.value, 10))}
                    />
                  </div>

                  <Input
                    label="OPD Token Prefix"
                    value={settings.tokenPrefix}
                    onChange={(e) => handleChange('tokenPrefix', e.target.value)}
                  />

                  <div className="flex items-center space-x-3 pt-2">
                    <input
                      type="checkbox"
                      id="requireTriage"
                      checked={settings.requireTriageBeforeDoctor}
                      onChange={(e) => handleChange('requireTriageBeforeDoctor', e.target.checked)}
                      className="h-4 w-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                    />
                    <label htmlFor="requireTriage" className="text-sm text-gray-700 font-medium">
                      Require Nurse Triage Check-in Before Doctor Consultation
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'SECURITY' && (
                <div className="space-y-4">
                  <h3 className="text-md font-bold text-gray-900 border-b border-gray-100 pb-2">Security, HIPAA & Access</h3>
                  
                  <Input
                    label="Session Timeout (Minutes)"
                    type="number"
                    value={settings.sessionTimeoutMinutes}
                    onChange={(e) => handleChange('sessionTimeoutMinutes', parseInt(e.target.value, 10))}
                  />

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="auditLogs"
                        checked={settings.enableAuditLogging}
                        onChange={(e) => handleChange('enableAuditLogging', e.target.checked)}
                        className="h-4 w-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                      />
                      <label htmlFor="auditLogs" className="text-sm text-gray-700 font-medium">
                        Enable Strict Audit Logging for all EMR access
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="mfaStaff"
                        checked={settings.requireMfaForStaff}
                        onChange={(e) => handleChange('requireMfaForStaff', e.target.checked)}
                        className="h-4 w-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                      />
                      <label htmlFor="mfaStaff" className="text-sm text-gray-700 font-medium">
                        Require Multi-Factor Authentication (MFA) for Doctor & Staff logins
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button type="submit" isLoading={saving}>
                  Save All Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </PortalShell>
    </AdminGuard>
  );
}

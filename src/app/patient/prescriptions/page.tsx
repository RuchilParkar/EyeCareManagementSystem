'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Eye,
  Pill,
  Calendar as CalendarIcon,
  Stethoscope,
  Download,
  Printer,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { PortalShell, PatientGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  Badge,
  Button,
  SearchBar,
  Modal,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { patientService } from '@/lib/api/patientService';
import { Prescription } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientPrescriptionsPage() {
  const { toastInfo, toastSuccess } = useToast();
  const { user } = useAuth();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Prescription detail modal state
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadPrescriptions() {
      setIsLoading(true);
      const res = await patientService.getPrescriptions(user?.patientId || 'me');
      if (res.success && res.data) {
        setPrescriptions(res.data);
      }
      setIsLoading(false);
    }
    loadPrescriptions();
  }, [user?.patientId]);

  const filteredPrescriptions = useMemo(() => {
    if (!searchQuery.trim()) return prescriptions;
    const q = searchQuery.toLowerCase();
    return prescriptions.filter(
      (p) =>
        p.doctorName?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q) ||
        p.items.some((item) => item.medicineName.toLowerCase().includes(q))
    );
  }, [prescriptions, searchQuery]);

  const handleDownloadRx = () => {
    toastInfo('Downloading Prescription', 'Your Rx document PDF is downloading...');
  };

  const handlePrintRx = () => {
    toastInfo('Printing Prescription', 'Sending Rx copy to printer...');
  };

  const handleOrderEyewear = () => {
    toastSuccess('Optical Shop Redirect', 'Connecting with ClearVision Partner Optical Store...');
  };

  return (
    <PatientGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Optical & Eye Prescriptions</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Access your eye medication schedules and optical lens prescriptions (Rx).
              </p>
            </div>

            <div className="w-full sm:w-72 shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search medicine or doctor..."
              />
            </div>
          </div>

          {/* Optical Rx Highlight Card */}
          <div className="bg-gradient-to-r from-[#0F4C81] to-sky-800 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="active" dot={false}>ACTIVE OPTICAL RX</Badge>
                <span className="text-xs font-semibold text-sky-200">Ref: RX-2026-889</span>
              </div>
              <h2 className="text-xl font-bold">Standard Corrective Vision Lens</h2>
              <p className="text-xs text-sky-100 max-w-xl">
                OD (Right Eye): -1.25 SPH / -0.50 CYL • OS (Left Eye): -1.00 SPH. Anti-reflective & blue light filtering recommended.
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ShoppingBag className="w-4 h-4 text-[#0F4C81]" />}
              onClick={handleOrderEyewear}
              className="bg-white text-[#0F4C81] hover:bg-sky-50 font-bold shrink-0"
            >
              Order Lenses Online
            </Button>
          </div>

          {/* Prescriptions Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <EmptyState
              title="No Prescriptions Found"
              description={
                searchQuery
                  ? `No optical prescriptions match "${searchQuery}".`
                  : 'You have no prescriptions issued yet.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrescriptions.map((prsc) => (
                <Card key={prsc.id} hoverable className="flex flex-col justify-between">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Badge variant="active">Issued Prescription</Badge>
                        <h3 className="text-base font-bold text-[#0F172A] pt-1">
                          {prsc.items[0]?.medicineName || 'Eye Drop & Lens Prescription'}
                        </h3>
                      </div>
                      <div className="text-xs font-semibold text-[#64748B] flex items-center gap-1 shrink-0">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#0F4C81]" />
                        <span>{prsc.issuedAt.slice(0, 10)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                      <div className="flex items-center gap-2 text-[#0F172A] font-medium">
                        <Stethoscope className="w-4 h-4 text-[#0D9488] shrink-0" />
                        <span>Prescribed by: {prsc.doctorName || 'Dr. Elena Vance'}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="font-semibold text-[#0F172A] block">Prescribed Items ({prsc.items.length}):</span>
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                          {prsc.items.map((item) => (
                            <li key={item.id} className="truncate">
                              {item.medicineName} ({item.dosage})
                            </li>
                          ))}
                        </ul>
                      </div>

                      {prsc.notes && (
                        <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
                          <strong>Notes:</strong> {prsc.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                        onClick={() => {
                          setSelectedPrescription(prsc);
                          setIsDetailOpen(true);
                        }}
                      >
                        View Full Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Prescription Detail Modal */}
          <Modal
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            title="Official Optical & Medication Prescription"
            description={`Prescription Ref ID: ${selectedPrescription?.id}`}
            maxWidth="xl"
            footer={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleDownloadRx}
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    onClick={handlePrintRx}
                  >
                    Print Rx
                  </Button>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Done
                </Button>
              </div>
            }
          >
            {selectedPrescription && (
              <div className="space-y-6 py-2 text-sm text-[#0F172A]">
                {/* Header Banner */}
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#0D9488] text-base">
                      ClearVision Optical Prescription
                    </h3>
                    <p className="text-xs text-teal-800">
                      Issued Date: {selectedPrescription.issuedAt.slice(0, 10)}
                    </p>
                  </div>
                  <Badge variant="active">VALID RX</Badge>
                </div>

                {/* Prescribed Items Table */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-[#0F4C81]" />
                    Prescribed Medications & Optical Specifications
                  </h4>

                  <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-[#E2E8F0] font-semibold text-[#0F172A]">
                        <tr>
                          <th className="p-3">Item / Medicine</th>
                          <th className="p-3">Dosage / Spec</th>
                          <th className="p-3">Frequency</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {selectedPrescription.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-bold text-[#0F172A]">{item.medicineName}</td>
                            <td className="p-3 text-slate-700">{item.dosage}</td>
                            <td className="p-3 text-slate-700">{item.frequency}</td>
                            <td className="p-3 text-slate-700">{item.duration}</td>
                            <td className="p-3 text-slate-600 italic">{item.instructions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Refractive Optical Specs Grid */}
                <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl space-y-3">
                  <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#0D9488]" />
                    Optical Lens Refractive Chart (OD / OS)
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <span className="font-bold text-[#0F4C81]">OD (Right Eye)</span>
                      <p className="text-slate-700 font-mono">SPH: -1.25 | CYL: -0.50 | AXIS: 180°</p>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <span className="font-bold text-[#0F4C81]">OS (Left Eye)</span>
                      <p className="text-slate-700 font-mono">SPH: -1.00 | CYL: DS | AXIS: N/A</p>
                    </div>
                  </div>
                </div>

                {selectedPrescription.notes && (
                  <div className="text-xs text-[#64748B]">
                    <strong>Special Doctor Instructions:</strong> {selectedPrescription.notes}
                  </div>
                )}
              </div>
            )}
          </Modal>
        </div>
      </PortalShell>
    </PatientGuard>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
} from 'lucide-react';
import { PortalShell, DoctorGuard } from '@/components/shared';
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
import { doctorService } from '@/lib/api/doctorService';
import { useAuth } from '@/contexts/AuthContext';
import { Prescription } from '@/types';

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadPrescriptions() {
      setIsLoading(true);
      const res = await doctorService.getDoctorPrescriptions(user?.doctorId || 'me');
      if (res.success && res.data) {
        setPrescriptions(res.data);
      }
      setIsLoading(false);
    }
    loadPrescriptions();
  }, [user?.doctorId]);

  const filteredPrescriptions = useMemo(() => {
    if (!searchQuery.trim()) return prescriptions;
    const q = searchQuery.toLowerCase();
    return prescriptions.filter(
      (p) =>
        p.patientName?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q) ||
        p.items.some((item) => item.medicineName.toLowerCase().includes(q))
    );
  }, [prescriptions, searchQuery]);

  return (
    <DoctorGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Issued Prescriptions Directory</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Overview of digital optical and eye medication prescriptions issued to patients.
              </p>
            </div>

            <div className="w-full sm:w-72 shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search patient or medicine..."
              />
            </div>
          </div>

          {/* Prescriptions List */}
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
                  ? `No prescription records match "${searchQuery}".`
                  : 'No active prescriptions issued yet.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrescriptions.map((prsc) => (
                <Card key={prsc.id} hoverable>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="active">Issued Rx</Badge>
                        <h3 className="text-base font-bold text-[#0F172A] mt-2">
                          {prsc.patientName || 'John Doe'}
                        </h3>
                        <p className="text-xs text-[#64748B]">Ref ID: {prsc.id}</p>
                      </div>

                      <div className="text-xs font-semibold text-[#64748B] flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#0F4C81]" />
                        <span>{prsc.issuedAt.slice(0, 10)}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                      <span className="font-semibold text-[#0F172A] block">
                        Prescribed Items ({prsc.items.length}):
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {prsc.items.map((item) => (
                          <li key={item.id} className="truncate">
                            {item.medicineName} ({item.dosage})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPrescription(prsc);
                          setIsDetailOpen(true);
                        }}
                      >
                        Inspect Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Modal */}
          <Modal
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            title="Prescription Details"
            description={`Ref ID: ${selectedPrescription?.id}`}
            maxWidth="md"
          >
            {selectedPrescription && (
              <div className="space-y-4 py-1 text-sm text-[#0F172A]">
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#0F4C81]">{selectedPrescription.patientName}</p>
                    <p className="text-xs text-sky-800">
                      Issued Date: {selectedPrescription.issuedAt.slice(0, 10)}
                    </p>
                  </div>
                  <Badge variant="active">Issued</Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider">
                    Prescribed Items
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-800">
                    {selectedPrescription.items.map((item) => (
                      <li key={item.id}>
                        <strong>{item.medicineName}</strong> — {item.dosage}, {item.frequency} for{' '}
                        {item.duration}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </PortalShell>
    </DoctorGuard>
  );
}

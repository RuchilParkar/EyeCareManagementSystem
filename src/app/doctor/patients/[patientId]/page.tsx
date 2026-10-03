'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  HeartPulse,
  FileText,
  Eye,
  Pill,
  ShieldAlert,
} from 'lucide-react';
import { PortalShell, DoctorGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Avatar,
  Modal,
  Skeleton,
  EmptyState,
} from '@/components/ui';
import { patientService } from '@/lib/api/patientService';
import { Patient, Consultation, Prescription } from '@/types';

export default function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.patientId;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal detail for previous record
  const [selectedRecord, setSelectedRecord] = useState<Consultation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [pRes, rRes, prRes] = await Promise.all([
        patientService.getPatientProfile(patientId),
        patientService.getMedicalRecords(patientId),
        patientService.getPrescriptions(patientId),
      ]);

      if (pRes.success && pRes.data) setPatient(pRes.data);
      if (rRes.success && rRes.data) setRecords(rRes.data);
      if (prRes.success && prRes.data) setPrescriptions(prRes.data);
      setIsLoading(false);
    }
    loadData();
  }, [patientId]);

  return (
    <DoctorGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Back Header */}
          <div>
            <Link
              href="/doctor/patients"
              className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient Directory
            </Link>
            <h1 className="text-2xl font-bold text-[#0F172A]">Patient Clinical Profile</h1>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : !patient ? (
            <EmptyState title="Patient Not Found" description="Could not locate patient profile." />
          ) : (
            <div className="space-y-6">
              {/* Patient Banner */}
              <Card>
                <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={`${patient.firstName} ${patient.lastName}`}
                      size="xl"
                      status="online"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="scheduled" dot={false}>PATIENT</Badge>
                        <span className="text-xs font-mono font-semibold text-[#0D9488]">
                          {patient.patientNumber}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#0F172A]">
                        {patient.firstName} {patient.lastName}
                      </h2>
                      <p className="text-xs text-[#64748B]">
                        DOB: {patient.dateOfBirth} ({patient.gender}) • Blood Group: {patient.bloodGroup || 'O+'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-[#64748B] space-y-1">
                    <p className="flex items-center justify-end gap-1 font-medium text-[#0F172A]">
                      <Phone className="w-3.5 h-3.5 text-[#0F4C81]" /> {patient.phone}
                    </p>
                    <p className="text-[11px]">{patient.address}</p>
                    <p className="text-[11px] font-semibold text-rose-600">
                      Emergency: {patient.emergencyContact}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Summary & Allergies */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-amber-200 bg-amber-50/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Known Ocular Allergies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-amber-900">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Benzalkonium Chloride (Preservative)</li>
                      <li>Penicillin / Sulfa derivative hypersensitivity</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-sky-200 bg-sky-50/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-[#0F4C81]">
                      <HeartPulse className="w-4 h-4 text-[#0F4C81]" />
                      Chronic Eye Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-sky-950">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Myopic Astigmatism (OD/OS)</li>
                      <li>Mild Evaporative Dry Eye Syndrome</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-emerald-50/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-emerald-900">
                      <Pill className="w-4 h-4 text-emerald-600" />
                      Active Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-xs text-emerald-950">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Carboxymethylcellulose 0.5% drops (QID)</li>
                      <li>Corrective Eyewear Lenses (-1.25 / -1.00)</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Past Consultations */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0F4C81]" />
                  Consultation History ({records.length})
                </h3>

                {records.length === 0 ? (
                  <EmptyState title="No Previous Records" description="No previous clinical consultation notes recorded." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {records.map((rec) => (
                      <Card key={rec.id} hoverable>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="completed">Consultation Record</Badge>
                            <span className="text-xs text-[#64748B]">{rec.createdAt.slice(0, 10)}</span>
                          </div>
                          <h4 className="font-bold text-sm text-[#0F172A]">{rec.diagnosis}</h4>
                          <p className="text-xs text-[#64748B] line-clamp-2">
                            <strong>Complaint:</strong> {rec.chiefComplaint}
                          </p>
                          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRecord(rec);
                                setIsDetailOpen(true);
                              }}
                            >
                              Inspect Full Notes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Prescriptions */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#0D9488]" />
                  Optical & Eyewear Prescriptions ({prescriptions.length})
                </h3>

                {prescriptions.length === 0 ? (
                  <EmptyState title="No Prescriptions" description="No prescriptions recorded." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prescriptions.map((prsc) => (
                      <Card key={prsc.id} hoverable>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="active">Active Rx</Badge>
                            <span className="text-xs text-[#64748B]">{prsc.issuedAt.slice(0, 10)}</span>
                          </div>
                          <p className="text-xs font-bold text-[#0F172A]">
                            Prescribed by {prsc.doctorName || 'Dr. Elena Vance'}
                          </p>
                          <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                            {prsc.items.map((item) => (
                              <li key={item.id}>{item.medicineName} ({item.dosage})</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Consultation Record Detail Modal */}
          <Modal
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            title="Archived Clinical Report"
            description={`Record Ref: ${selectedRecord?.id}`}
            maxWidth="lg"
          >
            {selectedRecord && (
              <div className="space-y-4 py-1 text-sm text-[#0F172A]">
                <div>
                  <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider mb-1">
                    Diagnosis
                  </h4>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-semibold">
                    {selectedRecord.diagnosis}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider mb-1">
                    Chief Complaint & Symptoms
                  </h4>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    {selectedRecord.chiefComplaint} • {selectedRecord.symptoms}
                  </p>
                </div>

                {selectedRecord.examinationNotes && (
                  <div>
                    <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider mb-1">
                      Ophthalmic Examination Notes
                    </h4>
                    <p className="bg-teal-50 p-3 rounded-lg border border-teal-200 text-xs text-teal-950 font-mono">
                      {selectedRecord.examinationNotes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </div>
      </PortalShell>
    </DoctorGuard>
  );
}

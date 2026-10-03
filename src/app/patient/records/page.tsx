'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Calendar as CalendarIcon,
  Eye,
  ArrowRight,
  Download,
  Printer,
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
import { mockDoctors } from '@/mock';
import { Consultation } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';

export default function PatientRecordsPage() {
  const { toastInfo } = useToast();
  const { user } = useAuth();

  const [records, setRecords] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Record Modal
  const [selectedRecord, setSelectedRecord] = useState<Consultation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadRecords() {
      setIsLoading(true);
      const res = await patientService.getMedicalRecords(user?.patientId || 'me');
      if (res.success && res.data) {
        setRecords(res.data);
      }
      setIsLoading(false);
    }
    loadRecords();
  }, [user?.patientId]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.diagnosis.toLowerCase().includes(q) ||
        r.chiefComplaint.toLowerCase().includes(q) ||
        r.symptoms.toLowerCase().includes(q) ||
        r.createdAt.includes(q)
    );
  }, [records, searchQuery]);

  const getDoctorName = (doctorId: string) => {
    const doc = mockDoctors.find((d) => d.id === doctorId);
    return doc ? `Dr. ${doc.firstName} ${doc.lastName}` : 'Dr. Elena Vance';
  };

  const handleDownloadReport = () => {
    toastInfo('Downloading PDF', 'Medical Consultation Report is downloading...');
  };

  const handlePrintReport = () => {
    toastInfo('Printing Document', 'Sending medical record to system printer...');
  };

  return (
    <PatientGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Medical & Clinical Records</h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                View your complete clinical consultation history, optical examination notes, and diagnostic reports.
              </p>
            </div>

            <div className="w-full sm:w-72 shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search diagnosis or complaints..."
              />
            </div>
          </div>

          {/* Records Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-3">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              title="No Medical Records Found"
              description={
                searchQuery
                  ? `No consultation records match "${searchQuery}".`
                  : 'You have no archived clinical consultation records.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecords.map((record) => (
                <Card key={record.id} hoverable className="flex flex-col justify-between">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <Badge variant="completed">Clinical Consultation</Badge>
                        <h3 className="text-base font-bold text-[#0F172A] pt-1">
                          {record.diagnosis}
                        </h3>
                      </div>
                      <div className="text-xs font-semibold text-[#64748B] flex items-center gap-1 shrink-0">
                        <CalendarIcon className="w-3.5 h-3.5 text-[#0F4C81]" />
                        <span>{record.createdAt.slice(0, 10)}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                      <div className="flex items-center gap-2 text-[#0F172A] font-medium">
                        <Stethoscope className="w-4 h-4 text-[#0D9488] shrink-0" />
                        <span>Attending: {getDoctorName(record.doctorId)}</span>
                      </div>

                      <p className="line-clamp-2">
                        <strong>Chief Complaint:</strong> {record.chiefComplaint}
                      </p>

                      {record.examinationNotes && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                          <strong>Examination:</strong> {record.examinationNotes}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                      {record.followUpDate ? (
                        <span className="text-[11px] font-medium text-[#0D9488]">
                          Follow-up: {record.followUpDate}
                        </span>
                      ) : (
                        <span />
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsDetailOpen(true);
                        }}
                      >
                        View Full Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Consultation Detail Modal */}
          <Modal
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            title="Clinical Consultation Report"
            description={`Record ID: ${selectedRecord?.id}`}
            maxWidth="xl"
            footer={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleDownloadReport}
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                    onClick={handlePrintReport}
                  >
                    Print
                  </Button>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
                  Close Report
                </Button>
              </div>
            }
          >
            {selectedRecord && (
              <div className="space-y-6 py-2 text-sm text-[#0F172A]">
                {/* Header Banner inside Report */}
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#0F4C81] text-base">
                      ClearVision Eye Institute Report
                    </h3>
                    <p className="text-xs text-sky-800">
                      Date: {selectedRecord.createdAt.slice(0, 10)} • Ref ID: {selectedRecord.appointmentId}
                    </p>
                  </div>
                  <Badge variant="completed">OFFICIAL CLINICAL RECORD</Badge>
                </div>

                {/* Doctor & Patient Info */}
                <div className="grid grid-cols-2 gap-4 text-xs border-b border-[#E2E8F0] pb-4">
                  <div>
                    <span className="text-[#64748B] block font-medium">Attending Ophthalmologist</span>
                    <span className="font-bold text-sm">{getDoctorName(selectedRecord.doctorId)}</span>
                    <span className="text-[#64748B] block mt-0.5">Cornea & Refractive Specialist</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block font-medium">Patient Details</span>
                    <span className="font-bold text-sm">John Doe (PAT-2026-0042)</span>
                    <span className="text-[#64748B] block mt-0.5">DOB: 1988-04-12 • Blood Group: O+</span>
                  </div>
                </div>

                {/* Complaint & Symptoms */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider mb-1">
                      Chief Complaint
                    </h4>
                    <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                      {selectedRecord.chiefComplaint}
                    </p>
                  </div>

                  {selectedRecord.symptoms && (
                    <div>
                      <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider mb-1">
                        Reported Symptoms
                      </h4>
                      <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                        {selectedRecord.symptoms}
                      </p>
                    </div>
                  )}
                </div>

                {/* Examination Notes */}
                {selectedRecord.examinationNotes && (
                  <div>
                    <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#0D9488]" />
                      Ocular Examination Findings
                    </h4>
                    <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-lg text-xs space-y-1 text-teal-950">
                      {selectedRecord.examinationNotes}
                    </div>
                  </div>
                )}

                {/* Diagnosis & Clinical Notes */}
                <div className="space-y-3 pt-2">
                  <div>
                    <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider mb-1">
                      Clinical Diagnosis
                    </h4>
                    <p className="font-bold text-sm text-[#0F172A] bg-slate-100 p-3 rounded-lg border border-slate-300">
                      {selectedRecord.diagnosis}
                    </p>
                  </div>

                  {selectedRecord.clinicalNotes && (
                    <div>
                      <h4 className="font-bold text-xs text-[#0F4C81] uppercase tracking-wider mb-1">
                        Specialist Clinical Notes
                      </h4>
                      <p className="text-xs text-[#64748B] italic">
                        {selectedRecord.clinicalNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Follow up */}
                {selectedRecord.followUpDate && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
                    <span className="font-medium">Recommended Follow-up Date</span>
                    <span className="font-bold">{selectedRecord.followUpDate}</span>
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

'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  Activity,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  FileText,
  Pill,
} from 'lucide-react';
import { PortalShell, DoctorGuard } from '@/components/shared';
import {
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  Select,
  Textarea,
  Tabs,
} from '@/components/ui';
import { consultationService } from '@/lib/api/consultationService';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  EyeSide,
  VisualAcuity,
  IOPMeasurement,
  Refraction,
  EyeExamination,
  FundusExamination,
  OphthalmicInvestigation,
  DiagnosisEntry,
  TreatmentPlan,
} from '@/types';

export default function ClinicalConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const { user } = useAuth();

  const resolvedParams = use(params);
  const appointmentId = resolvedParams.appointmentId;

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);

  // Active section tab in EMR workspace
  const [activeTab, setActiveTab] = useState<string>('complaint');

  // 12 Clinical EMR Form States
  const [chiefComplaint, setChiefComplaint] = useState<string>('Blurred distance vision and eye fatigue.');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Blurred vision',
    'Eye strain / Fatigue',
  ]);

  // Visual Acuity
  const [visualAcuity, setVisualAcuity] = useState<VisualAcuity>({
    odDistance: '6/6',
    osDistance: '6/9',
    ouDistance: '6/6',
    odNear: 'N6',
    osNear: 'N8',
    ouNear: 'N6',
  });

  // Intraocular Pressure (IOP)
  const [iop, setIop] = useState<IOPMeasurement>({
    odIop: '16',
    osIop: '17',
    method: 'Applanation',
    notes: 'Normal intraocular pressure bilaterally.',
  });

  // Refraction
  const [refraction, setRefraction] = useState<Refraction>({
    od: { sphere: '-1.25', cylinder: '-0.50', axis: '180°', add: '+1.50', visualAcuity: '6/6' },
    os: { sphere: '-1.00', cylinder: 'DS', axis: '0°', add: '+1.50', visualAcuity: '6/6' },
  });

  // External & Slit Lamp Examination
  const [externalExam] = useState<EyeExamination>({
    lids: { status: 'NORMAL' },
    lashes: { status: 'NORMAL' },
    lacrimalSystem: { status: 'NORMAL' },
    conjunctiva: { status: 'NORMAL' },
    sclera: { status: 'NORMAL' },
    cornea: { status: 'NORMAL' },
    anteriorChamber: { status: 'NORMAL' },
    iris: { status: 'NORMAL' },
    pupil: { status: 'NORMAL' },
    lens: { status: 'NORMAL' },
  });

  // Fundus Examination
  const [fundusExam, setFundusExam] = useState<FundusExamination>({
    od: {
      opticDisc: 'Pink, well-defined margins',
      cupToDiscRatio: '0.3',
      macula: 'Clear foveal reflex',
      retina: 'Attached, no tears or hemorrhages',
      vessels: 'Normal A/V ratio 2:3',
      vitreous: 'Clear',
      findings: 'Unremarkable fundus',
    },
    os: {
      opticDisc: 'Pink, well-defined margins',
      cupToDiscRatio: '0.3',
      macula: 'Clear foveal reflex',
      retina: 'Attached, no tears or hemorrhages',
      vessels: 'Normal A/V ratio 2:3',
      vitreous: 'Clear',
      findings: 'Unremarkable fundus',
    },
  });

  // Diagnostic Investigations (OCT, etc.)
  const [investigations] = useState<OphthalmicInvestigation[]>([
    {
      id: 'inv-01',
      testName: 'OCT',
      eye: 'OU',
      date: new Date().toISOString().split('T')[0],
      result: 'Normal macular thickness (OD: 250 µm, OS: 252 µm)',
      notes: 'No macular edema observed.',
    },
  ]);

  // Diagnosis
  const [diagnosis, setDiagnosis] = useState<DiagnosisEntry>({
    primaryDiagnosis: 'Myopic Astigmatism (ICD-10 H52.2)',
    secondaryDiagnosis: 'Mild Evaporative Dry Eye',
    affectedEye: 'OU',
    notes: 'Prescribe corrective optical glasses and lubricating eye drops.',
  });

  // Treatment Plan
  const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan>({
    plan: 'Prescribe anti-reflective refractive optical lenses. Use lubricating tear drops QID.',
    recommendedProcedures: ['Refractive correction', 'Dry Eye Therapy'],
    followUpInterval: '3 months',
    notes: 'Return if photophobia or flashers occur.',
  });

  // Medications Rx List
  const [medications, setMedications] = useState<
    Array<{
      medicineName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>
  >([
    {
      medicineName: 'Carboxymethylcellulose 0.5% Eye Drops',
      dosage: '1 drop',
      frequency: '4 times daily',
      duration: '30 days',
      instructions: 'Instill 1 drop in both eyes when experiencing strain.',
    },
  ]);

  useEffect(() => {
    async function loadData() {
      const res = await consultationService.getConsultationByAppointment(appointmentId);
      if (res.success && res.data) {
        if (res.data.chiefComplaint) setChiefComplaint(res.data.chiefComplaint);
        if (res.data.visualAcuity) setVisualAcuity(res.data.visualAcuity);
        if (res.data.iop) setIop(res.data.iop);
        if (res.data.refraction) setRefraction(res.data.refraction);
      }
    }
    loadData();
  }, [appointmentId]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleAddMedication = () => {
    setMedications((prev) => [
      ...prev,
      {
        medicineName: 'Moxifloxacin 0.5% Eye Drops',
        dosage: '1 drop',
        frequency: '4 times daily',
        duration: '7 days',
        instructions: 'Both eyes',
      },
    ]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const res = await consultationService.saveConsultationDraft({
      appointmentId,
      chiefComplaint,
      symptoms: selectedSymptoms.join(', '),
      examinationNotes: `OD: ${visualAcuity.odDistance}, OS: ${visualAcuity.osDistance}. IOP: OD ${iop.odIop} mmHg, OS ${iop.osIop} mmHg.`,
      diagnosis: diagnosis.primaryDiagnosis,
      visualAcuity,
      iop,
      refraction,
      externalExam,
      fundusExam,
      diagnosisDetail: diagnosis,
      treatmentPlan,
    });

    if (res.success) {
      toastSuccess('Draft Saved', 'Consultation progress saved as draft.');
    } else {
      toastError('Save Failed', res.error?.message);
    }
    setIsSaving(false);
  };

  const handleCompleteConsultation = async () => {
    setIsCompleting(true);
    const res = await consultationService.completeConsultation(
      {
        appointmentId,
        patientId: 'pat-01',
        doctorId: user?.doctorId || 'me',
        chiefComplaint,
        symptoms: selectedSymptoms.join(', '),
        clinicalNotes: treatmentPlan.plan,
        examinationNotes: `Visual Acuity: OD ${visualAcuity.odDistance}, OS ${visualAcuity.osDistance}. IOP: OD ${iop.odIop} mmHg, OS ${iop.osIop} mmHg.`,
        diagnosis: `${diagnosis.primaryDiagnosis} (${diagnosis.affectedEye})`,
        followUpDate: '2026-11-15',
        visualAcuity,
        iop,
        refraction,
        externalExam,
        fundusExam,
        diagnosisDetail: diagnosis,
        treatmentPlan,
      },
      medications
    );

    if (res.success) {
      toastSuccess('Consultation Completed!', 'Medical record and prescription generated.');
      router.push('/doctor/queue');
    } else {
      toastError('Completion Failed', res.error?.message);
    }
    setIsCompleting(false);
  };

  const emrTabs = [
    { id: 'complaint', label: '1. Chief Complaint' },
    { id: 'acuity', label: '2. Visual Acuity' },
    { id: 'iop', label: '3. IOP (Tonometry)' },
    { id: 'refraction', label: '4. Refraction' },
    { id: 'exam', label: '5-6. Slit Lamp & Exam' },
    { id: 'fundus', label: '7. Fundus Exam' },
    { id: 'oct', label: '8. Investigations' },
    { id: 'diagnosis', label: '9. Diagnosis' },
    { id: 'treatment', label: '10. Treatment Plan' },
    { id: 'prescription', label: '11. Prescriptions' },
  ];

  return (
    <DoctorGuard>
      <PortalShell>
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link
                href="/doctor/queue"
                className="text-xs font-semibold text-[#0F4C81] hover:underline flex items-center gap-1 mb-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to OPD Queue
              </Link>
              <h1 className="text-2xl font-bold text-[#0F172A]">Ophthalmology Clinical EMR</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                isLoading={isSaving}
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isCompleting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={handleCompleteConsultation}
              >
                Complete Consultation
              </Button>
            </div>
          </div>

          {/* Patient Header Details Banner */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#0F4C81] text-white font-bold flex items-center justify-center text-base">
                JD
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-base text-[#0F172A]">John Doe</span>
                  <Badge variant="scheduled" dot={false}>
                    PAT-2026-0042
                  </Badge>
                  <span className="text-xs text-[#0D9488] font-semibold">• Blood Group: O+</span>
                </div>
                <p className="text-xs text-[#64748B]">
                  Age: 38 yrs • Male • Appt Ref: {appointmentId} • Comprehensive Eye Exam
                </p>
              </div>
            </div>

            <Link href="/doctor/patients/pat-01" target="_blank">
              <Button variant="ghost" size="sm" rightIcon={<FileText className="w-3.5 h-3.5" />}>
                View Previous Visit Records
              </Button>
            </Link>
          </div>

          {/* Section Navigation Tabs */}
          <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] overflow-x-auto">
            <Tabs tabs={emrTabs} activeTab={activeTab} onChange={setActiveTab} variant="pills" />
          </div>

          {/* EMR Workspace Card */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* SECTION 1: CHIEF COMPLAINT */}
              {activeTab === 'complaint' && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-[#0F172A] block mb-1">
                      Chief Complaint & Reason for Visit
                    </label>
                    <Textarea
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      rows={3}
                      placeholder="Describe patient's chief complaint in detail..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#0F172A] block">
                      Common Ophthalmic Symptoms Checklist
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        'Blurred vision',
                        'Eye pain',
                        'Redness',
                        'Watering',
                        'Itching',
                        'Headache',
                        'Floaters',
                        'Flashes',
                        'Decreased vision',
                        'Photophobia',
                        'Double vision',
                        'Dryness',
                      ].map((sym) => {
                        const isSelected = selectedSymptoms.includes(sym);
                        return (
                          <button
                            key={sym}
                            type="button"
                            onClick={() => toggleSymptom(sym)}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F4C81] text-white border-[#0F4C81]'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {sym}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: VISUAL ACUITY */}
              {activeTab === 'acuity' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-[#0F4C81] flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#0D9488]" />
                    Visual Acuity Measurements (OD / OS / OU)
                  </h3>

                  <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-[#E2E8F0] font-semibold text-[#0F172A]">
                        <tr>
                          <th className="p-3">Measurement</th>
                          <th className="p-3">OD (Right Eye)</th>
                          <th className="p-3">OS (Left Eye)</th>
                          <th className="p-3">OU (Both Eyes)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        <tr>
                          <td className="p-3 font-bold text-[#0F172A]">Uncorrected Distance</td>
                          <td className="p-3">
                            <Select
                              value={visualAcuity.odDistance}
                              onChange={(e) =>
                                setVisualAcuity({ ...visualAcuity, odDistance: e.target.value })
                              }
                              options={['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', 'CF', 'HM', 'PL'].map(
                                (v) => ({ value: v, label: v })
                              )}
                            />
                          </td>
                          <td className="p-3">
                            <Select
                              value={visualAcuity.osDistance}
                              onChange={(e) =>
                                setVisualAcuity({ ...visualAcuity, osDistance: e.target.value })
                              }
                              options={['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60', 'CF', 'HM', 'PL'].map(
                                (v) => ({ value: v, label: v })
                              )}
                            />
                          </td>
                          <td className="p-3">
                            <Select
                              value={visualAcuity.ouDistance || '6/6'}
                              onChange={(e) =>
                                setVisualAcuity({ ...visualAcuity, ouDistance: e.target.value })
                              }
                              options={['6/6', '6/9', '6/12', '6/18', '6/24', '6/36'].map((v) => ({
                                value: v,
                                label: v,
                              }))}
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="p-3 font-bold text-[#0F172A]">Near Vision</td>
                          <td className="p-3">
                            <Select
                              value={visualAcuity.odNear}
                              onChange={(e) =>
                                setVisualAcuity({ ...visualAcuity, odNear: e.target.value })
                              }
                              options={['N6', 'N8', 'N10', 'N12', 'N14', 'N18', 'N36'].map((v) => ({
                                value: v,
                                label: v,
                              }))}
                            />
                          </td>
                          <td className="p-3">
                            <Select
                              value={visualAcuity.osNear}
                              onChange={(e) =>
                                setVisualAcuity({ ...visualAcuity, osNear: e.target.value })
                              }
                              options={['N6', 'N8', 'N10', 'N12', 'N14', 'N18', 'N36'].map((v) => ({
                                value: v,
                                label: v,
                              }))}
                            />
                          </td>
                          <td className="p-3">
                            <Select
                              value={visualAcuity.ouNear || 'N6'}
                              onChange={(e) =>
                                setVisualAcuity({ ...visualAcuity, ouNear: e.target.value })
                              }
                              options={['N6', 'N8', 'N10', 'N12', 'N14'].map((v) => ({
                                value: v,
                                label: v,
                              }))}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 3: INTRAOCULAR PRESSURE (IOP) */}
              {activeTab === 'iop' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-[#0F4C81] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#0D9488]" />
                    Intraocular Pressure (IOP) Tonometry
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Right Eye (OD) IOP (mmHg)"
                      value={iop.odIop}
                      onChange={(e) => setIop({ ...iop, odIop: e.target.value })}
                    />
                    <Input
                      label="Left Eye (OS) IOP (mmHg)"
                      value={iop.osIop}
                      onChange={(e) => setIop({ ...iop, osIop: e.target.value })}
                    />
                    <div className="w-full flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#0F172A]">
                        Measurement Method
                      </label>
                      <Select
                        value={iop.method}
                        onChange={(e) =>
                          setIop({
                            ...iop,
                            method: e.target.value as 'Applanation' | 'Non-contact' | 'Tonopen' | 'Other',
                          })
                        }
                        options={[
                          { value: 'Applanation', label: 'Goldmann Applanation' },
                          { value: 'Non-contact', label: 'Non-Contact Air-Puff' },
                          { value: 'Tonopen', label: 'Tono-Pen' },
                          { value: 'Other', label: 'Other' },
                        ]}
                      />
                    </div>
                  </div>

                  <Textarea
                    label="Tonometry Notes"
                    value={iop.notes || ''}
                    onChange={(e) => setIop({ ...iop, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              )}

              {/* SECTION 4: REFRACTION TABLE */}
              {activeTab === 'refraction' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-[#0F4C81]">Ophthalmic Refraction Chart</h3>

                  <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 border-b border-[#E2E8F0] font-semibold text-[#0F172A]">
                        <tr>
                          <th className="p-3">Eye</th>
                          <th className="p-3">Sphere (SPH)</th>
                          <th className="p-3">Cylinder (CYL)</th>
                          <th className="p-3">Axis</th>
                          <th className="p-3">Add</th>
                          <th className="p-3">Best Corrected VA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        <tr>
                          <td className="p-3 font-bold text-[#0F4C81]">OD (Right)</td>
                          <td className="p-3">
                            <Input
                              value={refraction.od.sphere}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  od: { ...refraction.od, sphere: e.target.value },
                                })
                              }
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={refraction.od.cylinder}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  od: { ...refraction.od, cylinder: e.target.value },
                                })
                              }
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={refraction.od.axis}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  od: { ...refraction.od, axis: e.target.value },
                                })
                              }
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={refraction.od.add}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  od: { ...refraction.od, add: e.target.value },
                                })
                              }
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={refraction.od.visualAcuity}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  od: { ...refraction.od, visualAcuity: e.target.value },
                                })
                              }
                            />
                          </td>
                        </tr>

                        <tr>
                          <td className="p-3 font-bold text-[#0F4C81]">OS (Left)</td>
                          <td className="p-3">
                            <Input
                              value={refraction.os.sphere}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  os: { ...refraction.os, sphere: e.target.value },
                                })
                              }
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={refraction.os.cylinder}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  os: { ...refraction.os, cylinder: e.target.value },
                                })
                              }
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={refraction.os.axis}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  os: { ...refraction.os, axis: e.target.value },
                                })
                              }
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={refraction.os.add}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  os: { ...refraction.os, add: e.target.value },
                                })
                              }
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              value={refraction.os.visualAcuity}
                              onChange={(e) =>
                                setRefraction({
                                  ...refraction,
                                  os: { ...refraction.os, visualAcuity: e.target.value },
                                })
                              }
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 5 & 6: SLIT LAMP & EXTERNAL EXAMINATION */}
              {activeTab === 'exam' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-[#0F4C81]">Slit Lamp Anterior Segment Examination</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'lids', label: 'Eyelids' },
                      { key: 'lashes', label: 'Lashes & Margin' },
                      { key: 'conjunctiva', label: 'Conjunctiva & Sclera' },
                      { key: 'cornea', label: 'Cornea' },
                      { key: 'anteriorChamber', label: 'Anterior Chamber' },
                      { key: 'iris', label: 'Iris & Pupil' },
                      { key: 'lens', label: 'Crystalline Lens' },
                    ].map(({ key, label }) => (
                      <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <span className="font-bold text-xs text-[#0F172A]">{label}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="active">Normal</Badge>
                          <span className="text-[11px] text-[#64748B]">Clear, no abnormality</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 7: FUNDUS EXAMINATION */}
              {activeTab === 'fundus' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-[#0F4C81]">Fundus Posterior Segment Examination</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <h4 className="font-bold text-xs text-[#0F4C81]">OD (Right Eye) Fundus</h4>
                      <Input
                        label="Optic Disc"
                        value={fundusExam.od.opticDisc}
                        onChange={(e) =>
                          setFundusExam({
                            ...fundusExam,
                            od: { ...fundusExam.od, opticDisc: e.target.value },
                          })
                        }
                      />
                      <Input
                        label="C/D Ratio"
                        value={fundusExam.od.cupToDiscRatio}
                        onChange={(e) =>
                          setFundusExam({
                            ...fundusExam,
                            od: { ...fundusExam.od, cupToDiscRatio: e.target.value },
                          })
                        }
                      />
                      <Input
                        label="Macula & Retina"
                        value={fundusExam.od.retina}
                        onChange={(e) =>
                          setFundusExam({
                            ...fundusExam,
                            od: { ...fundusExam.od, retina: e.target.value },
                          })
                        }
                      />
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <h4 className="font-bold text-xs text-[#0F4C81]">OS (Left Eye) Fundus</h4>
                      <Input
                        label="Optic Disc"
                        value={fundusExam.os.opticDisc}
                        onChange={(e) =>
                          setFundusExam({
                            ...fundusExam,
                            os: { ...fundusExam.os, opticDisc: e.target.value },
                          })
                        }
                      />
                      <Input
                        label="C/D Ratio"
                        value={fundusExam.os.cupToDiscRatio}
                        onChange={(e) =>
                          setFundusExam({
                            ...fundusExam,
                            os: { ...fundusExam.os, cupToDiscRatio: e.target.value },
                          })
                        }
                      />
                      <Input
                        label="Macula & Retina"
                        value={fundusExam.os.retina}
                        onChange={(e) =>
                          setFundusExam({
                            ...fundusExam,
                            os: { ...fundusExam.os, retina: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 8: OCT & DIAGNOSTIC INVESTIGATIONS */}
              {activeTab === 'oct' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-[#0F4C81]">Diagnostic Investigations (OCT / Scans)</h3>

                  {investigations.map((inv) => (
                    <div key={inv.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant="active">{inv.testName}</Badge>
                        <span className="font-semibold text-slate-500">Eye: {inv.eye}</span>
                      </div>
                      <p className="font-semibold text-[#0F172A]">{inv.result}</p>
                      {inv.notes && <p className="text-slate-600 italic">{inv.notes}</p>}
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION 9: DIAGNOSIS */}
              {activeTab === 'diagnosis' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-[#0F4C81]">Clinical Diagnosis Entry</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Primary Diagnosis"
                        value={diagnosis.primaryDiagnosis}
                        onChange={(e) =>
                          setDiagnosis({ ...diagnosis, primaryDiagnosis: e.target.value })
                        }
                      />
                    </div>

                    <div className="w-full flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#0F172A]">Affected Eye</label>
                      <Select
                        value={diagnosis.affectedEye}
                        onChange={(e) =>
                          setDiagnosis({ ...diagnosis, affectedEye: e.target.value as EyeSide })
                        }
                        options={[
                          { value: 'OD', label: 'OD (Right Eye)' },
                          { value: 'OS', label: 'OS (Left Eye)' },
                          { value: 'OU', label: 'OU (Both Eyes)' },
                        ]}
                      />
                    </div>
                  </div>

                  <Textarea
                    label="Secondary Diagnosis & Clinical Notes"
                    value={diagnosis.secondaryDiagnosis || ''}
                    onChange={(e) =>
                      setDiagnosis({ ...diagnosis, secondaryDiagnosis: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              )}

              {/* SECTION 10: TREATMENT PLAN */}
              {activeTab === 'treatment' && (
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-[#0F4C81]">Treatment & Management Plan</h3>

                  <Textarea
                    label="Treatment Plan Notes"
                    value={treatmentPlan.plan}
                    onChange={(e) => setTreatmentPlan({ ...treatmentPlan, plan: e.target.value })}
                    rows={3}
                  />

                  <div className="w-full flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#0F172A]">Follow-up Interval</label>
                    <Select
                      value={treatmentPlan.followUpInterval}
                      onChange={(e) =>
                        setTreatmentPlan({
                          ...treatmentPlan,
                          followUpInterval: e.target.value as TreatmentPlan['followUpInterval'],
                        })
                      }
                      options={[
                        { value: '1 week', label: '1 Week' },
                        { value: '2 weeks', label: '2 Weeks' },
                        { value: '1 month', label: '1 Month' },
                        { value: '3 months', label: '3 Months' },
                        { value: '6 months', label: '6 Months' },
                        { value: '1 year', label: '1 Year' },
                        { value: 'As required', label: 'As Required' },
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* SECTION 11: PRESCRIPTIONS GENERATOR */}
              {activeTab === 'prescription' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0F4C81] flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-[#0D9488]" />
                      Prescription Generator (Medications & Optical Rx)
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleAddMedication}
                    >
                      Add Medication Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {medications.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#0F172A]">Item #{idx + 1}</span>
                          {medications.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(idx)}
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <Input
                              label="Medicine / Lens Item"
                              value={med.medicineName}
                              onChange={(e) => {
                                const updated = [...medications];
                                updated[idx].medicineName = e.target.value;
                                setMedications(updated);
                              }}
                            />
                          </div>
                          <Input
                            label="Dosage / Spec"
                            value={med.dosage}
                            onChange={(e) => {
                              const updated = [...medications];
                              updated[idx].dosage = e.target.value;
                              setMedications(updated);
                            }}
                          />
                          <Input
                            label="Frequency"
                            value={med.frequency}
                            onChange={(e) => {
                              const updated = [...medications];
                              updated[idx].frequency = e.target.value;
                              setMedications(updated);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Footer inside Card */}
              <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                  onClick={handleSaveDraft}
                >
                  Save Draft Progress
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isCompleting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleCompleteConsultation}
                >
                  Finalize & Complete Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </PortalShell>
    </DoctorGuard>
  );
}

import { Consultation, ApiResponse, Prescription, PrescriptionItem, Invoice } from '@/types';
import { mockConsultations, mockAppointments, mockPrescriptions, mockInvoices, mockAuditLogs, mockPatients, mockDoctors } from '@/mock';

const DELAY_MS = 250;

export const consultationService = {
  async getConsultationByAppointment(appointmentId: string): Promise<ApiResponse<Consultation>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/consultations/${appointmentId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const consultation = mockConsultations.find((c) => c.appointmentId === appointmentId);
    if (consultation) {
      return { success: true, data: consultation };
    }
    // Return empty draft skeleton
    const draft: Consultation = {
      id: `cns-${Date.now()}`,
      appointmentId,
      patientId: 'pat-01',
      doctorId: 'doc-01',
      chiefComplaint: '',
      symptoms: '',
      clinicalNotes: '',
      examinationNotes: '',
      diagnosis: '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: draft };
  },

  async saveConsultationDraft(data: Partial<Consultation>): Promise<ApiResponse<Consultation>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, status: 'draft' }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback
      }
    }
    await new Promise((res) => setTimeout(res, 300));
    const index = mockConsultations.findIndex((c) => c.appointmentId === data.appointmentId);
    const updated: Consultation = {
      id: data.id || `cns-${Date.now()}`,
      appointmentId: data.appointmentId || 'apt-101',
      patientId: data.patientId || 'pat-01',
      doctorId: data.doctorId || 'doc-01',
      chiefComplaint: data.chiefComplaint || '',
      symptoms: data.symptoms || '',
      clinicalNotes: data.clinicalNotes || '',
      examinationNotes: data.examinationNotes || '',
      diagnosis: data.diagnosis || '',
      followUpDate: data.followUpDate,
      status: 'draft',
      visualAcuity: data.visualAcuity,
      iop: data.iop,
      refraction: data.refraction,
      externalExam: data.externalExam,
      slitLampExam: data.slitLampExam,
      fundusExam: data.fundusExam,
      investigations: data.investigations,
      diagnosisDetail: data.diagnosisDetail,
      treatmentPlan: data.treatmentPlan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (index !== -1) {
      mockConsultations[index] = updated;
    } else {
      mockConsultations.push(updated);
    }

    return { success: true, data: updated };
  },

  async completeConsultation(
    data: Partial<Consultation>,
    prescriptionItems?: Partial<PrescriptionItem>[]
  ): Promise<ApiResponse<Consultation>> {
    await new Promise((res) => setTimeout(res, 350));

    // 1. Save / Update Consultation Record
    const completedRecord: Consultation = {
      id: data.id || `cns-${Date.now()}`,
      appointmentId: data.appointmentId || 'apt-101',
      patientId: data.patientId || 'pat-01',
      doctorId: data.doctorId || 'doc-01',
      chiefComplaint: data.chiefComplaint || 'Routine ophthalmic consultation',
      symptoms: data.symptoms || 'Blurred vision & eye strain',
      clinicalNotes: data.clinicalNotes || 'Patient advised standard refractive care.',
      examinationNotes: data.examinationNotes || 'OD: 6/6, OS: 6/6. Intraocular pressure within normal limits.',
      diagnosis: data.diagnosis || 'Myopic Astigmatism (H52.2)',
      followUpDate: data.followUpDate || '2026-11-15',
      status: 'completed',
      visualAcuity: data.visualAcuity,
      iop: data.iop,
      refraction: data.refraction,
      externalExam: data.externalExam,
      slitLampExam: data.slitLampExam,
      fundusExam: data.fundusExam,
      investigations: data.investigations,
      diagnosisDetail: data.diagnosisDetail,
      treatmentPlan: data.treatmentPlan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const index = mockConsultations.findIndex((c) => c.appointmentId === data.appointmentId);
    if (index !== -1) {
      mockConsultations[index] = completedRecord;
    } else {
      mockConsultations.push(completedRecord);
    }

    // 2. Update Appointment Status to COMPLETED
    const aptIndex = mockAppointments.findIndex((a) => a.id === data.appointmentId);
    let patientName = 'John Doe';
    let doctorName = 'Dr. Elena Vance';
    let serviceName = 'Comprehensive Eye Examination';
    if (aptIndex !== -1) {
      mockAppointments[aptIndex].status = 'COMPLETED';
      mockAppointments[aptIndex].updatedAt = new Date().toISOString();
      patientName = mockAppointments[aptIndex].patientName || patientName;
      doctorName = mockAppointments[aptIndex].doctorName || doctorName;
      serviceName = mockAppointments[aptIndex].serviceName || serviceName;
    } else {
      const pObj = mockPatients.find((p) => p.id === completedRecord.patientId);
      if (pObj) patientName = `${pObj.firstName} ${pObj.lastName}`;
      const dObj = mockDoctors.find((d) => d.id === completedRecord.doctorId);
      if (dObj) doctorName = `${dObj.firstName} ${dObj.lastName}`;
    }

    // 3. Emit Prescription if medication/refraction items provided
    if (prescriptionItems && prescriptionItems.length > 0) {
      const newPrescription: Prescription = {
        id: `prsc-${Date.now()}`,
        prescriptionNumber: `RX-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'ACTIVE',
        consultationId: completedRecord.id,
        patientId: completedRecord.patientId,
        doctorId: completedRecord.doctorId,
        issuedAt: new Date().toISOString(),
        notes: completedRecord.clinicalNotes,
        items: prescriptionItems.map((item, idx) => ({
          id: `pi-${Date.now()}-${idx}`,
          prescriptionId: `prsc-${Date.now()}`,
          medicineName: item.medicineName || 'Eye Drop Formula',
          dosage: item.dosage || '1 drop',
          frequency: item.frequency || '4 times daily',
          duration: item.duration || '7 days',
          instructions: item.instructions || 'Instill in affected eye.',
        })),
        patientName,
        doctorName,
      };
      mockPrescriptions.unshift(newPrescription);
    }

    // 4. Cross-Portal Billing Invoice Generation
    const existingInvoice = mockInvoices.find((inv) => inv.appointmentId === completedRecord.appointmentId);
    if (!existingInvoice) {
      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
        patientId: completedRecord.patientId,
        patientName,
        appointmentId: completedRecord.appointmentId,
        serviceName,
        subtotal: 120.00,
        tax: 12.00,
        taxAmount: 12.00,
        totalAmount: 132.00,
        status: 'PENDING',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        items: [
          { id: `ii-${Date.now()}-1`, description: `${serviceName} Fee`, quantity: 1, unitPrice: 120.00, totalPrice: 120.00 }
        ],
      };
      mockInvoices.unshift(newInvoice);
    }

    // 5. Cross-Portal Security Audit Log
    mockAuditLogs.unshift({
      id: `log-${Date.now()}`,
      actorUserId: completedRecord.doctorId,
      userName: doctorName,
      userRole: 'DOCTOR',
      action: 'CONSULTATION_COMPLETED',
      entityType: 'Consultation',
      entityId: completedRecord.id,
      target: `Patient: ${patientName} (${completedRecord.diagnosis})`,
      ipAddress: '192.168.1.45',
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    return { success: true, data: completedRecord };
  },
};

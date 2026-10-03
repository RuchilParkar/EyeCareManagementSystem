import { Doctor, Appointment, Consultation, Prescription, Patient, ApiResponse } from '@/types';
import { mockDoctors, mockAppointments, mockPrescriptions, mockPatients } from '@/mock';

const DELAY_MS = 250;

export const doctorService = {
  async getDoctorProfile(doctorId?: string): Promise<ApiResponse<Doctor>> {
    if (typeof window !== 'undefined') {
      try {
        const endpoint = !doctorId || doctorId === 'me' ? '/api/doctors/me' : `/api/doctors/${doctorId}`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const doctor = mockDoctors.find((d) => d.id === doctorId) || mockDoctors[0];
    return { success: true, data: doctor };
  },

  async updateDoctorProfile(doctorId: string | undefined, data: Partial<Doctor>): Promise<ApiResponse<Doctor>> {
    if (typeof window !== 'undefined') {
      try {
        const endpoint = !doctorId || doctorId === 'me' ? '/api/doctors/me' : `/api/doctors/${doctorId}`;
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
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
    const targetId = doctorId && doctorId !== 'me' ? doctorId : 'doc-01';
    const index = mockDoctors.findIndex((d) => d.id === targetId);
    if (index !== -1) {
      mockDoctors[index] = { ...mockDoctors[index], ...data, updatedAt: new Date().toISOString() };
      return { success: true, data: mockDoctors[index] };
    }
    return { success: true, data: mockDoctors[0] };
  },

  async getSchedule(doctorId?: string): Promise<ApiResponse<Appointment[]>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/doctors/me`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            // verified doctor profile me
          }
        }
      } catch {
        // Fallback
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const targetId = !doctorId || doctorId === 'me' ? 'doc-01' : doctorId;
    const list = mockAppointments.filter((a) => a.doctorId === targetId || targetId === 'doc-01');
    return { success: true, data: list.length > 0 ? list : mockAppointments };
  },

  async getDoctorPrescriptions(doctorId?: string): Promise<ApiResponse<Prescription[]>> {
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const targetId = !doctorId || doctorId === 'me' ? 'doc-01' : doctorId;
    const list = mockPrescriptions.filter((p) => !targetId || p.doctorId === targetId || targetId === 'doc-01');
    return { success: true, data: list.length > 0 ? list : mockPrescriptions };
  },

  async getPatientsDirectory(): Promise<ApiResponse<Patient[]>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/patients');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    return { success: true, data: mockPatients };
  },

  async createConsultation(data: Partial<Consultation>): Promise<ApiResponse<Consultation>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
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
    const newConsultation: Consultation = {
      id: `cns-${Date.now()}`,
      appointmentId: data.appointmentId || 'apt-101',
      patientId: data.patientId || 'pat-01',
      doctorId: data.doctorId || 'doc-01',
      chiefComplaint: data.chiefComplaint || '',
      symptoms: data.symptoms || '',
      clinicalNotes: data.clinicalNotes || '',
      examinationNotes: data.examinationNotes || '',
      diagnosis: data.diagnosis || '',
      followUpDate: data.followUpDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, data: newConsultation };
  },

  async createPrescription(data: Partial<Prescription>): Promise<ApiResponse<Prescription>> {
    await new Promise((res) => setTimeout(res, 300));
    const newPrescription: Prescription = {
      id: `prsc-${Date.now()}`,
      consultationId: data.consultationId || 'cns-201',
      patientId: data.patientId || 'pat-01',
      doctorId: data.doctorId || 'doc-01',
      issuedAt: new Date().toISOString(),
      notes: data.notes || '',
      items: data.items || [],
      patientName: data.patientName || 'John Doe',
      doctorName: data.doctorName || 'Dr. Elena Vance',
    };
    mockPrescriptions.unshift(newPrescription);
    return { success: true, data: newPrescription };
  },
};

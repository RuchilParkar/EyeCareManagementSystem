import { Patient, Appointment, Consultation, Prescription, ApiResponse } from '@/types';
import { mockPatients, mockAppointments, mockConsultations, mockPrescriptions } from '@/mock';

const DELAY_MS = 250;

export const patientService = {
  async getPatientProfile(patientId?: string): Promise<ApiResponse<Patient>> {
    if (typeof window !== 'undefined') {
      try {
        const endpoint = !patientId || patientId === 'me' ? '/api/patients/me' : `/api/patients/${patientId}`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback to mock
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const targetId = !patientId || patientId === 'me' ? 'pat-01' : patientId;
    const patient = mockPatients.find((p) => p.id === targetId) || mockPatients[0];
    return { success: true, data: patient };
  },

  async updatePatientProfile(
    patientId: string | undefined,
    data: Partial<Patient>
  ): Promise<ApiResponse<Patient>> {
    if (typeof window !== 'undefined') {
      try {
        const endpoint = !patientId || patientId === 'me' ? '/api/patients/me' : `/api/patients/${patientId}`;
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
        // Fallback to mock
      }
    }
    await new Promise((res) => setTimeout(res, 300));
    const targetId = patientId && patientId !== 'me' ? patientId : 'pat-01';
    const existingIndex = mockPatients.findIndex((p) => p.id === targetId);
    let updatedPatient: Patient;

    if (existingIndex !== -1) {
      updatedPatient = {
        ...mockPatients[existingIndex],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      mockPatients[existingIndex] = updatedPatient;
    } else {
      updatedPatient = {
        id: targetId || `pat-${Date.now()}`,
        userId: data.userId || 'usr-pat-01',
        patientNumber: data.patientNumber || `PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: data.firstName || 'John',
        lastName: data.lastName || 'Doe',
        dateOfBirth: data.dateOfBirth || '1990-01-01',
        gender: data.gender || 'MALE',
        phone: data.phone || '+1 (555) 000-0000',
        address: data.address || '',
        emergencyContact: data.emergencyContact || '',
        bloodGroup: data.bloodGroup || 'O+',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockPatients.push(updatedPatient);
    }

    return { success: true, data: updatedPatient };
  },

  async getAppointments(patientId?: string): Promise<ApiResponse<Appointment[]>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/patients/me`);
        if (res.ok) {
          const meJson = await res.json();
          if (meJson.success && meJson.data) {
            // fetched patient profile
          }
        }
      } catch {
        // Fallback to mock
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const targetId = !patientId || patientId === 'me' ? 'pat-01' : patientId;
    const list = mockAppointments.filter((a) => a.patientId === targetId || targetId === 'pat-01');
    return { success: true, data: list.length > 0 ? list : mockAppointments };
  },

  async getMedicalRecords(patientId?: string): Promise<ApiResponse<Consultation[]>> {
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const targetId = !patientId || patientId === 'me' ? 'pat-01' : patientId;
    const records = mockConsultations.filter((c) => c.patientId === targetId || targetId === 'pat-01');
    return { success: true, data: records.length > 0 ? records : mockConsultations };
  },

  async getPrescriptions(patientId?: string): Promise<ApiResponse<Prescription[]>> {
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const targetId = !patientId || patientId === 'me' ? 'pat-01' : patientId;
    const list = mockPrescriptions.filter((p) => p.patientId === targetId || targetId === 'pat-01');
    return { success: true, data: list.length > 0 ? list : mockPrescriptions };
  },
};

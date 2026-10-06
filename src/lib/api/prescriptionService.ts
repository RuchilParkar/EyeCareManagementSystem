import { Prescription, PrescriptionStatus, ApiResponse } from '@/types';

export interface CreatePrescriptionItemInput {
  medicineName: string;
  dosage: string;
  frequency: string;
  route?: string;
  duration: string;
  instructions?: string;
}

export interface CreatePrescriptionInput {
  patientId: string;
  doctorId?: string;
  appointmentId?: string;
  consultationId?: string;
  notes?: string;
  items: CreatePrescriptionItemInput[];
}

export const prescriptionService = {
  async getPrescriptions(params?: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    consultationId?: string;
    status?: string;
  }): Promise<ApiResponse<Prescription[]>> {
    try {
      const url = new URL('/api/prescriptions', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      if (params?.patientId) url.searchParams.set('patientId', params.patientId);
      if (params?.doctorId) url.searchParams.set('doctorId', params.doctorId);
      if (params?.appointmentId) url.searchParams.set('appointmentId', params.appointmentId);
      if (params?.consultationId) url.searchParams.set('consultationId', params.consultationId);
      if (params?.status) url.searchParams.set('status', params.status);

      const res = await fetch(url.toString());
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to fetch prescriptions.' },
      };
    }
  },

  async getPrescriptionById(prescriptionId: string): Promise<ApiResponse<Prescription>> {
    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}`);
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to fetch prescription details.' },
      };
    }
  },

  async createPrescription(data: CreatePrescriptionInput): Promise<ApiResponse<Prescription>> {
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to create prescription.' },
      };
    }
  },

  async updatePrescriptionStatus(
    prescriptionId: string,
    status: PrescriptionStatus,
    notes?: string
  ): Promise<ApiResponse<Prescription>> {
    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to update prescription status.' },
      };
    }
  },
};

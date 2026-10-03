import { Appointment, ApiResponse } from '@/types';

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export const appointmentService = {
  async getAvailableSlots(doctorId?: string, date?: string): Promise<ApiResponse<TimeSlot[]>> {
    try {
      const url = new URL('/api/appointments/slots', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      if (doctorId) url.searchParams.set('doctorId', doctorId);
      if (date) url.searchParams.set('date', date);

      const res = await fetch(url.toString());
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to connect to appointment slots service.' },
      };
    }
  },

  async getAppointments(params?: {
    patientId?: string;
    doctorId?: string;
    date?: string;
    status?: string;
  }): Promise<ApiResponse<Appointment[]>> {
    try {
      const url = new URL('/api/appointments', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      if (params?.patientId) url.searchParams.set('patientId', params.patientId);
      if (params?.doctorId) url.searchParams.set('doctorId', params.doctorId);
      if (params?.date) url.searchParams.set('date', params.date);
      if (params?.status) url.searchParams.set('status', params.status);

      const res = await fetch(url.toString());
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to fetch appointments.' },
      };
    }
  },

  async bookAppointment(data: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to submit appointment booking.' },
      };
    }
  },

  async rescheduleAppointment(
    appointmentId: string,
    newDate: string,
    newSlot: string,
    reason?: string
  ): Promise<ApiResponse<Appointment>> {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentDate: newDate,
          startTime: newSlot,
          reason,
        }),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to reschedule appointment.' },
      };
    }
  },

  async cancelAppointment(appointmentId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
        }),
      });
      const json = await res.json();
      if (json.success) {
        return { success: true, data: { message: `Appointment ${appointmentId} cancelled.` } };
      }
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to cancel appointment.' },
      };
    }
  },

  async updateAppointmentStatus(
    appointmentId: string,
    status: string,
    notes?: string
  ): Promise<ApiResponse<Appointment>> {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notes,
        }),
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: err.message || 'Failed to update appointment status.' },
      };
    }
  },
};

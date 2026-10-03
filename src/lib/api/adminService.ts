import {
  Doctor,
  Patient,
  Service,
  DashboardStats,
  StaffMember,
  AuditLog,
  HospitalSettings,
  ReportSummary,
  ApiResponse,
} from '@/types';
import {
  mockDoctors,
  mockPatients,
  mockServices,
  mockDashboardStats,
  mockStaffMembers,
  mockAuditLogs,
  mockHospitalSettings,
  mockReportSummary,
} from '@/mock';

const DELAY_MS = 250;

export const adminService = {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    await new Promise((res) => setTimeout(res, DELAY_MS));
    return { success: true, data: mockDashboardStats };
  },

  async getDoctors(): Promise<ApiResponse<Doctor[]>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/doctors');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    return { success: true, data: mockDoctors };
  },

  async getPatients(): Promise<ApiResponse<Patient[]>> {
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

  async getServices(): Promise<ApiResponse<Service[]>> {
    await new Promise((res) => setTimeout(res, DELAY_MS));
    return { success: true, data: mockServices };
  },

  async addService(data: Partial<Service>): Promise<ApiResponse<Service>> {
    await new Promise((res) => setTimeout(res, 300));
    const newService: Service = {
      id: `srv-${Date.now()}`,
      departmentId: data.departmentId || 'dept-01',
      name: data.name || 'New Eye Service',
      description: data.description || 'Service description',
      durationMinutes: data.durationMinutes || 30,
      price: data.price || 100,
      status: 'ACTIVE',
    };
    mockServices.push(newService);
    return { success: true, data: newService };
  },

  async getStaffMembers(): Promise<ApiResponse<StaffMember[]>> {
    await new Promise((res) => setTimeout(res, DELAY_MS));
    return { success: true, data: mockStaffMembers };
  },

  async getAuditLogs(): Promise<ApiResponse<AuditLog[]>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/audit');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    return { success: true, data: mockAuditLogs };
  },

  async getHospitalSettings(): Promise<ApiResponse<HospitalSettings>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    return { success: true, data: mockHospitalSettings };
  },

  getSettings(): Promise<ApiResponse<HospitalSettings>> {
    return this.getHospitalSettings();
  },

  async updateHospitalSettings(data: Partial<HospitalSettings>): Promise<ApiResponse<HospitalSettings>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
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
    Object.assign(mockHospitalSettings, data);
    return { success: true, data: mockHospitalSettings };
  },

  updateSettings(data: Partial<HospitalSettings>): Promise<ApiResponse<HospitalSettings>> {
    return this.updateHospitalSettings(data);
  },

  async getReportsSummary(): Promise<ApiResponse<ReportSummary>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/reports');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    return { success: true, data: mockReportSummary };
  },
};

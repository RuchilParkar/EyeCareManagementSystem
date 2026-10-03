import { User, Patient, ApiResponse } from '@/types';
import { mockUsers, mockPatients } from '@/mock';

const DELAY_MS = 250;

export const authService = {
  async login(email: string, password = 'password123'): Promise<ApiResponse<User>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        return json;
      } catch {
        // Fallback for offline dev mode
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or user account not found.',
        },
      };
    }

    return {
      success: true,
      data: user,
    };
  },

  async registerPatient(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    address?: string;
    emergencyContact?: string;
  }): Promise<ApiResponse<{ user: User; patient: Patient }>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            address: data.address || 'Standard Address',
            emergencyContact: data.emergencyContact || 'Standard Contact',
          }),
        });
        const json = await res.json();
        return json;
      } catch {
        // Fallback for offline dev mode
      }
    }
    await new Promise((res) => setTimeout(res, 350));

    const existing = mockUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      return {
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'An account with this email address already exists.',
          fields: { email: 'Email is already registered.' },
        },
      };
    }

    const newUser: User = {
      id: `usr-pat-${Date.now()}`,
      email: data.email,
      role: 'PATIENT',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      userId: newUser.id,
      patientNumber: `PAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      address: data.address || '',
      emergencyContact: data.emergencyContact || '',
      bloodGroup: 'O+',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    mockPatients.push(newPatient);

    return {
      success: true,
      data: { user: newUser, patient: newPatient },
    };
  },

  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    await new Promise((res) => setTimeout(res, 300));
    return {
      success: true,
      data: {
        message: `Password reset instructions have been dispatched to ${email}.`,
      },
    };
  },

  async resetPassword(email: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    await new Promise((res) => setTimeout(res, 300));
    if (email && newPassword) {
      // Simulate password update
    }
    return {
      success: true,
      data: {
        message: 'Your password has been successfully updated. You may now sign in.',
      },
    };
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) return json;
        }
      } catch {
        // Fallback for offline dev mode
      }
    }
    await new Promise((res) => setTimeout(res, DELAY_MS));
    const user = mockUsers[0];

    if (!user) {
      return {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User session expired or not found.',
        },
      };
    }

    return {
      success: true,
      data: user,
    };
  },

  async logout(): Promise<ApiResponse<{ message: string }>> {
    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Fallback for offline dev mode
      }
    }
    await new Promise((res) => setTimeout(res, 150));
    return {
      success: true,
      data: { message: 'Logged out successfully.' },
    };
  },
};

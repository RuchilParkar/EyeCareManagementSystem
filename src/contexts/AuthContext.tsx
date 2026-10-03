'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/mock';
import { authService } from '@/lib/api/authService';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  setRole: (role: UserRole, userPayload?: User | null) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('eyecare_user_role') as UserRole | null;
      if (storedRole && ['PATIENT', 'DOCTOR', 'ADMIN', 'GUEST'].includes(storedRole)) {
        return storedRole;
      }
    }
    return 'PATIENT';
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('eyecare_user_data');
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch {
          // Fallback
        }
      }
    }
    return mockUsers.find((u) => u.role === 'PATIENT') || mockUsers[0];
  });

  const refreshSession = async () => {
    try {
      const res = await authService.getCurrentUser();
      if (res.success && res.data) {
        const sessionUser = res.data;
        setUser(sessionUser);
        setRoleState(sessionUser.role);
        if (typeof window !== 'undefined') {
          localStorage.setItem('eyecare_user_role', sessionUser.role);
          localStorage.setItem('eyecare_user_data', JSON.stringify(sessionUser));
        }
      }
    } catch {
      // Offline or fallback to stored state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const setRole = (newRole: UserRole, userPayload?: User | null) => {
    setRoleState(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem('eyecare_user_role', newRole);
    }
    if (newRole === 'GUEST') {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('eyecare_user_data');
      }
    } else {
      const foundUser = userPayload || mockUsers.find((u) => u.role === newRole) || {
        id: `usr-${newRole.toLowerCase()}-01`,
        email: `${newRole.toLowerCase()}@clearvisioneyecare.com`,
        role: newRole,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(foundUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('eyecare_user_data', JSON.stringify(foundUser));
      }
    }
  };

  const logout = async () => {
    await authService.logout();
    setRoleState('GUEST');
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eyecare_user_role');
      localStorage.removeItem('eyecare_user_data');
    }
  };

  const isAuthenticated = role !== 'GUEST' && user !== null;

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, isLoading, setRole, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { IUser, UserRole, ClearanceLevel, UserStatus } from '@netra-shakti/shared-types';
import { authService, RegisterPayload } from '@/services/auth.service';

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<any>;
  signup: (payload: RegisterPayload) => Promise<any>;
  register: (payload: RegisterPayload) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch {
      // 401 is normal for guests/unauthenticated visitors
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
    const result = await authService.login({ username, password });
    if (result.accessToken && typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      localStorage.setItem('ns_access_token', result.accessToken);
    }
    setUser(result.user);
    if (result.passwordChangeRequired) {
      router.push('/profile?changePassword=true');
    } else {
      router.push('/dashboard');
    }
    return result;
  };

  const register = async (payload: RegisterPayload) => {
    return authService.register(payload);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Invalidate frontend state regardless of network response
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ns_access_token');
      }
      setUser(null);
      router.push('/login');
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true;
    return roles.includes(user.role);
  };

  const value: AuthContextType = {
    user,
    loading,
    isLoading: loading,
    isAuthenticated: !loading && !!user,
    login,
    signup: register,
    register,
    logout,
    refreshUser,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


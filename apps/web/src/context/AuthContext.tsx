'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';

import { useRouter } from 'next/navigation';

import {
  IUser,
  UserRole
} from '@netra-shakti/shared-types';

import {
  authService,
  RegisterPayload
} from '@/services/auth.service';

interface AuthContextType {
  user: IUser | null;

  loading: boolean;

  isLoading: boolean;

  isAuthenticated: boolean;

  login: (
    username: string,
    password: string
  ) => Promise<any>;

  signup: (
    payload: RegisterPayload
  ) => Promise<any>;

  register: (
    payload: RegisterPayload
  ) => Promise<any>;

  logout: () => Promise<void>;

  refreshUser: () => Promise<void>;

  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext =
  createContext<AuthContextType | null>(null);

/*
 * =========================================================
 * AUTH PROVIDER
 * =========================================================
 *
 * Authentication is backend controlled.
 *
 * Access/session authentication should be handled using
 * Secure + HttpOnly cookies.
 *
 * We intentionally DO NOT use localStorage for:
 *
 * - access tokens
 * - refresh tokens
 * - authenticated user identity
 * - fake/demo authentication
 *
 * =========================================================
 */

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] =
    useState<IUser | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const router = useRouter();

  /*
   * =======================================================
   * REFRESH AUTHENTICATED USER
   * =======================================================
   *
   * Calls backend /auth/me endpoint through authService.
   *
   * Browser automatically sends HttpOnly cookie when the
   * API client uses credentials: "include".
   */

  const refreshUser = useCallback(async () => {
    try {
      const currentUser =
        await authService.getCurrentUser();

      setUser(currentUser);
    } catch {
      /*
       * 401/403 is normal when:
       *
       * - visitor has not logged in
       * - session expired
       * - cookie is invalid
       */

      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * =======================================================
   * INITIAL SESSION CHECK
   * =======================================================
   */

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  /*
   * =======================================================
   * LOGIN
   * =======================================================
   */

  const login = async (
    username: string,
    password: string
  ) => {
    const result = await authService.login({
      username,
      password
    });

    /*
     * Backend authentication must set the session cookie.
     *
     * Example:
     *
     * Set-Cookie:
     * ns_access_token=...
     * HttpOnly
     * Secure
     * SameSite=...
     */

    if (result?.user) {
      setUser(result.user);
    } else {
      /*
       * If backend does not directly return user details,
       * retrieve them through /auth/me.
       */

      const currentUser =
        await authService.getCurrentUser();

      setUser(currentUser);
    }

    /*
     * User may be required to change their password.
     */

    if (result?.passwordChangeRequired) {
      router.push(
        '/profile?changePassword=true'
      );
    } else {
      router.push('/dashboard');
    }

    router.refresh();

    return result;
  };

  /*
   * =======================================================
   * REGISTRATION / SIGNUP
   * =======================================================
   */

  const register = async (
    payload: RegisterPayload
  ) => {
    const result =
      await authService.register(payload);

    return result;
  };

  /*
   * =======================================================
   * LOGOUT
   * =======================================================
   */

  const logout = async () => {
    try {
      /*
       * Backend should invalidate the session and clear
       * the HttpOnly cookie.
       */

      await authService.logout();
    } catch (error) {
      /*
       * Even if backend logout request fails,
       * frontend authentication state must be cleared.
       */

      if (
        process.env.NODE_ENV ===
        'development'
      ) {
        console.error(
          'Logout request failed:',
          error
        );
      }
    } finally {
      /*
       * Remove legacy tokens from previous versions.
       *
       * These should NOT be used for authentication anymore.
       */

      if (typeof window !== 'undefined') {
        localStorage.removeItem(
          'ns_access_token'
        );

        localStorage.removeItem(
          'ns_current_user'
        );
      }

      setUser(null);

      router.replace('/login');

      router.refresh();
    }
  };

  /*
   * =======================================================
   * ROLE AUTHORIZATION HELPER
   * =======================================================
   *
   * IMPORTANT:
   *
   * This is only for frontend UI visibility.
   *
   * Backend MUST independently enforce RBAC.
   */

  const hasRole = (
    ...roles: UserRole[]
  ): boolean => {
    if (!user) {
      return false;
    }

    /*
     * Super Admin receives access to all frontend roles.
     */

    if (
      user.role ===
      UserRole.SUPER_ADMIN
    ) {
      return true;
    }

    return roles.includes(user.role);
  };

  /*
   * =======================================================
   * CONTEXT VALUE
   * =======================================================
   */

  const value: AuthContextType = {
    user,

    loading,

    isLoading: loading,

    isAuthenticated:
      !loading && Boolean(user),

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

/*
 * =========================================================
 * AUTH HOOK
 * =========================================================
 */

export const useAuth =
  (): AuthContextType => {
    const context =
      useContext(AuthContext);

    if (!context) {
      throw new Error(
        'useAuth must be used within an AuthProvider'
      );
    }

    return context;
  };
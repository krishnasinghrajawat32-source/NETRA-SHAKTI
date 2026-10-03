import { api } from '@/lib/api-client';
import { IUser } from '@netra-shakti/shared-types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  displayName: string;
  department?: string;
  rank?: string;
  unit?: string;
  clearanceLevel?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
  passwordChangeRequired?: boolean;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return api.post<AuthResponse>('/auth/login', credentials);
  },

  register: async (payload: RegisterPayload): Promise<{ message: string; user: IUser }> => {
    return api.post('/auth/register', payload);
  },

  logout: async (): Promise<{ message: string }> => {
    return api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<IUser> => {
    return api.get<IUser>('/auth/me');
  },

  refreshToken: async (token?: string): Promise<{ accessToken: string; refreshToken: string }> => {
    return api.post('/auth/refresh', { refreshToken: token });
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  }
};

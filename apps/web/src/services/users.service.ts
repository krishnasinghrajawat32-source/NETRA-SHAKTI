import { api } from '@/lib/api-client';
import { IUser, UserRole, ClearanceLevel, UserStatus } from '@netra-shakti/shared-types';

export interface UsersFilter {
  role?: UserRole;
  clearanceLevel?: ClearanceLevel;
  status?: UserStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const usersService = {
  listUsers: async (filter?: UsersFilter): Promise<{ users: IUser[]; total: number }> => {
    return api.get<{ users: IUser[]; total: number }>('/users', { params: filter as any });
  },

  getUserById: async (id: string): Promise<IUser> => {
    return api.get<IUser>(`/users/${id}`);
  },

  createUser: async (userData: any): Promise<IUser> => {
    return api.post<IUser>('/users', userData);
  },

  updateUser: async (id: string, updateData: any): Promise<IUser> => {
    return api.patch<IUser>(`/users/${id}`, updateData);
  },

  toggleSuspend: async (id: string): Promise<{ message: string; status: UserStatus }> => {
    return api.post(`/users/${id}/suspend`);
  },

  resetPassword: async (id: string, newPassword?: string): Promise<{ message: string }> => {
    return api.post(`/users/${id}/reset-password`, { newPassword });
  }
};

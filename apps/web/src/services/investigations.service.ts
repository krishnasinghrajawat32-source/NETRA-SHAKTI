import { api } from '@/lib/api-client';
import { IInvestigation } from '@netra-shakti/shared-types';

export const investigationsService = {
  listInvestigations: async (filter?: any): Promise<{ investigations: IInvestigation[]; total: number }> => {
    return api.get<{ investigations: IInvestigation[]; total: number }>('/investigations', { params: filter });
  },

  getInvestigationById: async (id: string): Promise<IInvestigation> => {
    return api.get<IInvestigation>(`/investigations/${id}`);
  },

  createInvestigation: async (data: { title: string; description?: string }): Promise<IInvestigation> => {
    return api.post<IInvestigation>('/investigations', data);
  },

  uploadEvidence: async (investigationId: string, formData: FormData): Promise<any> => {
    return api.post(`/investigations/${investigationId}/evidence`, formData);
  },

  analyzeInvestigation: async (investigationId: string): Promise<any> => {
    return api.post(`/investigations/${investigationId}/analyze`, {});
  }
};

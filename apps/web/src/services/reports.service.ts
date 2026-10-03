import { api } from '@/lib/api-client';

export const reportsService = {
  getSystemSummary: async (): Promise<any> => {
    return api.get('/reports/summary');
  },

  getForensicAttributionReport: async (investigationId: string): Promise<any> => {
    return api.get(`/reports/attribution/${investigationId}`);
  },

  exportForensicAttributionPdf: async (investigationId: string): Promise<Blob> => {
    return api.getBlob(`/reports/attribution/${investigationId}/export-pdf`);
  }
};

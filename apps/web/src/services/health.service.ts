import { api } from '@/lib/api-client';

export interface SystemHealthResponse {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  version: string;
  uptimeSeconds: number;
  components: {
    database: { status: 'UP' | 'DOWN'; latencyMs?: number; details?: string };
    storage: { status: 'UP' | 'DOWN'; latencyMs?: number; details?: string };
    crypto: { status: 'UP' | 'DOWN'; provider: string; algorithm: string };
    ledger: { status: 'UP' | 'DOWN'; sequenceCount: number };
    watermark: { status: 'UP' | 'DOWN'; algorithm: string };
    mlService: { status: 'UP' | 'DOWN' | 'OFFLINE'; latencyMs?: number; details?: string };
  };
}

export const healthService = {
  checkHealth: async (): Promise<SystemHealthResponse> => {
    return api.get<SystemHealthResponse>('/health');
  },

  checkDeepHealth: async (): Promise<any> => {
    return api.get('/health/deep');
  }
};

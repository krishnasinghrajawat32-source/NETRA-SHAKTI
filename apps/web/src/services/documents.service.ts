import { api } from '@/lib/api-client';
import { IDocument, IDecryptionSession } from '@netra-shakti/shared-types';

export interface DocumentsFilter {
  classification?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const documentsService = {
  listDocuments: async (filter?: DocumentsFilter): Promise<{ documents: IDocument[]; total: number }> => {
    return api.get<{ documents: IDocument[]; total: number }>('/documents', { params: filter as any });
  },

  getDocumentById: async (id: string): Promise<IDocument> => {
    return api.get<IDocument>(`/documents/${id}`);
  },

  uploadDocument: async (formData: FormData): Promise<IDocument> => {
    return api.post<IDocument>('/documents', formData);
  },

  assignRecipient: async (documentId: string, recipientId: string, policy?: any): Promise<any> => {
    return api.post(`/documents/${documentId}/recipients`, { recipientId, ...policy });
  },

  revokeRecipient: async (documentId: string, recipientId: string): Promise<any> => {
    return api.delete(`/documents/${documentId}/recipients/${recipientId}`);
  },

  startDecryptionSession: async (documentId: string): Promise<IDecryptionSession> => {
    return api.post<IDecryptionSession>(`/documents/${documentId}/decryption-sessions`, {});
  },

  getDecryptionSession: async (sessionId: string): Promise<IDecryptionSession> => {
    return api.get<IDecryptionSession>(`/decryption-sessions/${sessionId}`);
  },

  streamDocumentBlob: async (sessionId: string): Promise<Blob> => {
    return api.getBlob(`/decryption-sessions/${sessionId}/stream`);
  }
};

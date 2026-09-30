'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import {
  IDocument,
  DocumentClassification,
  UserRole
} from '@netra-shakti/shared-types';
import {
  FileText,
  UploadCloud,
  Search,
  Lock,
  Eye,
  Shield,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  ArrowRight
} from 'lucide-react';

const CLASSIFICATION_BADGES: Record<string, string> = {
  TOP_SECRET: 'bg-cyber-red/20 text-cyber-red border-cyber-red/50',
  SECRET: 'bg-cyber-gold/20 text-cyber-gold border-cyber-gold/50',
  CONFIDENTIAL: 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50',
  UNCLASSIFIED: 'bg-gray-500/20 text-gray-300 border-gray-500/50'
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<DocumentClassification>(
    DocumentClassification.CONFIDENTIAL
  );
  const [file, setFile] = useState<File | null>(null);
  const [allowDownload, setAllowDownload] = useState(false);
  const [maxAccessCount, setMaxAccessCount] = useState(5);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (classification) params.append('classification', classification);

      const res = await api.get<{ documents: IDocument[]; total: number }>(
        `/documents?${params.toString()}`
      );
      setDocuments(res.documents || []);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [search, classification]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a valid confidential PDF document');
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('classification', selectedClassification);
      formData.append('allowDownload', String(allowDownload));
      formData.append('secureViewerOnly', 'true');
      formData.append('watermarkRequired', 'true');
      formData.append('signatureRequired', 'true');
      formData.append('maxAccessCount', String(maxAccessCount));

      await api.post('/documents', formData);

      setIsUploadModalOpen(false);
      setTitle('');
      setDescription('');
      setFile(null);
      await fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Cryptographic ingestion failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this confidential document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  const canUpload = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.SENDER;

  return (
    <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-3">
                <FileText className="w-6 h-6 text-cyber-cyan" />
                <span>CONFIDENTIAL DOCUMENT CATALOG</span>
              </h1>
              <p className="text-xs font-mono text-cyber-muted mt-1">
                Zero-Trust AES-256-GCM Encrypted Document Vault with On-Demand Forensic Issuance.
              </p>
            </div>

            {canUpload && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-5 py-2.5 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 shadow-md shadow-cyber-cyan/20"
              >
                <UploadCloud className="w-4 h-4" />
                <span>INGEST & ENCRYPT PDF</span>
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 bg-cyber-card border border-cyber-border rounded flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by title or document code..."
                className="w-full bg-cyber-surface border border-cyber-border rounded pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
              />
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <span className="text-xs font-mono text-cyber-muted">CLASSIFICATION:</span>
              <select
                value={classification}
                onChange={e => setClassification(e.target.value)}
                className="bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan"
              >
                <option value="">ALL LEVELS</option>
                <option value="TOP_SECRET">TOP SECRET</option>
                <option value="SECRET">SECRET</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="UNCLASSIFIED">UNCLASSIFIED</option>
              </select>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-cyber-card border border-cyber-border rounded overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-cyber-cyan">
                AUTHENTICATING CLEARANCE & QUERYING VAULT...
              </div>
            ) : documents.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <FileText className="w-10 h-10 text-cyber-muted mx-auto" />
                <div className="text-sm font-mono font-bold text-white uppercase">
                  NO PROTECTED DOCUMENTS FOUND
                </div>
                <p className="text-xs font-mono text-cyber-muted max-w-sm mx-auto">
                  {canUpload
                    ? 'Upload your first confidential PDF to begin military-grade encryption and recipient distribution.'
                    : 'No documents have been assigned to your clearance identity yet.'}
                </p>
                {canUpload && (
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-cyber-cyan text-black font-mono font-bold text-xs"
                  >
                    INGEST FIRST DOCUMENT
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted bg-cyber-surface/50">
                      <th className="p-4">CODE</th>
                      <th className="p-4">TITLE</th>
                      <th className="p-4">CLASSIFICATION</th>
                      <th className="p-4">PAGES</th>
                      <th className="p-4">ORIGINAL HASH (SHA-256)</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-cyber-surface/40 transition-colors">
                        <td className="p-4 font-bold text-cyber-cyan">{doc.documentCode}</td>
                        <td className="p-4">
                          <div className="font-bold text-white">{doc.title}</div>
                          <div className="text-[10px] text-gray-400">{doc.originalFilename}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${CLASSIFICATION_BADGES[doc.classification] || 'text-gray-300'}`}
                          >
                            {doc.classification}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">{doc.pageCount} pg</td>
                        <td className="p-4 text-gray-400 font-mono text-[10px] max-w-[120px] truncate" title={doc.originalHash}>
                          {doc.originalHash.substring(0, 16)}...
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-green/10 text-cyber-green border border-cyber-green/30">
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="px-3 py-1.5 rounded bg-cyber-surface hover:bg-cyber-border border border-cyber-border text-cyber-cyan text-[11px] inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>DETAILS</span>
                          </Link>

                          <Link
                            href={`/documents/${doc.id}/decrypt`}
                            className="px-3 py-1.5 rounded bg-cyber-cyan text-black font-bold hover:bg-cyber-cyan/90 text-[11px] inline-flex items-center space-x-1"
                          >
                            <Lock className="w-3 h-3" />
                            <span>DECRYPT</span>
                          </Link>

                          {canUpload && (
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-1.5 rounded bg-cyber-surface hover:bg-cyber-red/20 text-gray-400 hover:text-cyber-red border border-cyber-border transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ingest Document Modal */}
          {isUploadModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-xl bg-cyber-card border border-cyber-border rounded-lg shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-cyber-border bg-cyber-surface/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-cyber-cyan" />
                    <span className="font-mono font-bold text-sm text-white uppercase">
                      CRYPTOGRAPHIC PDF INGESTION
                    </span>
                  </div>
                  <button
                    onClick={() => setIsUploadModalOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                  {uploadError && (
                    <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      DOCUMENT TITLE *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Strategic Air Defense Protocol 2026"
                      className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      DESCRIPTION / CLASSIFIED DIRECTIVE
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Operational context and handling caveats..."
                      className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        SECURITY CLASSIFICATION *
                      </label>
                      <select
                        value={selectedClassification}
                        onChange={e => setSelectedClassification(e.target.value as DocumentClassification)}
                        className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan"
                      >
                        <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                        <option value="SECRET">SECRET</option>
                        <option value="TOP_SECRET">TOP SECRET</option>
                        <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        MAX RECIPIENT ACCESS COUNT
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={maxAccessCount}
                        onChange={e => setMaxAccessCount(parseInt(e.target.value, 10))}
                        className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                      />
                    </div>
                  </div>

                  {/* File Upload Area */}
                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      PDF DOCUMENT FILE (MAGIC-BYTE VALIDATED) *
                    </label>
                    <div className="border-2 border-dashed border-cyber-border hover:border-cyber-cyan/60 rounded p-4 text-center cursor-pointer bg-cyber-surface/30">
                      <input
                        type="file"
                        accept="application/pdf"
                        required
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="w-full text-xs font-mono text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-cyber-cyan file:text-black cursor-pointer"
                      />
                      {file && (
                        <div className="mt-2 text-[11px] font-mono text-cyber-green flex items-center justify-center space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Ready for AES-256 Encryption: {file.name} ({Math.round(file.size / 1024)} KB)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Policy Flags */}
                  <div className="pt-2 border-t border-cyber-border space-y-2 text-xs font-mono">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowDownload}
                        onChange={e => setAllowDownload(e.target.checked)}
                        className="rounded bg-cyber-surface border-cyber-border text-cyber-cyan focus:ring-0"
                      />
                      <span className="text-gray-300">Allow Authorized Recipient PDF Download</span>
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(false)}
                      className="px-4 py-2 rounded bg-cyber-surface text-gray-300 font-mono text-xs hover:bg-cyber-border"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-5 py-2 rounded bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {uploading ? (
                        <span>ENCRYPTING & ATTESTING...</span>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>ENCRYPT & INGEST</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

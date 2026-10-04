'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import {
  IDocument,
  IUser,
  UserRole,
  ClearanceLevel
} from '@netra-shakti/shared-types';
import {
  FileText,
  Lock,
  Users,
  Shield,
  Clock,
  ArrowLeft,
  UserPlus,
  Key,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2
} from 'lucide-react';

const CLASSIFICATION_BADGES: Record<string, string> = {
  TOP_SECRET: 'bg-cyber-red/20 text-cyber-red border-cyber-red/50',
  SECRET: 'bg-cyber-gold/20 text-cyber-gold border-cyber-gold/50',
  CONFIDENTIAL: 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50',
  UNCLASSIFIED: 'bg-gray-500/20 text-gray-300 border-gray-500/50'
};

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();

  const [document, setDocument] = useState<IDocument | null>(null);
  const [availableUsers, setAvailableUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign Recipient Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const doc = await api.get<IDocument>(`/documents/${id}`);
      setDocument(doc);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const res = await api.get<{ users: IUser[] }>('/users?limit=100');
      setAvailableUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load users for distribution:', err);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocument();
      fetchAvailableUsers();
    }
  }, [id]);

  const handleAssignRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipientId) {
      setAssignError('Please select an authorized personnel identity');
      return;
    }

    setAssignError(null);
    setAssigning(true);

    try {
      await api.post(`/documents/${id}/recipients`, {
        recipientId: selectedRecipientId
      });
      setIsAssignModalOpen(false);
      setSelectedRecipientId('');
      await fetchDocument();
    } catch (err: any) {
      setAssignError(err.message || 'Recipient assignment failed clearance validation');
    } finally {
      setAssigning(false);
    }
  };

  const handleRevokeRecipient = async (recipientId: string) => {
    if (!confirm('Are you sure you want to revoke this recipient\'s access?')) return;
    try {
      await api.delete(`/documents/${id}/recipients/${recipientId}`);
      await fetchDocument();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke access');
    }
  };

  const canManageRecipients =
    user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.ADMIN ||
    (user?.role === UserRole.SENDER && document?.ownerId === user.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-12 text-center font-mono text-cyber-cyan">
            VERIFYING CRYPTOGRAPHIC ACCESS & RETRIEVING POLICY METADATA...
          </main>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-12 text-center space-y-4">
            <div className="text-cyber-red font-mono font-bold text-sm">
              ACCESS DENIED / DOCUMENT NOT FOUND
            </div>
            <p className="text-xs font-mono text-gray-400 max-w-md mx-auto">{error}</p>
            <Link
              href="/documents"
              className="inline-block px-4 py-2 bg-cyber-surface border border-cyber-border text-xs font-mono text-cyber-cyan"
            >
              ← RETURN TO CATALOG
            </Link>
          </main>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Back Button & Top Bar */}
          <div className="flex justify-between items-center">
            <Link
              href="/documents"
              className="text-xs font-mono text-gray-400 hover:text-cyber-cyan flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>BACK TO CATALOG</span>
            </Link>

            <Link
              href={`/documents/${document.id}/decrypt`}
              className="px-6 py-2.5 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 shadow-md shadow-cyber-cyan/20"
            >
              <Lock className="w-4 h-4" />
              <span>START SECURE DECRYPTION SESSION</span>
            </Link>
          </div>

          {/* Document Overview Card */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-cyber-border pb-4">
              <div>
                <div className="text-xs font-mono text-cyber-cyan font-bold">
                  {document.documentCode}
                </div>
                <h1 className="text-2xl font-mono font-bold text-white uppercase mt-1">
                  {document.title}
                </h1>
                <div className="text-xs font-mono text-gray-400 mt-1">
                  Ingested by {document.owner?.displayName || 'Defense Intel'} ({document.owner?.department}) • {new Date(document.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${CLASSIFICATION_BADGES[document.classification] || 'text-gray-300'}`}>
                  {document.classification}
                </span>
                <span className="px-3 py-1 rounded text-xs font-mono bg-cyber-green/15 text-cyber-green border border-cyber-green/40">
                  {document.status}
                </span>
              </div>
            </div>

            {/* Description */}
            {document.description && (
              <div className="p-3 bg-cyber-surface/50 border border-cyber-border rounded text-xs font-mono text-gray-300">
                <span className="text-cyber-muted font-bold block mb-1">HANDLING DIRECTIVE:</span>
                {document.description}
              </div>
            )}

            {/* Cryptographic Hashes & Technical Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                <div className="text-cyber-muted text-[10px]">ORIGINAL PDF HASH (SHA-256)</div>
                <div className="text-gray-200 mt-1 truncate font-bold" title={document.originalHash}>
                  {document.originalHash}
                </div>
              </div>

              <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                <div className="text-cyber-muted text-[10px]">ENCRYPTED BLOB HASH</div>
                <div className="text-gray-200 mt-1 truncate font-bold" title={document.encryptedHash}>
                  {document.encryptedHash}
                </div>
              </div>

              <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                <div className="text-cyber-muted text-[10px]">ENCRYPTION ALGORITHM</div>
                <div className="text-cyber-cyan mt-1 font-bold">AES-256-GCM + Ed25519</div>
              </div>

              <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                <div className="text-cyber-muted text-[10px]">PAGES & SIZE</div>
                <div className="text-gray-200 mt-1 font-bold">
                  {document.pageCount} Pages • {Math.round(document.size / 1024)} KB
                </div>
              </div>
            </div>

            {/* Policy Controls Strip */}
            <div className="p-4 bg-cyber-surface/30 border border-cyber-border rounded flex flex-wrap gap-6 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-cyber-muted">SECURE VIEWER ONLY:</span>
                <span className="text-cyber-green font-bold">ENFORCED</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-cyber-muted">FORENSIC WATERMARK:</span>
                <span className="text-cyber-green font-bold">MANDATORY (DCT STEGO V2)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-cyber-muted">ALLOW PDF DOWNLOAD:</span>
                <span className={document.policies?.allowDownload ? 'text-cyber-cyan font-bold' : 'text-cyber-red font-bold'}>
                  {document.policies?.allowDownload ? 'PERMITTED' : 'RESTRICTED'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-cyber-muted">MAX ACCESS COUNT:</span>
                <span className="text-cyber-gold font-bold">
                  {document.policies?.maxAccessCount ?? 5} SESSIONS
                </span>
              </div>
            </div>
          </div>

          {/* Recipient Distribution Management */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-4">
            <div className="flex justify-between items-center border-b border-cyber-border pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyber-cyan" />
                <h2 className="text-base font-mono font-bold text-white uppercase">
                  AUTHORIZED RECIPIENT DISTRIBUTION
                </h2>
              </div>

              {canManageRecipients && (
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="px-4 py-1.5 rounded bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>ASSIGN AUTHORIZED RECIPIENT</span>
                </button>
              )}
            </div>

            {document.recipients && document.recipients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted bg-cyber-surface/50">
                      <th className="p-3">RECIPIENT NAME</th>
                      <th className="p-3">DEPARTMENT / UNIT</th>
                      <th className="p-3">CLEARANCE LEVEL</th>
                      <th className="p-3">ASSIGNED AT</th>
                      <th className="p-3">ACCESS COUNT</th>
                      <th className="p-3">STATUS</th>
                      {canManageRecipients && <th className="p-3 text-right">ACTION</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {document.recipients.map(dist => (
                      <tr key={dist.id} className="hover:bg-cyber-surface/40">
                        <td className="p-3 font-bold text-white">
                          {dist.recipient?.displayName}
                          <div className="text-[10px] text-gray-400 font-normal">@{dist.recipient?.username}</div>
                        </td>
                        <td className="p-3 text-gray-300">
                          {dist.recipient?.department}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${CLASSIFICATION_BADGES[dist.recipient?.clearanceLevel as string] || 'text-gray-300'}`}>
                            {dist.recipient?.clearanceLevel}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400">
                          {new Date(dist.assignedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-cyber-gold font-bold">
                          {dist.accessCount || 0} / {document.policies?.maxAccessCount || 5}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${dist.status === 'GRANTED' || dist.status === 'ACCESSED' ? 'bg-cyber-green/15 text-cyber-green border border-cyber-green/30' : 'bg-cyber-red/15 text-cyber-red border border-cyber-red/30'}`}>
                            {dist.status}
                          </span>
                        </td>
                        {canManageRecipients && (
                          <td className="p-3 text-right">
                            {dist.status !== 'REVOKED' && (
                              <button
                                onClick={() => handleRevokeRecipient(dist.recipientId)}
                                className="px-2.5 py-1 rounded bg-cyber-surface hover:bg-cyber-red/20 text-gray-400 hover:text-cyber-red border border-cyber-border text-[10px]"
                              >
                                REVOKE ACCESS
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-gray-400">
                No recipients assigned to this document yet. Click &quot;ASSIGN AUTHORIZED RECIPIENT&quot; to authorize distribution.
              </div>
            )}
          </div>

          {/* Assign Recipient Modal */}
          {isAssignModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-lg shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-cyber-border bg-cyber-surface/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-cyber-cyan" />
                    <span className="font-mono font-bold text-sm text-white uppercase">
                      ASSIGN RECIPIENT WITH CLEARANCE CHECK
                    </span>
                  </div>
                  <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAssignRecipient} className="p-6 space-y-4">
                  {assignError && (
                    <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{assignError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      SELECT AUTHORIZED USER (CLEARANCE &gt;= {document.classification}) *
                    </label>
                    <select
                      required
                      value={selectedRecipientId}
                      onChange={e => setSelectedRecipientId(e.target.value)}
                      className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan"
                    >
                      <option value="">-- Choose Personnel Identity --</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.displayName} (@{u.username}) [{u.clearanceLevel}] - {u.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(false)}
                      className="px-4 py-2 rounded bg-cyber-surface text-gray-300 font-mono text-xs hover:bg-cyber-border"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={assigning}
                      className="px-5 py-2 rounded bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 disabled:opacity-50"
                    >
                      {assigning ? 'VERIFYING CLEARANCE...' : 'CONFIRM ASSIGNMENT'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}

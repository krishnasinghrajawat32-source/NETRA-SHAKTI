'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { IDecryptionSession } from '@netra-shakti/shared-types';
import { Lock, Eye, CheckCircle2, AlertCircle, Search, Shield } from 'lucide-react';

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<IDecryptionSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ sessions: IDecryptionSession[]; total: number }>(
        '/decryption-sessions?limit=50'
      );
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to load decryption sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-3">
                <Lock className="w-6 h-6 text-cyber-gold" />
                <span>DECRYPTION SESSIONS & PROVENANCE REGISTRY</span>
              </h1>
              <p className="text-xs font-mono text-cyber-muted mt-1">
                Forensic registry of all authorized decryption events, watermark embeddings, and issued copy hashes.
              </p>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-cyber-card border border-cyber-border rounded overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-cyber-cyan">
                QUERYING DECRYPTION PROVENANCE REGISTRY...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Lock className="w-10 h-10 text-cyber-muted mx-auto" />
                <div className="text-sm font-mono font-bold text-white uppercase">
                  NO DECRYPTION SESSIONS RECORDED
                </div>
                <p className="text-xs font-mono text-cyber-muted max-w-sm mx-auto">
                  When authorized recipients request document decryption, individual session proofs will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted bg-cyber-surface/50">
                      <th className="p-4">SESSION CODE</th>
                      <th className="p-4">DOCUMENT</th>
                      <th className="p-4">RECIPIENT</th>
                      <th className="p-4">WATERMARK CODE</th>
                      <th className="p-4">ISSUED HASH (SHA-256)</th>
                      <th className="p-4">COMPLETED AT</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">STREAM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {sessions.map(sess => (
                      <tr key={sess.id} className="hover:bg-cyber-surface/40">
                        <td className="p-4 font-bold text-cyber-cyan">{sess.sessionCode}</td>
                        <td className="p-4">
                          <div className="font-bold text-white">{sess.document?.title}</div>
                          <div className="text-[10px] text-gray-400">{sess.document?.documentCode}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-white font-bold">{sess.recipient?.displayName}</div>
                          <div className="text-[10px] text-gray-400">{sess.recipient?.department}</div>
                        </td>
                        <td className="p-4 text-cyber-green font-mono text-[11px]">
                          {sess.watermark?.watermarkCode || 'NS-WM-PROTECTED'}
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-[10px] max-w-[120px] truncate" title={sess.issuedDocumentHash || ''}>
                          {sess.issuedDocumentHash ? `${sess.issuedDocumentHash.substring(0, 14)}...` : 'N/A'}
                        </td>
                        <td className="p-4 text-gray-400">
                          {sess.completedAt ? new Date(sess.completedAt).toLocaleString() : 'In Progress'}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${sess.status === 'COMPLETED' ? 'bg-cyber-green/15 text-cyber-green border border-cyber-green/30' : 'bg-cyber-red/15 text-cyber-red border border-cyber-red/30'}`}>
                            {sess.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {sess.status === 'COMPLETED' && (
                            <a
                              href={`/api/v1/decryption-sessions/${sess.id}/stream`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded bg-cyber-surface hover:bg-cyber-border border border-cyber-border text-cyber-cyan text-[11px] inline-flex items-center space-x-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>VIEW</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

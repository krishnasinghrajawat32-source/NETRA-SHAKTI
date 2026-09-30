'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { IWatermark } from '@netra-shakti/shared-types';
import { Fingerprint, CheckCircle2, AlertTriangle, Search, Shield, Terminal } from 'lucide-react';

export default function WatermarksPage() {
  const [watermarks, setWatermarks] = useState<IWatermark[]>([]);
  const [loading, setLoading] = useState(true);

  // Verifier Tool State
  const [testToken, setTestToken] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  const fetchWatermarks = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ watermarks: IWatermark[]; total: number }>('/watermarks?limit=50');
      setWatermarks(res.watermarks || []);
    } catch (err) {
      console.error('Failed to load watermarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatermarks();
  }, []);

  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testToken) return;

    setVerifying(true);
    setVerificationResult(null);

    try {
      const res = await api.post('/watermarks/decode-token', { token: testToken.trim() });
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({ isValid: false, error: err.message });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-3">
              <Fingerprint className="w-6 h-6 text-cyber-cyan" />
              <span>FORENSIC WATERMARK REGISTRY</span>
            </h1>
            <p className="text-xs font-mono text-cyber-muted mt-1">
              Cryptographically registered invisible multi-layer forensic fingerprints and steganographic payloads.
            </p>
          </div>

          {/* Token Decoder & Cryptographic Verifier Tool */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-4">
            <div className="flex items-center space-x-2 text-sm font-mono font-bold text-white uppercase">
              <Terminal className="w-4 h-4 text-cyber-cyan" />
              <span>INTERACTIVE FORENSIC TOKEN VERIFIER</span>
            </div>

            <form onSubmit={handleVerifyToken} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={testToken}
                  onChange={e => setTestToken(e.target.value)}
                  placeholder="Paste raw forensic watermark token (e.g. NSWM$2.4.0$ey...$9a8b...)"
                  className="w-full bg-cyber-surface border border-cyber-border rounded px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={verifying || !testToken}
                  className="px-5 py-2 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 disabled:opacity-50"
                >
                  {verifying ? 'VERIFYING CRYPTOGRAPHIC CHECKSUM...' : 'VERIFY & DECODE TOKEN'}
                </button>
              </div>
            </form>

            {verificationResult && (
              <div className={`p-4 rounded border font-mono text-xs ${verificationResult.isValid ? 'bg-cyber-green/10 border-cyber-green/40' : 'bg-cyber-red/10 border-cyber-red/40'}`}>
                {verificationResult.isValid ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-cyber-green font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CRYPTOGRAPHIC WATERMARK VALIDATED // INTEGRITY CONFIRMED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300 pt-2 border-t border-cyber-green/20">
                      <div><span className="text-cyber-muted">Watermark Code:</span> {verificationResult.payload?.watermarkCode}</div>
                      <div><span className="text-cyber-muted">Version:</span> {verificationResult.payload?.version}</div>
                      <div><span className="text-cyber-muted">Document ID:</span> {verificationResult.payload?.documentId}</div>
                      <div><span className="text-cyber-muted">Recipient ID:</span> {verificationResult.payload?.recipientId}</div>
                      <div><span className="text-cyber-muted">Session ID:</span> {verificationResult.payload?.sessionId}</div>
                      <div><span className="text-cyber-muted">Checksum:</span> {verificationResult.payload?.checksum?.substring(0, 16)}...</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-cyber-red">
                    <AlertTriangle className="w-4 h-4" />
                    <span>INVALID TOKEN: Cryptographic signature or checksum mismatch.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Watermarks Table */}
          <div className="bg-cyber-card border border-cyber-border rounded overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-cyber-cyan">
                QUERYING WATERMARK REGISTRY...
              </div>
            ) : watermarks.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Fingerprint className="w-10 h-10 text-cyber-muted mx-auto" />
                <div className="text-sm font-mono font-bold text-white uppercase">
                  NO REGISTERED WATERMARKS
                </div>
                <p className="text-xs font-mono text-cyber-muted max-w-sm mx-auto">
                  Watermarks are dynamically generated and injected during authorized recipient decryption sessions.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted bg-cyber-surface/50">
                      <th className="p-4">WATERMARK CODE</th>
                      <th className="p-4">DOCUMENT</th>
                      <th className="p-4">RECIPIENT</th>
                      <th className="p-4">ALGORITHM</th>
                      <th className="p-4">PAYLOAD HASH (SHA-256)</th>
                      <th className="p-4">CREATED AT</th>
                      <th className="p-4">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {watermarks.map(wm => (
                      <tr key={wm.id} className="hover:bg-cyber-surface/40">
                        <td className="p-4 font-bold text-cyber-green">{wm.watermarkCode}</td>
                        <td className="p-4">
                          <div className="font-bold text-white">{wm.document?.title}</div>
                          <div className="text-[10px] text-gray-400">{wm.document?.documentCode}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-white font-bold">{wm.session?.recipient?.displayName || 'Authorized Recipient'}</div>
                          <div className="text-[10px] text-gray-400">{wm.session?.recipient?.department}</div>
                        </td>
                        <td className="p-4 text-cyber-cyan font-bold">{wm.algorithm} v{wm.version}</td>
                        <td className="p-4 text-gray-400 font-mono text-[10px] max-w-[120px] truncate" title={wm.payloadHash}>
                          {wm.payloadHash.substring(0, 16)}...
                        </td>
                        <td className="p-4 text-gray-400">
                          {new Date(wm.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-green/15 text-cyber-green border border-cyber-green/30">
                            {wm.status}
                          </span>
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

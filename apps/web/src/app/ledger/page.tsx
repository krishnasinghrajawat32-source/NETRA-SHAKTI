'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { ILedgerEvent } from '@netra-shakti/shared-types';
import {
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Lock,
  Link as LinkIcon
} from 'lucide-react';

export default function LedgerPage() {
  const [events, setEvents] = useState<ILedgerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerStatus, setLedgerStatus] = useState<any>(null);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const [eventsRes, statusRes] = await Promise.all([
        api.get<{ events: ILedgerEvent[]; total: number }>('/ledger/events?limit=50'),
        api.get<any>('/ledger/status')
      ]);
      setEvents(eventsRes.events || []);
      setLedgerStatus(statusRes);
    } catch (err) {
      console.error('Failed to load ledger blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      const result = await api.post('/ledger/verify');
      setVerificationResult(result);
    } catch (err: any) {
      setVerificationResult({ isValid: false, reason: err.message });
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-3">
                <Database className="w-6 h-6 text-cyber-gold" />
                <span>IMMUTABLE PROVENANCE LEDGER</span>
              </h1>
              <p className="text-xs font-mono text-cyber-muted mt-1">
                Append-only cryptographic hash-chained provenance ledger with digital signatures.
              </p>
            </div>

            <button
              onClick={handleVerifyChain}
              disabled={verifying}
              className="px-6 py-2.5 bg-cyber-gold text-black font-mono font-bold text-xs hover:bg-cyber-gold/90 transition-all flex items-center space-x-2 disabled:opacity-50 shadow-md shadow-cyber-gold/20"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>COMPUTING FULL HASH-CHAIN PROOF...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>VERIFY LEDGER INTEGRITY</span>
                </>
              )}
            </button>
          </div>

          {/* Ledger Status Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 bg-cyber-card border border-cyber-border rounded">
              <div className="text-cyber-muted text-[10px]">LEDGER PROVIDER</div>
              <div className="text-cyber-cyan font-bold mt-1">LOCAL HASH-CHAIN (AIR-GAPPED)</div>
            </div>

            <div className="p-4 bg-cyber-card border border-cyber-border rounded">
              <div className="text-cyber-muted text-[10px]">TOTAL COMMITTED BLOCKS</div>
              <div className="text-cyber-gold font-bold mt-1 text-lg">
                {ledgerStatus?.totalBlocks ?? events.length} BLOCKS
              </div>
            </div>

            <div className="p-4 bg-cyber-card border border-cyber-border rounded">
              <div className="text-cyber-muted text-[10px]">POST-QUANTUM ATTESTATION</div>
              <div className="text-cyber-green font-bold mt-1">ACTIVE (ML-DSA READY)</div>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verificationResult && (
            <div
              className={`p-5 rounded border font-mono text-xs ${
                verificationResult.isValid
                  ? 'bg-cyber-green/10 border-cyber-green/50 text-white'
                  : 'bg-cyber-red/10 border-cyber-red/50 text-cyber-red'
              }`}
            >
              {verificationResult.isValid ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-cyber-green text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>TAMPER-EVIDENT LEDGER VERIFIED // 100% MATHEMATICAL PROOF CONFIRMED</span>
                  </div>
                  <div className="text-[11px] text-gray-300">
                    All {verificationResult.totalEvents} sequential blocks verified. Every previousHash pointer,
                    canonical eventHash, and cryptographic signature matches perfectly. Zero unauthorized alterations.
                  </div>
                  <div className="text-[10px] text-cyber-muted pt-1">
                    Proof Verified At: {verificationResult.verifiedAt} • Last Valid Hash: {verificationResult.lastValidHash}
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">LEDGER CHAIN TAMPERING DETECTED!</div>
                    <div className="text-[11px] mt-1">{verificationResult.reason}</div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      Chain integrity broken at sequence block #{verificationResult.brokenAtSequence}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ledger Blocks Table */}
          <div className="bg-cyber-card border border-cyber-border rounded overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-cyber-gold">
                TRAVERSING HASH CHAIN BLOCKS...
              </div>
            ) : events.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Database className="w-10 h-10 text-cyber-muted mx-auto" />
                <div className="text-sm font-mono font-bold text-white uppercase">
                  LEDGER IS AT GENESIS STATE
                </div>
                <p className="text-xs font-mono text-cyber-muted max-w-sm mx-auto">
                  New immutable blocks will be created automatically whenever documents are encrypted, decrypted, or issued.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted bg-cyber-surface/50">
                      <th className="p-4">BLOCK #</th>
                      <th className="p-4">EVENT TYPE</th>
                      <th className="p-4">ENTITY</th>
                      <th className="p-4">EVENT HASH (SHA-256)</th>
                      <th className="p-4">PREVIOUS HASH</th>
                      <th className="p-4">SIGNATURE</th>
                      <th className="p-4">COMMITTED AT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {events.map(block => (
                      <tr key={block.id} className="hover:bg-cyber-surface/40">
                        <td className="p-4 font-bold text-cyber-gold">#{block.sequenceNumber}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/30 font-bold">
                            {block.eventType}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">
                          {block.entityType}
                          <div className="text-[10px] text-cyber-muted truncate max-w-[100px]">{block.entityId}</div>
                        </td>
                        <td className="p-4 text-cyber-green font-mono text-[10px] max-w-[130px] truncate" title={block.eventHash}>
                          {block.eventHash.substring(0, 16)}...
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-[10px] max-w-[130px] truncate" title={block.previousHash}>
                          {block.previousHash.substring(0, 16)}...
                        </td>
                        <td className="p-4 text-gray-400 font-mono text-[10px] max-w-[100px] truncate" title={block.signature}>
                          {block.signature.substring(0, 12)}...
                        </td>
                        <td className="p-4 text-gray-400">
                          {new Date(block.createdAt).toLocaleString()}
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

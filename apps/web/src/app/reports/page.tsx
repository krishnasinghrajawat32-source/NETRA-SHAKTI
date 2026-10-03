'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api-client';
import { IInvestigation, BRAND } from '@netra-shakti/shared-types';
import { FileText, Download, ShieldAlert, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function ReportsPage() {
  const { user } = useAuth();
  const [investigations, setInvestigations] = useState<IInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ investigations: IInvestigation[] }>('/investigations');
      setInvestigations(data.investigations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load forensic reports catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadPdf = async (invId: string, caseNumber: string) => {
    setDownloadingId(invId);
    try {
      const blob = await api.getBlob(`/investigations/${invId}/report/pdf`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NETRA_REPORT_${caseNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to export PDF report: ${err.message || 'Network error'}`);
    } finally {
      setDownloadingId(null);
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
                <FileText className="w-6 h-6 text-cyber-cyan" />
                <span>FORENSIC ATTRIBUTION REPORTS</span>
              </h1>
              <p className="text-xs font-mono text-cyber-muted mt-1">
                Cryptographically sealed and signed PDF reports with immutable hash chain verification.
              </p>
            </div>

            <button
              onClick={fetchReports}
              disabled={loading}
              className="px-4 py-2 bg-cyber-surface hover:border-cyber-cyan border border-cyber-border rounded text-xs font-mono text-gray-300 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>REFRESH CATALOG</span>
            </button>
          </div>

          {error && (
            <div className="p-4 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Reports Table */}
          <div className="bg-cyber-card border border-cyber-border rounded overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-cyber-cyan">
                QUERYING DEFENCE FORENSIC ARCHIVES...
              </div>
            ) : investigations.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <FileText className="w-10 h-10 text-cyber-muted mx-auto" />
                <div className="text-sm font-mono font-bold text-white uppercase">
                  NO FORENSIC REPORTS AVAILABLE
                </div>
                <p className="text-xs font-mono text-cyber-muted max-w-sm mx-auto">
                  Execute evidence analysis inside an open investigation case to generate sealed forensic attribution reports.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted bg-cyber-surface/50">
                      <th className="p-4">CASE NUMBER</th>
                      <th className="p-4">INVESTIGATION TITLE</th>
                      <th className="p-4">CASE STATUS</th>
                      <th className="p-4">FINDINGS / ATTRIBUTION</th>
                      <th className="p-4">OPENED DATE</th>
                      <th className="p-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {investigations.map(inv => {
                      const hasMatch = inv.findings?.some(f => f.matchType === 'VERIFIED_MATCH');
                      const primaryFinding = inv.findings?.[0];

                      return (
                        <tr key={inv.id} className="hover:bg-cyber-surface/30">
                          <td className="p-4 font-bold text-cyber-cyan">
                            {inv.caseNumber}
                          </td>
                          <td className="p-4 font-bold text-white">
                            {inv.title}
                          </td>
                          <td className="p-4">
                            <StatusBadge status={inv.status} />
                          </td>
                          <td className="p-4">
                            {primaryFinding ? (
                              <div className="space-y-1">
                                <StatusBadge status={primaryFinding.matchType} />
                                {primaryFinding.recipient && (
                                  <div className="text-[10px] text-gray-400">
                                    Attributed: {primaryFinding.recipient.displayName}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">PENDING ANALYSIS</span>
                            )}
                          </td>
                          <td className="p-4 text-gray-400">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => handleDownloadPdf(inv.id, inv.caseNumber)}
                              disabled={downloadingId === inv.id}
                              className="px-3 py-1 rounded bg-cyber-cyan text-black font-bold hover:bg-cyber-cyan/90 transition-all text-[11px] inline-flex items-center space-x-1 disabled:opacity-50"
                            >
                              {downloadingId === inv.id ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>EXPORTING...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3 h-3" />
                                  <span>EXPORT PDF</span>
                                </>
                              )}
                            </button>
                            <Link
                              href={`/investigations/${inv.id}`}
                              className="px-2.5 py-1 rounded bg-cyber-surface border border-cyber-border hover:border-cyber-cyan text-gray-300 text-[11px] inline-flex items-center space-x-1"
                            >
                              <span>VIEW CASE</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 bg-cyber-surface/50 border border-cyber-border rounded text-xs font-mono text-cyber-muted">
            <span className="text-cyber-cyan font-bold block mb-1">OFFICIAL DEFENCE ADVISORY:</span>
            {BRAND.disclaimer}
          </div>
        </main>
      </div>
    </div>
  );
}

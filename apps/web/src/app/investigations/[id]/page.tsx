'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import {
  IInvestigation,
  InvestigationFindingMatch,
  TransformationType
} from '@netra-shakti/shared-types';
import {
  Search,
  UploadCloud,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowLeft,
  Shield,
  BrainCircuit,
  Database,
  Lock,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';

const MATCH_BADGES: Record<string, string> = {
  VERIFIED_MATCH: 'bg-cyber-green/20 text-cyber-green border-cyber-green/50',
  PARTIAL_MATCH: 'bg-cyber-gold/20 text-cyber-gold border-cyber-gold/50',
  NO_MATCH: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
  INVALID_WATERMARK: 'bg-cyber-red/20 text-cyber-red border-cyber-red/50',
  INVALID_SIGNATURE: 'bg-cyber-red/20 text-cyber-red border-cyber-red/50',
  LEDGER_MISMATCH: 'bg-cyber-red/20 text-cyber-red border-cyber-red/50',
  LOW_CONFIDENCE: 'bg-cyber-gold/20 text-cyber-gold border-cyber-gold/50',
  ANALYSIS_FAILED: 'bg-cyber-red/20 text-cyber-red border-cyber-red/50'
};

export default function InvestigationDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [investigation, setInvestigation] = useState<IInvestigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Evidence Upload State
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchInvestigation = async () => {
    try {
      setLoading(true);
      const res = await api.get<IInvestigation>(`/investigations/${id}`);
      setInvestigation(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load investigation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvestigation();
    }
  }, [id]);

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceFile) return;

    setUploadError(null);
    setUploadingEvidence(true);

    try {
      const formData = new FormData();
      formData.append('file', evidenceFile);
      await api.post(`/investigations/${id}/evidence`, formData);

      setEvidenceFile(null);
      await fetchInvestigation();
    } catch (err: any) {
      setUploadError(err.message || 'Evidence upload failed');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleRunAnalysis = async () => {
    setError(null);
    setAnalyzing(true);

    try {
      const updated = await api.post<IInvestigation>(`/investigations/${id}/analyze`, {});
      setInvestigation(updated);
    } catch (err: any) {
      setError(err.message || 'Forensic analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-12 text-center font-mono text-cyber-cyan">
            LOADING FORENSIC CASE FILE & EVIDENCE CHAIN...
          </main>
        </div>
      </div>
    );
  }

  if (error || !investigation) {
    return (
      <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-12 text-center space-y-4 font-mono">
            <div className="text-cyber-red font-bold">CASE FILE NOT ACCESSIBLE</div>
            <p className="text-xs text-gray-400">{error}</p>
            <Link href="/investigations" className="inline-block px-4 py-2 bg-cyber-surface border border-cyber-border text-xs text-cyber-cyan">
              ← RETURN TO INVESTIGATION CASES
            </Link>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center">
            <Link
              href="/investigations"
              className="text-xs font-mono text-gray-400 hover:text-cyber-cyan flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO INVESTIGATION CASES</span>
            </Link>

            <div className="flex items-center space-x-3">
              {investigation.findings && investigation.findings.length > 0 && (
                <a
                  href={`/api/v1/investigations/${investigation.id}/report/pdf`}
                  download={`NETRA_FORENSIC_REPORT_${investigation.caseNumber}.pdf`}
                  className="px-5 py-2 rounded bg-cyber-surface hover:bg-cyber-cyan hover:text-black border border-cyber-cyan text-cyber-cyan font-mono font-bold text-xs transition-colors flex items-center space-x-2 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>DOWNLOAD SEALED FORENSIC PDF REPORT</span>
                </a>
              )}
            </div>
          </div>

          {/* Case Overview Card */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-4">
            <div className="flex justify-between items-start border-b border-cyber-border pb-4">
              <div>
                <div className="text-xs font-mono font-bold text-cyber-cyan">
                  CASE NUMBER: {investigation.caseNumber}
                </div>
                <h1 className="text-2xl font-mono font-bold text-white uppercase mt-1">
                  {investigation.title}
                </h1>
                <div className="text-xs font-mono text-gray-400 mt-1">
                  Lead Investigator: {investigation.createdBy?.displayName || 'Defense Intel'} ({investigation.createdBy?.department}) • Opened {new Date(investigation.createdAt).toLocaleString()}
                </div>
              </div>

              <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/40">
                STATUS: {investigation.status}
              </span>
            </div>

            {investigation.description && (
              <div className="p-3 bg-cyber-surface/50 border border-cyber-border rounded text-xs font-mono text-gray-300">
                <span className="text-cyber-muted font-bold block mb-1">CASE SUMMARY:</span>
                {investigation.description}
              </div>
            )}
          </div>

          {/* Evidence Upload & Ingestion Section */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-4">
            <div className="flex justify-between items-center border-b border-cyber-border pb-3">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-cyber-cyan" />
                <h2 className="text-base font-mono font-bold text-white uppercase">
                  LEAKED EVIDENCE ARTIFACTS
                </h2>
              </div>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleUploadEvidence} className="p-4 bg-cyber-surface/30 border border-cyber-border rounded flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="w-full sm:flex-1">
                <input
                  type="file"
                  required
                  accept="application/pdf,image/*"
                  onChange={e => setEvidenceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs font-mono text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-cyber-cyan file:text-black cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingEvidence || !evidenceFile}
                className="px-5 py-2 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 disabled:opacity-50 flex items-center space-x-2 shrink-0"
              >
                {uploadingEvidence ? 'INGESTING EVIDENCE...' : 'UPLOAD LEAKED EVIDENCE'}
              </button>
            </form>

            {uploadError && (
              <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red">
                {uploadError}
              </div>
            )}

            {/* Evidence List */}
            {investigation.evidence && investigation.evidence.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted bg-cyber-surface/50">
                      <th className="p-3">FILENAME</th>
                      <th className="p-3">MIME TYPE</th>
                      <th className="p-3">SIZE</th>
                      <th className="p-3">EVIDENCE SHA-256 HASH</th>
                      <th className="p-3">UPLOADED AT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {investigation.evidence.map(ev => (
                      <tr key={ev.id} className="hover:bg-cyber-surface/40">
                        <td className="p-3 font-bold text-white">{ev.originalFilename}</td>
                        <td className="p-3 text-gray-300">{ev.mimeType}</td>
                        <td className="p-3 text-gray-300">{Math.round(ev.size / 1024)} KB</td>
                        <td className="p-3 text-cyber-cyan font-mono text-[11px] truncate max-w-[200px]" title={ev.contentHash}>
                          {ev.contentHash}
                        </td>
                        <td className="p-3 text-gray-400">
                          {new Date(ev.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-gray-400">
                No leaked evidence uploaded to this case yet. Upload leaked PDF or screenshot to run analysis.
              </div>
            )}

            {/* Run Analysis Trigger Button */}
            {investigation.evidence && investigation.evidence.length > 0 && (
              <div className="pt-4 border-t border-cyber-border flex justify-end">
                <button
                  onClick={handleRunAnalysis}
                  disabled={analyzing}
                  className="px-8 py-3 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 disabled:opacity-50 shadow-lg shadow-cyber-cyan/25"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>EXECUTING AI & CRYPTOGRAPHIC FORENSIC ENGINE...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-4 h-4" />
                      <span>RUN FORENSIC ATTRIBUTION ENGINE</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Forensic Findings Section */}
          {investigation.findings && investigation.findings.length > 0 && (
            <div className="p-6 bg-cyber-card border border-cyber-green/50 rounded space-y-6">
              <div className="flex items-center justify-between border-b border-cyber-border pb-4">
                <div className="flex items-center space-x-2 text-white font-mono font-bold text-base uppercase">
                  <CheckCircle2 className="w-5 h-5 text-cyber-green" />
                  <span>FORENSIC ATTRIBUTION FINDINGS ({investigation.findings.length})</span>
                </div>
              </div>

              <div className="space-y-6">
                {investigation.findings.map((finding, idx) => (
                  <div
                    key={finding.id}
                    className="p-5 bg-cyber-surface/60 border border-cyber-border rounded space-y-4"
                  >
                    {/* Finding Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded text-xs font-mono font-bold border ${MATCH_BADGES[finding.matchType] || 'text-gray-300'}`}>
                          MATCH STATUS: {finding.matchType}
                        </span>
                        <span className="text-xs font-mono text-gray-300">
                          CONFIDENCE: <strong className="text-cyber-green font-bold">{(finding.confidence * 100).toFixed(1)}%</strong>
                        </span>
                      </div>

                      <div className="text-xs font-mono text-cyber-muted">
                        TRANSFORMATION: <span className="text-cyber-cyan font-bold">{finding.transformationType || 'ORIGINAL'}</span>
                      </div>
                    </div>

                    {/* Verification Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-3 bg-cyber-surface rounded border border-cyber-border flex items-center space-x-2">
                        {finding.cryptographicWatermarkValid ? (
                          <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-cyber-red" />
                        )}
                        <div>
                          <div className="text-[10px] text-cyber-muted">WATERMARK CHECKSUM</div>
                          <div className="text-white font-bold">
                            {finding.cryptographicWatermarkValid ? 'VALID & AUTHENTICATED' : 'INVALID / UNRECOVERED'}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-cyber-surface rounded border border-cyber-border flex items-center space-x-2">
                        {finding.signatureValid ? (
                          <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-cyber-red" />
                        )}
                        <div>
                          <div className="text-[10px] text-cyber-muted">DIGITAL SIGNATURE</div>
                          <div className="text-white font-bold">
                            {finding.signatureValid ? 'Ed25519 VERIFIED' : 'FAILED'}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-cyber-surface rounded border border-cyber-border flex items-center space-x-2">
                        {finding.ledgerValid ? (
                          <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-cyber-red" />
                        )}
                        <div>
                          <div className="text-[10px] text-cyber-muted">LEDGER INTEGRITY</div>
                          <div className="text-white font-bold">
                            {finding.ledgerValid ? 'TAMPER-EVIDENT LEDGER VERIFIED' : 'FAILED'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Attributed Identity Box */}
                    {finding.recipient && (
                      <div className="p-4 bg-cyber-card border border-cyber-cyan/30 rounded grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                        <div>
                          <div className="text-[10px] text-cyber-muted">ATTRIBUTED RECIPIENT</div>
                          <div className="text-white font-bold text-sm mt-0.5">{finding.recipient.displayName}</div>
                          <div className="text-gray-400 text-[10px]">@{finding.recipient.username}</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-cyber-muted">DEPARTMENT / UNIT</div>
                          <div className="text-gray-300 font-bold mt-0.5">{finding.recipient.department}</div>
                          <div className="text-gray-400 text-[10px]">{finding.recipient.rank || 'N/A'}</div>
                        </div>

                        <div>
                          <div className="text-[10px] text-cyber-muted">DECRYPTION SESSION</div>
                          <div className="text-cyber-cyan font-bold mt-0.5">{finding.session?.sessionCode || 'N/A'}</div>
                          <div className="text-gray-400 text-[10px]">{finding.session?.startedAt ? new Date(finding.session.startedAt).toLocaleString() : ''}</div>
                        </div>
                      </div>
                    )}

                    {/* Non-Accusatory Defense Advisory Disclaimer */}
                    <div className="p-3 bg-cyber-surface/70 border border-cyber-gold/30 rounded text-[11px] font-mono text-cyber-gold leading-relaxed">
                      <strong className="block mb-0.5 uppercase">MANDATORY FORENSIC ADVISORY:</strong>
                      {finding.forensicNotes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

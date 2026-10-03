'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { PdfViewer } from '@/components/PdfViewer';
import { api } from '@/lib/api';
import {
  IDocument,
  IDecryptionSession,
  DecryptionSessionStatus
} from '@netra-shakti/shared-types';
import {
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Fingerprint,
  Database,
  Download,
  Eye,
  ArrowLeft,
  KeyRound,
  FileCheck2,
  RefreshCw
} from 'lucide-react';

const STEPS = [
  { id: 'AUTH', label: '1. Personnel Authentication & Clearance', desc: 'Verifying recipient cryptographic key and security clearance level' },
  { id: 'KEY', label: '2. AES-256 Key Recovery & Decryption', desc: 'Unwrapping envelope content key with master key vault' },
  { id: 'WATERMARK', label: '3. Forensic Watermark Embedding', desc: 'Injecting multi-layer invisible DCT steganographic fingerprint into document' },
  { id: 'PROVENANCE', label: '4. Provenance Record & Ed25519 Signing', desc: 'Computing canonical provenance payload hash and signing with private key' },
  { id: 'LEDGER', label: '5. Immutable Ledger Block Commit', desc: 'Appending tamper-evident hash-chained provenance block' },
  { id: 'READY', label: '6. Issued Document Delivery', desc: 'Finalizing decryption session and streaming secure copy' }
];

export default function SecureDecryptionWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { user } = useAuth();

  const [document, setDocument] = useState<IDocument | null>(null);
  const [session, setSession] = useState<IDecryptionSession | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [executing, setExecuting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fetchDocument = async () => {
    try {
      const doc = await api.get<IDocument>(`/documents/${id}`);
      setDocument(doc);
    } catch (err: any) {
      setError(err.message || 'Failed to access document for decryption');
    }
  };

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const handleStartDecryption = async () => {
    setError(null);
    setExecuting(true);
    setCurrentStepIndex(1);

    try {
      // Step animation progress simulation for user visual HUD while backend executes
      const stepTimer1 = setTimeout(() => setCurrentStepIndex(2), 350);
      const stepTimer2 = setTimeout(() => setCurrentStepIndex(3), 700);
      const stepTimer3 = setTimeout(() => setCurrentStepIndex(4), 1100);

      // Actual atomic backend cryptographic decryption execution
      const completedSession = await api.post<IDecryptionSession>(
        `/documents/${id}/decryption-sessions`,
        {}
      );

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      setCurrentStepIndex(5);
      setSession(completedSession);
      setCompleted(true);

      // Load stream URL
      setPdfUrl(`/api/v1/decryption-sessions/${completedSession.id}/stream`);
    } catch (err: any) {
      setError(err.message || 'Decryption workflow failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Top Back Navigation */}
          <div className="flex justify-between items-center">
            <Link
              href={`/documents/${id}`}
              className="text-xs font-mono text-gray-400 hover:text-cyber-cyan flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO DOCUMENT DETAILS</span>
            </Link>

            <div className="text-xs font-mono text-cyber-cyan">
              RECIPIENT IDENTITY: {user?.displayName} (@{user?.username})
            </div>
          </div>

          {/* Workflow HUD Header */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center text-cyber-cyan">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-mono font-bold text-white uppercase">
                  SECURE DECRYPTION WORKFLOW & FORENSIC WATERMARK ISSUANCE
                </h1>
                <p className="text-xs font-mono text-cyber-muted mt-0.5">
                  Target Document: {document?.title || 'Classified File'} [{document?.documentCode}] ({document?.classification})
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">DECRYPTION WORKFLOW REJECTED:</div>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {/* Decrypt Trigger Button (if not yet run) */}
            {!completed && (
              <div className="mt-6 pt-6 border-t border-cyber-border flex items-center justify-between">
                <div className="text-xs font-mono text-gray-300">
                  Click below to initiate the multi-phase cryptographic decryption sequence.
                </div>
                <button
                  onClick={handleStartDecryption}
                  disabled={executing}
                  className="px-8 py-3 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 disabled:opacity-50 shadow-lg shadow-cyber-cyan/25"
                >
                  {executing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>EXECUTING CRYPTOGRAPHIC PIPELINE...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>START SECURE DECRYPTION</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Multi-Step State Machine Pipeline */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-4">
            <h2 className="text-sm font-mono font-bold text-white uppercase flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyber-cyan" />
              <span>DECRYPTION STATE MACHINE PIPELINE</span>
            </h2>

            <div className="space-y-3">
              {STEPS.map((step, idx) => {
                const isPassed = completed || currentStepIndex > idx;
                const isCurrent = executing && currentStepIndex === idx;

                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded border transition-all ${
                      isPassed
                        ? 'bg-cyber-green/5 border-cyber-green/40 text-gray-200'
                        : isCurrent
                        ? 'bg-cyber-cyan/10 border-cyber-cyan radar-glow text-white'
                        : 'bg-cyber-surface/30 border-cyber-border text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center space-x-3">
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-cyber-green shrink-0" />
                        ) : isCurrent ? (
                          <RefreshCw className="w-4 h-4 text-cyber-cyan animate-spin shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[9px] shrink-0">
                            {idx + 1}
                          </span>
                        )}
                        <span className="font-bold">{step.label}</span>
                      </div>

                      <span className="text-[10px] uppercase font-bold">
                        {isPassed ? 'VERIFIED / COMMITTED' : isCurrent ? 'PROCESSING...' : 'PENDING'}
                      </span>
                    </div>
                    <div className="ml-7 text-[11px] font-mono text-cyber-muted mt-1">
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cryptographic Artifacts & Provenance Proof Box (When Completed) */}
          {completed && session && (
            <div className="p-6 bg-cyber-card border border-cyber-green/40 rounded space-y-6">
              <div className="flex items-center justify-between border-b border-cyber-border pb-4">
                <div className="flex items-center space-x-2 text-cyber-green font-mono font-bold text-base">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>DECRYPTION SESSION COMPLETED & COMMITTED TO LEDGER</span>
                </div>
                <span className="text-xs font-mono bg-cyber-green/20 text-cyber-green px-3 py-1 rounded border border-cyber-green/40 font-bold">
                  STATUS: {session.status}
                </span>
              </div>

              {/* Provenance Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                  <div className="text-cyber-muted text-[10px]">SESSION CODE</div>
                  <div className="text-cyber-cyan mt-1 font-bold">{session.sessionCode}</div>
                </div>

                <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                  <div className="text-cyber-muted text-[10px]">FORENSIC WATERMARK CODE</div>
                  <div className="text-cyber-green mt-1 font-bold">
                    {session.watermark?.watermarkCode || 'GENERATED & EMBEDDED'}
                  </div>
                </div>

                <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                  <div className="text-cyber-muted text-[10px]">LEDGER BLOCK SEQUENCE</div>
                  <div className="text-cyber-gold mt-1 font-bold">
                    BLOCK #{session.ledgerEvent?.sequenceNumber || 'COMMITTED'}
                  </div>
                </div>

                <div className="p-3 bg-cyber-surface rounded border border-cyber-border md:col-span-2 lg:col-span-3">
                  <div className="text-cyber-muted text-[10px]">ISSUED DOCUMENT SHA-256 HASH</div>
                  <div className="text-gray-200 mt-1 font-bold truncate" title={session.issuedDocumentHash || ''}>
                    {session.issuedDocumentHash}
                  </div>
                </div>
              </div>

              {/* Defense Attribution Disclaimer */}
              <div className="p-4 bg-cyber-surface/60 border border-cyber-gold/40 rounded text-xs font-mono text-cyber-gold">
                <span className="font-bold block mb-1">FORENSIC ATTRIBUTION ADVISORY:</span>
                This document copy has been invisibly watermarked with your identity ({user?.displayName}) and recorded in the immutable ledger. Any unauthorized leak or distribution will be mathematically traced to this decryption session.
              </div>

              {/* PDF Viewer / Stream Area */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-mono font-bold text-white uppercase flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-cyber-cyan" />
                    <span>ISSUED WATERMARKED DOCUMENT STREAM</span>
                  </h3>

                  {document?.policies?.allowDownload && pdfUrl && (
                    <a
                      href={pdfUrl}
                      download={`NETRA_${document.documentCode}_${session.sessionCode}.pdf`}
                      className="px-4 py-1.5 rounded bg-cyber-surface hover:bg-cyber-cyan hover:text-black border border-cyber-cyan text-cyber-cyan font-mono text-xs transition-colors flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOWNLOAD ISSUED PDF</span>
                    </a>
                  )}
                </div>

                {pdfUrl ? (
                  <PdfViewer
                    sessionId={session.id}
                    streamUrl={pdfUrl}
                    title={document?.title || `NETRA_${document?.documentCode}`}
                    classification={document?.classification}
                    allowDownload={document?.policies?.allowDownload}
                  />
                ) : (
                  <div className="p-12 text-center text-xs font-mono text-gray-400">
                    Loading secure document stream...
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

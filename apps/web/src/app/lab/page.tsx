'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import {
  Shield,
  Activity,
  Cpu,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Sliders,
  FileCheck2,
  Crosshair,
  Lock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface BenchmarkResult {
  transformation: string;
  extracted: boolean;
  watermarkCode: string | null;
  confidence: number;
  bitErrorRate: number;
  recoveryMethod: string;
  fragileIntegrity: number;
  tamperDetected: boolean;
  tamperDetails: string;
  hmacVerified: boolean;
  signatureVerified: boolean;
  latencyMs: number;
  notes: string;
}

interface ResilienceResponse {
  watermarkCode: string;
  sessionId: string;
  documentId: string;
  totalTests: number;
  successfulRecoveries: number;
  resilienceScore: number;
  benchmarks: BenchmarkResult[];
  totalExecutionTimeMs: number;
}

const AVAILABLE_TRANSFORMATIONS = [
  { id: 'ORIGINAL', label: 'Baseline Unmodified PDF', desc: 'Standard encrypted-then-watermarked baseline copy (control test)' },
  { id: 'CROP_25', label: '25% Boundary Crop Attack', desc: 'Truncates 25% outer margin to test perimeter fragile grid and quadrant anchors' },
  { id: 'CROP_50', label: '50% Severe Quadrant Crop', desc: 'Truncates 50% of document area to stress-test redundant corner anchors' },
  { id: 'SCREENSHOT', label: 'Display Screenshot (1080p)', desc: 'Simulates screen capture rasterization and display buffer noise' },
  { id: 'JPEG_COMPRESSION', label: 'Heavy JPEG Compression (Q=40)', desc: 'Lossy DCT compression artifacts and high-frequency coefficient attenuation' },
  { id: 'NOISE_INJECTION', label: 'Gaussian Noise Stream Perturbation', desc: 'Simulates analog print-scan scanner noise and bit flips' },
  { id: 'RESIZE_DOWNSCALE', label: '50% Downscale & Re-sample', desc: 'Resolution downsampling attack to test spatial steganography durability' }
];

export default function ForensicResilienceLabPage() {
  const [selectedTransforms, setSelectedTransforms] = useState<string[]>([
    'ORIGINAL',
    'CROP_25',
    'CROP_50',
    'SCREENSHOT',
    'JPEG_COMPRESSION',
    'NOISE_INJECTION',
    'RESIZE_DOWNSCALE'
  ]);
  const [targetId, setTargetId] = useState<string>('');
  const [running, setRunning] = useState<boolean>(false);
  const [results, setResults] = useState<ResilienceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleTransform = (id: string) => {
    if (selectedTransforms.includes(id)) {
      if (selectedTransforms.length > 1) {
        setSelectedTransforms(selectedTransforms.filter(t => t !== id));
      }
    } else {
      setSelectedTransforms([...selectedTransforms, id]);
    }
  };

  const selectAll = () => {
    setSelectedTransforms(AVAILABLE_TRANSFORMATIONS.map(t => t.id));
  };

  const selectPresetLeak = () => {
    setSelectedTransforms(['SCREENSHOT', 'CROP_25', 'JPEG_COMPRESSION']);
  };

  const handleRunBenchmark = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await api.post<ResilienceResponse>('/watermarks/test-resilience', {
        watermarkIdOrSessionId: targetId.trim() || undefined,
        transformations: selectedTransforms
      });
      setResults(res);
    } catch (err: any) {
      setError(err.message || 'Resilience test execution failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Top Banner */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Crosshair className="w-48 h-48 text-cyber-cyan" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-cyber-cyan mb-1">
                  <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" />
                  <span>AIR-GAPPED DEFENCE FACILITY // RESILIENCE LAB</span>
                </div>
                <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wider">
                  FORENSIC WATERMARK RESILIENCE LAB
                </h1>
                <p className="text-xs font-mono text-cyber-muted mt-1 max-w-2xl">
                  Simulate adversarial leak transformations including screenshot capture, lossy JPEG compression, boundary cropping, and noise perturbation. Verify multi-quadrant anchor recovery and fragile perimeter checksums.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={selectPresetLeak}
                  className="px-3 py-2 bg-cyber-surface border border-cyber-border hover:border-cyber-cyan text-xs font-mono rounded text-gray-300 hover:text-white transition-colors"
                >
                  PRESET: COMMON LEAK
                </button>
                <button
                  onClick={selectAll}
                  className="px-3 py-2 bg-cyber-surface border border-cyber-border hover:border-cyber-cyan text-xs font-mono rounded text-gray-300 hover:text-white transition-colors"
                >
                  SELECT ALL (7 TESTS)
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transformation Selector */}
            <div className="lg:col-span-2 p-6 bg-cyber-card border border-cyber-border rounded space-y-4">
              <div className="flex items-center justify-between border-b border-cyber-border pb-3">
                <div className="flex items-center space-x-2 text-white font-mono font-bold text-sm uppercase">
                  <Sliders className="w-4 h-4 text-cyber-cyan" />
                  <span>ADVERSARIAL ATTACK MATRIX ({selectedTransforms.length} SELECTED)</span>
                </div>
                <span className="text-[10px] font-mono text-cyber-muted uppercase">
                  MULTI-LAYER EVALUATION
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVAILABLE_TRANSFORMATIONS.map(transform => {
                  const isChecked = selectedTransforms.includes(transform.id);
                  return (
                    <div
                      key={transform.id}
                      onClick={() => toggleTransform(transform.id)}
                      className={`p-3 rounded border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-cyber-cyan/10 border-cyber-cyan text-white shadow-sm shadow-cyber-cyan/10'
                          : 'bg-cyber-surface/40 border-cyber-border text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-cyber-border text-cyber-cyan focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold">{transform.label}</span>
                      </div>
                      <p className="text-[11px] font-mono text-cyber-muted mt-1.5 pl-5">
                        {transform.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Target Override & Run Controls */}
              <div className="pt-4 border-t border-cyber-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-mono text-cyber-muted uppercase mb-1">
                    OPTIONAL WATERMARK CODE OR SESSION ID (LEAVE BLANK FOR AIR-GAPPED SAMPLE)
                  </label>
                  <input
                    type="text"
                    value={targetId}
                    onChange={e => setTargetId(e.target.value)}
                    placeholder="e.g. WM-NS-8F2B1C9D-A4 or leave empty"
                    className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan"
                  />
                </div>

                <div className="sm:self-end">
                  <button
                    onClick={handleRunBenchmark}
                    disabled={running}
                    className="w-full sm:w-auto px-8 py-2.5 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-cyber-cyan/25"
                  >
                    {running ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>EXECUTING RESILIENCE BENCHMARK...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>RUN STRESS BENCHMARK</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Platform Specifications Card */}
            <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-4">
              <div className="flex items-center space-x-2 text-white font-mono font-bold text-sm uppercase border-b border-cyber-border pb-3">
                <Cpu className="w-4 h-4 text-cyber-green" />
                <span>DEFENCE CRYPTOGRAPHIC SPECS</span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                  <div className="text-[10px] text-cyber-muted uppercase">STEGANOGRAPHIC SCHEME</div>
                  <div className="text-white font-bold mt-0.5">NETRA-DCT-STEGO-V2</div>
                  <div className="text-[10px] text-gray-400 mt-1">Multi-quadrant redundant anchors (5 strategic anchor zones)</div>
                </div>

                <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                  <div className="text-[10px] text-cyber-muted uppercase">FRAGILE WATERMARK LAYER</div>
                  <div className="text-white font-bold mt-0.5">Perimeter Checksum Grid (32-Point)</div>
                  <div className="text-[10px] text-gray-400 mt-1">HMAC-SHA256 authenticated boundary markers detect crop/tamper</div>
                </div>

                <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                  <div className="text-[10px] text-cyber-muted uppercase">DIGITAL SIGNATURE ENGINE</div>
                  <div className="text-white font-bold mt-0.5">Ed25519 (RFC 8032)</div>
                  <div className="text-[10px] text-gray-400 mt-1">Deterministic provenance payload signing with tamper-evident ledger</div>
                </div>

                <div className="p-3 bg-cyber-surface rounded border border-cyber-border">
                  <div className="text-[10px] text-cyber-muted uppercase">AIR-GAPPED COMPLIANCE</div>
                  <div className="text-cyber-green font-bold mt-0.5">100% OFFLINE CAPABLE</div>
                  <div className="text-[10px] text-gray-400 mt-1">Zero external API dependencies required for extraction or verification</div>
                </div>
              </div>
            </div>
          </div>

          {/* Benchmark Results Display */}
          {results && (
            <div className="space-y-6">
              {/* Score HUD */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
                <div className="p-5 bg-cyber-card border border-cyber-cyan/50 rounded flex flex-col justify-between">
                  <div className="text-xs text-cyber-muted uppercase">RESILIENCE SCORE</div>
                  <div className="text-3xl font-bold text-cyber-cyan my-2">
                    {results.resilienceScore}%
                  </div>
                  <div className="text-[10px] text-gray-400">DEFENCE-GRADE ATTRIBUTION</div>
                </div>

                <div className="p-5 bg-cyber-card border border-cyber-green/50 rounded flex flex-col justify-between">
                  <div className="text-xs text-cyber-muted uppercase">RECOVERIES SUCCESS</div>
                  <div className="text-3xl font-bold text-cyber-green my-2">
                    {results.successfulRecoveries} / {results.totalTests}
                  </div>
                  <div className="text-[10px] text-gray-400">ATTACK VECTORS OVERCOME</div>
                </div>

                <div className="p-5 bg-cyber-card border border-cyber-border rounded flex flex-col justify-between">
                  <div className="text-xs text-cyber-muted uppercase">TARGET WATERMARK</div>
                  <div className="text-sm font-bold text-white my-2 truncate" title={results.watermarkCode}>
                    {results.watermarkCode}
                  </div>
                  <div className="text-[10px] text-cyber-muted">SESSION: {results.sessionId}</div>
                </div>

                <div className="p-5 bg-cyber-card border border-cyber-border rounded flex flex-col justify-between">
                  <div className="text-xs text-cyber-muted uppercase">TOTAL EXECUTION TIME</div>
                  <div className="text-3xl font-bold text-cyber-gold my-2">
                    {results.totalExecutionTimeMs} ms
                  </div>
                  <div className="text-[10px] text-gray-400">REAL-TIME FORENSIC RECOVERY</div>
                </div>
              </div>

              {/* Detailed Findings Table */}
              <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-4">
                <div className="flex items-center justify-between border-b border-cyber-border pb-3">
                  <div className="flex items-center space-x-2 text-white font-mono font-bold text-sm uppercase">
                    <Activity className="w-4 h-4 text-cyber-cyan" />
                    <span>INDIVIDUAL VECTOR BENCHMARK AUDIT ({results.benchmarks.length})</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyber-green uppercase">
                    ALL RECOVERIES CRYPTOGRAPHICALLY VERIFIED
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-cyber-surface/60 text-cyber-muted border-b border-cyber-border">
                      <tr>
                        <th className="p-3">ATTACK / TRANSFORMATION</th>
                        <th className="p-3">RECOVERY STATUS</th>
                        <th className="p-3">CONFIDENCE</th>
                        <th className="p-3">BIT ERROR RATE</th>
                        <th className="p-3">FRAGILE GRID INTEGRITY</th>
                        <th className="p-3">TAMPER STATUS</th>
                        <th className="p-3">HMAC / SIGNATURE</th>
                        <th className="p-3 text-right">LATENCY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-border/40">
                      {results.benchmarks.map((b, idx) => (
                        <tr key={idx} className="hover:bg-cyber-surface/30">
                          <td className="p-3">
                            <div className="font-bold text-white">{b.transformation}</div>
                            <div className="text-[10px] text-cyber-muted mt-0.5">{b.notes}</div>
                          </td>
                          <td className="p-3">
                            {b.extracted ? (
                              <span className="px-2.5 py-1 rounded bg-cyber-green/20 text-cyber-green border border-cyber-green/40 font-bold inline-flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>RECOVERED</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded bg-cyber-red/20 text-cyber-red border border-cyber-red/40 font-bold inline-flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>FAILED</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-cyber-cyan">
                            {(b.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="p-3 text-gray-300">
                            {(b.bitErrorRate * 100).toFixed(2)}%
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-cyber-surface rounded-full h-1.5 overflow-hidden border border-cyber-border">
                                <div
                                  className={`h-full ${b.fragileIntegrity >= 90 ? 'bg-cyber-green' : b.fragileIntegrity >= 60 ? 'bg-cyber-gold' : 'bg-cyber-red'}`}
                                  style={{ width: `${b.fragileIntegrity}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-white">{b.fragileIntegrity}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {b.tamperDetected ? (
                              <span className="text-cyber-gold font-bold flex items-center space-x-1" title={b.tamperDetails}>
                                <AlertTriangle className="w-3 h-3" />
                                <span>TAMPER DETECTED</span>
                              </span>
                            ) : (
                              <span className="text-cyber-green font-bold flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>INTACT</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {b.hmacVerified && b.signatureVerified ? (
                              <span className="text-cyber-green font-bold">HMAC &amp; Ed25519 VALID</span>
                            ) : (
                              <span className="text-cyber-red font-bold">FAILED</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-300">
                            {b.latencyMs} ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mandatory Legal & Attribution Disclaimer */}
                <div className="mt-4 p-4 bg-cyber-surface/70 border border-cyber-gold/40 rounded text-xs font-mono text-cyber-gold leading-relaxed">
                  <strong className="block mb-1 uppercase tracking-wide">
                    MANDATORY FORENSIC ATTRIBUTION ADVISORY:
                  </strong>
                  The recovered forensic fingerprint is associated with the recorded decryption session assigned to this recipient. Attribution identifies the issued source copy and does not independently establish intent or responsibility for disclosure.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

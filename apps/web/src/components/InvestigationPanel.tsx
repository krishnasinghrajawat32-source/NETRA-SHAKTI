'use client';

import React, { useState } from 'react';
import { ShieldAlert, Search, UploadCloud, CheckCircle2, AlertTriangle, FileText, BrainCircuit, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api-client';
import { IInvestigation } from '@netra-shakti/shared-types';
import StatusBadge from './StatusBadge';

interface InvestigationPanelProps {
  investigation: IInvestigation;
  onUpdate: () => void;
}

export const InvestigationPanel: React.FC<InvestigationPanelProps> = ({ investigation, onUpdate }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      await api.post(`/investigations/${investigation.id}/analyze`, {});
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Forensic analysis failed to extract candidate mark.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-cyber-border pb-4">
        <div>
          <div className="text-xs font-mono text-cyber-cyan font-bold">
            CASE #{investigation.caseNumber}
          </div>
          <h2 className="text-lg font-mono font-bold text-white uppercase mt-0.5">
            {investigation.title}
          </h2>
        </div>

        <div className="flex items-center space-x-3">
          <StatusBadge status={investigation.status} />
          {investigation.status !== 'ANALYSIS_COMPLETED' && (
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing || !investigation.evidence || investigation.evidence.length === 0}
              className="px-4 py-1.5 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>ANALYZING EVIDENCE...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-3.5 h-3.5" />
                  <span>RUN ATTRIBUTION ANALYSIS</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Findings Area */}
      {investigation.findings && investigation.findings.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            FORENSIC ATTRIBUTION FINDINGS
          </h3>

          {investigation.findings.map(finding => (
            <div
              key={finding.id}
              className={`p-4 rounded border text-xs font-mono space-y-3 ${
                finding.matchType === 'VERIFIED_MATCH'
                  ? 'bg-cyber-red/10 border-cyber-red/50 text-white'
                  : 'bg-cyber-surface/50 border-cyber-border text-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-cyber-red" />
                  <span>ATTRIBUTION RESULT: {finding.matchType}</span>
                </span>
                <span className="text-cyber-cyan">
                  CONFIDENCE: {Math.round(finding.confidence * 100)}%
                </span>
              </div>

              {finding.recipient && (
                <div className="p-3 bg-cyber-black/60 rounded border border-cyber-border space-y-1">
                  <div className="text-cyber-muted text-[10px]">ATTRIBUTED SOURCE RECIPIENT:</div>
                  <div className="text-white font-bold">
                    {finding.recipient.displayName} (@{finding.recipient.username})
                  </div>
                  <div className="text-gray-400 text-[10px]">
                    Department: {finding.recipient.department} • Clearance: {finding.recipient.clearanceLevel}
                  </div>
                </div>
              )}

              {finding.forensicNotes && (
                <div className="text-[11px] text-gray-300">
                  <span className="text-cyber-muted font-bold">ANALYST NOTES: </span>
                  {finding.forensicNotes}
                </div>
              )}

              <div className="text-[10px] text-cyber-muted pt-2 border-t border-cyber-border">
                Attribution identifies the issued source copy and does not independently establish intent or responsibility for disclosure.
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs font-mono text-gray-500">
          No forensic findings generated yet. Ingest leak evidence and execute forensic recovery.
        </div>
      )}
    </div>
  );
};

export default InvestigationPanel;

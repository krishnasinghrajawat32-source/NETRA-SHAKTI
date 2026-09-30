'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { IInvestigation, InvestigationStatus } from '@netra-shakti/shared-types';
import {
  Search,
  Plus,
  Shield,
  FileSearch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  X
} from 'lucide-react';

const STATUS_BADGES: Record<string, string> = {
  OPEN: 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/40',
  PROCESSING: 'bg-cyber-gold/15 text-cyber-gold border-cyber-gold/40 animate-pulse',
  ANALYSIS_COMPLETED: 'bg-cyber-green/15 text-cyber-green border-cyber-green/40',
  CLOSED: 'bg-gray-500/15 text-gray-400 border-gray-500/40'
};

export default function InvestigationsPage() {
  const [investigations, setInvestigations] = useState<IInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ investigations: IInvestigation[]; total: number }>(
        '/investigations?limit=50'
      );
      setInvestigations(res.investigations || []);
    } catch (err) {
      console.error('Failed to load investigation cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const newCase = await api.post<IInvestigation>('/investigations', {
        title,
        description
      });
      setIsCreateModalOpen(false);
      setTitle('');
      setDescription('');
      await fetchInvestigations();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize investigation case');
    } finally {
      setCreating(false);
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
                <Search className="w-6 h-6 text-cyber-cyan" />
                <span>DIGITAL FORENSICS & LEAK INVESTIGATION SUITE</span>
              </h1>
              <p className="text-xs font-mono text-cyber-muted mt-1">
                AI & Cryptographic Attribution Engine for Recovering Watermarks from Leaked Documents.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 shadow-md shadow-cyber-cyan/20"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE INVESTIGATION CASE</span>
            </button>
          </div>

          {/* Investigations Cases Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-cyber-cyan">
              LOADING FORENSIC INVESTIGATION REGISTRY...
            </div>
          ) : investigations.length === 0 ? (
            <div className="p-16 text-center space-y-3 bg-cyber-card border border-cyber-border rounded">
              <FileSearch className="w-10 h-10 text-cyber-muted mx-auto" />
              <div className="text-sm font-mono font-bold text-white uppercase">
                NO INVESTIGATION CASES ACTIVE
              </div>
              <p className="text-xs font-mono text-cyber-muted max-w-sm mx-auto">
                Create an investigation case and upload leaked documents or screenshots to run ML watermark detection and cryptographic attribution.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 px-4 py-2 bg-cyber-cyan text-black font-mono font-bold text-xs"
              >
                START NEW INVESTIGATION
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investigations.map(inv => (
                <div
                  key={inv.id}
                  className="p-6 bg-cyber-card border border-cyber-border rounded hover:border-cyber-cyan/50 transition-colors flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold text-cyber-cyan">
                        {inv.caseNumber}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${STATUS_BADGES[inv.status] || 'text-gray-300'}`}>
                        {inv.status}
                      </span>
                    </div>

                    <h3 className="font-mono font-bold text-white text-base">
                      {inv.title}
                    </h3>

                    {inv.description && (
                      <p className="text-xs text-gray-400 font-mono line-clamp-2">
                        {inv.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-cyber-border/60 text-xs font-mono flex items-center justify-between text-cyber-muted">
                    <div>
                      <span>Created by {inv.createdBy?.displayName || 'Investigator'}</span>
                      <div className="text-[10px]">{new Date(inv.createdAt).toLocaleDateString()}</div>
                    </div>

                    <Link
                      href={`/investigations/${inv.id}`}
                      className="px-3 py-1.5 rounded bg-cyber-surface hover:bg-cyber-cyan hover:text-black border border-cyber-border text-cyber-cyan transition-colors flex items-center space-x-1"
                    >
                      <span>INSPECT CASE</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Case Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-lg shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-cyber-border bg-cyber-surface/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-cyber-cyan" />
                    <span className="font-mono font-bold text-sm text-white uppercase">
                      NEW FORENSIC INVESTIGATION CASE
                    </span>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateCase} className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      CASE TITLE *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Unauthorized Leak of Air Defense Directive"
                      className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      CASE DESCRIPTION & CONTEXT
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Source of leak (e.g. social media, forum, external press screenshot)..."
                      className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                    />
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded bg-cyber-surface text-gray-300 font-mono text-xs hover:bg-cyber-border"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2 rounded bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 disabled:opacity-50"
                    >
                      {creating ? 'INITIALIZING...' : 'CREATE CASE FILE'}
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

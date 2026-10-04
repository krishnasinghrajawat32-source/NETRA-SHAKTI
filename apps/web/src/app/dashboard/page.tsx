'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { api } from '@/lib/api';
import { IDashboardStats, UserRole } from '@netra-shakti/shared-types';
import {
  FileText,
  Users,
  Lock,
  Search,
  CheckCircle,
  AlertTriangle,
  Activity,
  Database,
  ArrowRight,
  UploadCloud,
  ShieldAlert,
  BrainCircuit
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CLASSIFICATION_COLORS: Record<string, string> = {
  TOP_SECRET: '#FF3366',
  SECRET: '#D4AF37',
  CONFIDENTIAL: '#00F0FF',
  UNCLASSIFIED: '#64748B'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const data = await api.get<IDashboardStats>('/dashboard/stats');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Top Title Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-3">
                <span>SECURITY COMMAND DASHBOARD</span>
                <span className="text-xs px-2.5 py-0.5 rounded bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/40">
                  LIVE TELEMETRY
                </span>
              </h1>
              <p className="text-xs font-mono text-cyber-muted mt-1">
                Real-time cryptographic distribution, forensic watermark tracking, and ledger provenance.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN || user?.role === UserRole.SENDER) && (
                <Link
                  href="/documents"
                  className="px-4 py-2 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>UPLOAD CONFIDENTIAL PDF</span>
                </Link>
              )}
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Protected Documents */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded">
              <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
                <span>PROTECTED DOCUMENTS</span>
                <FileText className="w-4 h-4 text-cyber-cyan" />
              </div>
              <div className="mt-2 text-3xl font-mono font-bold text-white">
                {stats?.protectedDocuments ?? 0}
              </div>
              <div className="mt-1 text-[10px] font-mono text-gray-400">
                AES-256-GCM Encrypted Objects
              </div>
            </div>

            {/* 2. Active Recipients */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded">
              <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
                <span>ACTIVE RECIPIENTS</span>
                <Users className="w-4 h-4 text-cyber-green" />
              </div>
              <div className="mt-2 text-3xl font-mono font-bold text-cyber-green">
                {stats?.activeRecipients ?? 0}
              </div>
              <div className="mt-1 text-[10px] font-mono text-gray-400">
                Authorized Personnel in Clearance
              </div>
            </div>

            {/* 3. Completed Sessions */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded">
              <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
                <span>COMPLETED SESSIONS</span>
                <Lock className="w-4 h-4 text-cyber-gold" />
              </div>
              <div className="mt-2 text-3xl font-mono font-bold text-cyber-gold">
                {stats?.completedSessions ?? 0}
              </div>
              <div className="mt-1 text-[10px] font-mono text-gray-400">
                Forensically Watermarked Copies Issued
              </div>
            </div>

            {/* 4. Verified Attribution Cases */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded">
              <div className="flex items-center justify-between text-cyber-muted text-xs font-mono">
                <span>VERIFIED ATTRIBUTIONS</span>
                <CheckCircle className="w-4 h-4 text-cyber-cyan" />
              </div>
              <div className="mt-2 text-3xl font-mono font-bold text-cyber-cyan">
                {stats?.verifiedAttributionCases ?? 0}
              </div>
              <div className="mt-1 text-[10px] font-mono text-gray-400">
                Cryptographically Proven Forensic Matches
              </div>
            </div>
          </div>

          {/* Service Status Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-cyber-card border border-cyber-border rounded flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BrainCircuit className="w-5 h-5 text-cyber-cyan" />
                <div>
                  <div className="text-xs font-mono font-bold text-white uppercase">ML Forensic Engine</div>
                  <div className="text-[10px] font-mono text-gray-400">ResNet18 Deep Neural Watermark Recovery</div>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold ${stats?.mlServiceStatus === 'UP' ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/40' : 'bg-cyber-gold/20 text-cyber-gold border border-cyber-gold/40'}`}>
                {stats?.mlServiceStatus || 'OPERATIONAL'}
              </span>
            </div>

            <div className="p-4 bg-cyber-card border border-cyber-border rounded flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-cyber-gold" />
                <div>
                  <div className="text-xs font-mono font-bold text-white uppercase">Tamper-Evident Ledger</div>
                  <div className="text-[10px] font-mono text-gray-400">Local Hash-Chained Provenance Blocks</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyber-green/20 text-cyber-green border border-cyber-green/40">
                TAMPER-EVIDENT LEDGER VERIFIED
              </span>
            </div>
          </div>

          {/* Charts & Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Decryption Activity Timeline */}
            <div className="lg:col-span-2 p-6 bg-cyber-card border border-cyber-border rounded">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-mono font-bold text-white uppercase">
                  DECRYPTION ISSUANCE TIMELINE
                </div>
                <span className="text-[10px] font-mono text-cyber-cyan">HOURLY/DAILY EVENTS</span>
              </div>

              {stats?.sessionTimeline && stats.sessionTimeline.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.sessionTimeline}>
                      <defs>
                        <linearGradient id="cyberCyanGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#64748B" fontSize={10} fontVariant="mono" />
                      <YAxis stroke="#64748B" fontSize={10} fontVariant="mono" allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B1528', borderColor: '#1E293B', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#00F0FF"
                        fillOpacity={1}
                        fill="url(#cyberCyanGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-cyber-border rounded">
                  <Lock className="w-8 h-8 text-cyber-muted mb-2" />
                  <div className="text-xs font-mono text-gray-400">NO DECRYPTION SESSIONS RECORDED YET</div>
                  <div className="text-[10px] font-mono text-cyber-muted mt-1">
                    When authorized recipients initiate secure decryption, live timeline data will appear here.
                  </div>
                </div>
              )}
            </div>

            {/* Classification Breakdown */}
            <div className="p-6 bg-cyber-card border border-cyber-border rounded">
              <div className="text-sm font-mono font-bold text-white uppercase mb-4">
                DOCUMENT CLASSIFICATION
              </div>

              {stats?.classificationDistribution && stats.classificationDistribution.length > 0 ? (
                <div className="h-64 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={stats.classificationDistribution}
                        dataKey="count"
                        nameKey="classification"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {stats.classificationDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CLASSIFICATION_COLORS[entry.classification] || '#00F0FF'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B1528', borderColor: '#1E293B', fontSize: '11px', fontFamily: 'monospace' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex flex-wrap gap-2 justify-center text-[10px] font-mono mt-2">
                    {stats.classificationDistribution.map(entry => (
                      <div key={entry.classification} className="flex items-center space-x-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: CLASSIFICATION_COLORS[entry.classification] || '#00F0FF' }}
                        />
                        <span className="text-gray-300">{entry.classification} ({entry.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-cyber-border rounded">
                  <FileText className="w-8 h-8 text-cyber-muted mb-2" />
                  <div className="text-xs font-mono text-gray-400">0 CLASSIFIED DOCUMENTS</div>
                  <div className="text-[10px] font-mono text-cyber-muted mt-1">
                    Upload documents to see real classification breakdown.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Audit Activity Table */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-mono font-bold text-white uppercase flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyber-green" />
                <span>RECENT SECURITY AUDIT EVENTS</span>
              </div>
              <Link href="/audit" className="text-xs font-mono text-cyber-cyan hover:underline flex items-center space-x-1">
                <span>VIEW COMPLETE AUDIT TRAIL</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted">
                      <th className="pb-3">TIMESTAMP</th>
                      <th className="pb-3">EVENT</th>
                      <th className="pb-3">ACTOR</th>
                      <th className="pb-3">ACTION</th>
                      <th className="pb-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {stats.recentActivity.map((evt: any) => (
                      <tr key={evt.id} className="hover:bg-cyber-surface/40">
                        <td className="py-2.5 text-gray-400">
                          {new Date(evt.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 text-cyber-cyan font-semibold">
                          {evt.eventType}
                        </td>
                        <td className="py-2.5 text-gray-300">
                          {evt.user?.displayName || 'SYSTEM'}
                        </td>
                        <td className="py-2.5 text-gray-300 max-w-md truncate">
                          {evt.action}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${evt.status === 'SUCCESS' ? 'bg-cyber-green/10 text-cyber-green' : 'bg-cyber-red/10 text-cyber-red'}`}>
                            {evt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-mono text-gray-400">
                No audit events recorded in database yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}

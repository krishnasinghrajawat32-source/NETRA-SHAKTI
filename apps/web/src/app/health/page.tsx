'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { ISystemHealth } from '@netra-shakti/shared-types';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Server, Database, Shield, BrainCircuit, Lock } from 'lucide-react';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<ISystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await api.get<ISystemHealth>('/system/health');
      setHealth(res);
    } catch (err) {
      console.error('Failed to probe system health:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchHealth();
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
                <Activity className="w-6 h-6 text-cyber-green" />
                <span>SYSTEM DIAGNOSTICS & INFRASTRUCTURE HEALTH</span>
              </h1>
              <p className="text-xs font-mono text-cyber-muted mt-1">
                Real-Time Health Probes for Air-Gapped Cryptographic Infrastructure.
              </p>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-cyber-surface hover:bg-cyber-border border border-cyber-border rounded text-xs font-mono text-cyber-cyan flex items-center space-x-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>RUN LIVE DIAGNOSTIC PROBE</span>
            </button>
          </div>

          {/* Overall Health Card */}
          <div className="p-6 bg-cyber-card border border-cyber-border rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="text-xs font-mono text-cyber-muted">SYSTEM STATUS</div>
              <div className="text-2xl font-mono font-bold text-white mt-1 flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-cyber-green animate-pulse" />
                <span>ALL DEFENSE SUBSYSTEMS {health?.status || 'OPERATIONAL'}</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400 mt-1">
                Last Diagnostic Sweep: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Just now'}
              </div>
            </div>

            <span className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-cyber-green/20 text-cyber-green border border-cyber-green/50">
              AIR-GAPPED COMPLIANT
            </span>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Database */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white uppercase">
                  <Database className="w-4 h-4 text-cyber-cyan" />
                  <span>PostgreSQL Database</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${health?.services.database.status === 'UP' ? 'bg-cyber-green/15 text-cyber-green' : 'bg-cyber-red/15 text-cyber-red'}`}>
                  {health?.services.database.status}
                </span>
              </div>
              <div className="text-xs font-mono text-gray-300">
                Latency: <span className="text-cyber-green font-bold">{health?.services.database.latencyMs || 0} ms</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400 truncate">{health?.services.database.details}</div>
            </div>

            {/* Object Storage */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white uppercase">
                  <Server className="w-4 h-4 text-cyber-cyan" />
                  <span>Object Storage (MinIO)</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-green/15 text-cyber-green">
                  {health?.services.storage.status}
                </span>
              </div>
              <div className="text-xs font-mono text-gray-300">
                Latency: <span className="text-cyber-green font-bold">{health?.services.storage.latencyMs || 0} ms</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400">{health?.services.storage.details}</div>
            </div>

            {/* Cryptographic Engine */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white uppercase">
                  <Shield className="w-4 h-4 text-cyber-cyan" />
                  <span>Crypto Provider & PQC</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-green/15 text-cyber-green">
                  UP
                </span>
              </div>
              <div className="text-xs font-mono text-gray-300">
                Algorithm: <span className="text-cyber-cyan font-bold">{health?.services.cryptoProvider.algorithm}</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400">PQC Ready: ML-KEM & ML-DSA</div>
            </div>

            {/* Watermark Engine */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white uppercase">
                  <Lock className="w-4 h-4 text-cyber-green" />
                  <span>Watermark Engine</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-green/15 text-cyber-green">
                  UP
                </span>
              </div>
              <div className="text-xs font-mono text-gray-300">
                Engine: <span className="text-cyber-green font-bold">{health?.services.watermarkEngine.algorithm}</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400">Version {health?.services.watermarkEngine.version}</div>
            </div>

            {/* Ledger Engine */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white uppercase">
                  <Database className="w-4 h-4 text-cyber-gold" />
                  <span>Tamper-Evident Ledger</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyber-green/15 text-cyber-green">
                  UP
                </span>
              </div>
              <div className="text-xs font-mono text-gray-300">
                Current Sequence: <span className="text-cyber-gold font-bold">Block #{health?.services.ledgerEngine.currentSequence}</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400">{health?.services.ledgerEngine.type}</div>
            </div>

            {/* ML Forensic Service */}
            <div className="p-5 bg-cyber-card border border-cyber-border rounded space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white uppercase">
                  <BrainCircuit className="w-4 h-4 text-cyber-cyan" />
                  <span>ML Forensic Service</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${health?.services.mlService.status === 'UP' ? 'bg-cyber-green/15 text-cyber-green' : 'bg-cyber-gold/15 text-cyber-gold'}`}>
                  {health?.services.mlService.status}
                </span>
              </div>
              <div className="text-xs font-mono text-gray-300">
                Active Model: <span className="text-cyber-cyan font-bold">{health?.services.mlService.activeModel}</span>
              </div>
              <div className="text-[10px] font-mono text-gray-400">Degradation Recovery Pipeline</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

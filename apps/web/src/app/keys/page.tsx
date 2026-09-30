'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { Key, Shield, CheckCircle2, Lock, Cpu, Sparkles } from 'lucide-react';

export default function KeyManagementPage() {
  const [identities, setIdentities] = useState<any[]>([]);
  const [pqcStatus, setPqcStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchKeyData = async () => {
    try {
      setLoading(true);
      const [idRes, pqcRes] = await Promise.all([
        api.get<any[]>('/crypto/identities'),
        api.get<any>('/crypto/pqc-status')
      ]);
      setIdentities(idRes || []);
      setPqcStatus(pqcRes);
    } catch (err) {
      console.error('Failed to load cryptographic identities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeyData();
  }, []);

  return (
    <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-3">
              <Key className="w-6 h-6 text-cyber-cyan" />
              <span>KEY MANAGEMENT & POST-QUANTUM CRYPTOGRAPHY</span>
            </h1>
            <p className="text-xs font-mono text-cyber-muted mt-1">
              Public Key Infrastructure, Quantum-Resistant Key Encapsulation (ML-KEM) & Digital Signatures (ML-DSA / Ed25519).
            </p>
          </div>

          {/* PQC Readiness Card */}
          <div className="p-6 bg-cyber-card border border-cyber-cyan/40 rounded space-y-4">
            <div className="flex justify-between items-center border-b border-cyber-border pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-cyber-cyan" />
                <h2 className="text-sm font-mono font-bold text-white uppercase">
                  POST-QUANTUM CRYPTOGRAPHY ENGINE STATUS
                </h2>
              </div>
              <span className="px-3 py-1 rounded bg-cyber-green/15 text-cyber-green border border-cyber-green/40 font-mono font-bold text-xs">
                PQC READY // ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 bg-cyber-surface rounded border border-cyber-border">
                <div className="text-cyber-muted text-[10px]">KEY ENCAPSULATION MECHANISM</div>
                <div className="text-cyber-cyan font-bold text-sm mt-1">ML-KEM-768 (CRYSTALS-Kyber)</div>
                <div className="text-[10px] text-gray-400 mt-1">NIST FIPS 203 Defense Standard</div>
              </div>

              <div className="p-4 bg-cyber-surface rounded border border-cyber-border">
                <div className="text-cyber-muted text-[10px]">DIGITAL SIGNATURE ALGORITHM</div>
                <div className="text-cyber-green font-bold text-sm mt-1">ML-DSA-65 (CRYSTALS-Dilithium)</div>
                <div className="text-[10px] text-gray-400 mt-1">NIST FIPS 204 Defense Standard</div>
              </div>

              <div className="p-4 bg-cyber-surface rounded border border-cyber-border">
                <div className="text-cyber-muted text-[10px]">STATELESS HASH SIGNATURE</div>
                <div className="text-cyber-gold font-bold text-sm mt-1">SLH-DSA-SHAKE-128f (SPHINCS+)</div>
                <div className="text-[10px] text-gray-400 mt-1">NIST FIPS 205 Defense Standard</div>
              </div>
            </div>
          </div>

          {/* Registered Identities Table */}
          <div className="bg-cyber-card border border-cyber-border rounded overflow-hidden">
            <div className="p-4 border-b border-cyber-border font-mono font-bold text-sm text-white uppercase flex items-center space-x-2">
              <Lock className="w-4 h-4 text-cyber-cyan" />
              <span>REGISTERED ASYMMETRIC USER IDENTITIES</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-cyber-cyan">
                QUERYING CRYPTOGRAPHIC REGISTRY...
              </div>
            ) : identities.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-gray-400">
                No cryptographic identities registered yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted bg-cyber-surface/50">
                      <th className="p-4">PERSONNEL IDENTITY</th>
                      <th className="p-4">DEPARTMENT</th>
                      <th className="p-4">SIGNING PUBLIC KEY (Ed25519)</th>
                      <th className="p-4">ENCRYPTION KEY (RSA-4096)</th>
                      <th className="p-4">VERSION</th>
                      <th className="p-4 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {identities.map(id => (
                      <tr key={id.id} className="hover:bg-cyber-surface/40">
                        <td className="p-4 font-bold text-white">
                          {id.user?.displayName}
                          <div className="text-[10px] text-gray-400 font-normal">@{id.user?.username} ({id.user?.role})</div>
                        </td>
                        <td className="p-4 text-gray-300">{id.user?.department}</td>
                        <td className="p-4 text-cyber-green font-mono text-[10px] max-w-[150px] truncate" title={id.signingPublicKey}>
                          {id.signingPublicKey.substring(0, 30)}...
                        </td>
                        <td className="p-4 text-cyber-cyan font-mono text-[10px] max-w-[150px] truncate" title={id.encryptionPublicKey}>
                          {id.encryptionPublicKey.substring(0, 30)}...
                        </td>
                        <td className="p-4 text-cyber-gold font-bold">v{id.keyVersion}</td>
                        <td className="p-4 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-green/15 text-cyber-green border border-cyber-green/30">
                            {id.status}
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

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { Shield, Key, Lock, User, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { BRAND } from '@netra-shakti/shared-types';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword.length < 8) {
      setError('New cryptographic password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      setMessage('Cryptographic credentials updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Failed to update credentials. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-3">
                <User className="w-6 h-6 text-cyber-cyan" />
                <span>PERSONNEL CRYPTOGRAPHIC PROFILE</span>
              </h1>
              <p className="text-xs font-mono text-cyber-muted mt-1">
                Zero-Trust clearance identity, cryptographic credentials, and active defense attributes.
              </p>
            </div>
            <div className="text-xs font-mono text-cyber-cyan border border-cyber-cyan/40 px-3 py-1 rounded bg-cyber-cyan/10">
              STATUS: {user?.status || 'ACTIVE'}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Identity Card */}
            <div className="lg:col-span-2 p-6 bg-cyber-card border border-cyber-border rounded space-y-6">
              <div className="flex items-center space-x-4 border-b border-cyber-border pb-4">
                <div className="w-14 h-14 rounded bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center text-cyber-cyan">
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-lg font-mono font-bold text-white">
                    {user?.displayName || 'Authorized Personnel'}
                  </h2>
                  <div className="text-xs font-mono text-cyber-cyan">
                    @{user?.username} • {user?.email}
                  </div>
                  <div className="text-[11px] font-mono text-gray-400 mt-1">
                    {user?.rank ? `${user.rank}, ` : ''}{user?.department || 'DEFENCE_CYBER_COMMAND'}
                    {user?.unit ? ` (${user.unit})` : ''}
                  </div>
                </div>
              </div>

              {/* Clearance & Roles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 bg-cyber-surface rounded border border-cyber-border">
                  <div className="text-cyber-muted text-[10px] uppercase">SECURITY CLEARANCE LEVEL</div>
                  <div className="text-cyber-cyan font-bold text-sm mt-1">
                    {user?.clearanceLevel || 'CONFIDENTIAL'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Enforces cryptographic document access boundaries
                  </div>
                </div>

                <div className="p-4 bg-cyber-surface rounded border border-cyber-border">
                  <div className="text-cyber-muted text-[10px] uppercase">OPERATIONAL ROLE</div>
                  <div className="text-cyber-gold font-bold text-sm mt-1">
                    {user?.role || 'USER'}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Role-based operational authorization privileges
                  </div>
                </div>

                <div className="p-4 bg-cyber-surface rounded border border-cyber-border sm:col-span-2">
                  <div className="text-cyber-muted text-[10px] uppercase">CRYPTOGRAPHIC IDENTITY ARCHITECTURE</div>
                  <div className="text-gray-300 mt-1 space-y-1">
                    <div>• Digital Signature Algorithm: <span className="text-cyber-green font-bold">Ed25519 (RFC 8032)</span></div>
                    <div>• Envelope Encryption Key: <span className="text-cyber-green font-bold">AES-256-GCM / RSA-4096-OAEP</span></div>
                    <div>• Post-Quantum Key Encapsulation: <span className="text-cyber-cyan font-bold">ML-KEM / ML-DSA Ready</span></div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-cyber-surface/60 border border-cyber-cyan/30 rounded text-xs font-mono text-cyber-muted">
                <div className="text-cyber-cyan font-bold mb-1">DEFENCE ATTRIBUTION POLICY:</div>
                {BRAND.disclaimer}
              </div>
            </div>

            {/* Change Password Form */}
            <div className="p-6 bg-cyber-card border border-cyber-border rounded space-y-4">
              <div className="flex items-center space-x-2 border-b border-cyber-border pb-3">
                <Lock className="w-5 h-5 text-cyber-gold" />
                <h2 className="text-sm font-mono font-bold text-white uppercase">
                  ROTATE PASSWORDS
                </h2>
              </div>

              {message && (
                <div className="p-3 bg-cyber-green/10 border border-cyber-green/40 rounded text-xs font-mono text-cyber-green flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-gray-300 mb-1">CURRENT PASSWORD *</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">NEW PASSWORD (MIN 8 CHARS) *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1">CONFIRM NEW PASSWORD *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-4 shadow-md shadow-cyber-cyan/20"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>UPDATING ARGON2ID HASH...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>UPDATE CREDENTIALS</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

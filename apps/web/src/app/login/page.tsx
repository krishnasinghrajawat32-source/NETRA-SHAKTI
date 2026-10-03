'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, User, Key, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify DEFENCE credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black cyber-grid p-6">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Header */}
        <div className="p-6 border-b border-cyber-border bg-cyber-surface/50 text-center">
          <div className="w-12 h-12 rounded bg-cyber-cyan/10 border border-cyber-cyan mx-auto flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-cyber-cyan" />
          </div>
          <h1 className="text-xl font-mono font-bold text-white uppercase tracking-wider">
            NETRA SHAKTI
          </h1>
          <p className="text-xs font-mono text-cyber-muted mt-1">
            SECURE DEFENCE AUTHENTICATION GATEWAY
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">
              OPERATIONAL USERNAME / EMAIL
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. netra.admin or username"
                className="w-full bg-cyber-surface border border-cyber-border rounded pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-cyan font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">
              CRYPTOGRAPHIC PASSWORD
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-cyber-surface border border-cyber-border rounded pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyber-cyan font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-6 shadow-md shadow-cyber-cyan/20"
          >
            {loading ? (
              <span>VERIFYING CRYPTOGRAPHIC CREDENTIALS...</span>
            ) : (
              <>
                <span>AUTHENTICATE & ENTER SYSTEM</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          
          <div className="pt-3 text-center flex flex-col space-y-2">
            <Link
              href="/signup"
              className="text-xs font-mono text-cyber-cyan hover:text-white transition-colors"
            >
              NEW PERSONNEL? CREATE DEFENCE ACCOUNT →
            </Link>
            <p className="text-[11px] font-mono text-cyber-muted">
              OFFICIAL ACCESS GATEWAY // AUTHORIZED MILITARY &amp; INTELLIGENCE PERSONNEL ONLY
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-cyber-border text-center bg-cyber-surface/50">
          <Link href="/" className="text-xs font-mono text-gray-400 hover:text-cyber-cyan transition-colors">
            ← BACK TO PLATFORM OVERVIEW
          </Link>
        </div>
      </div>
    </div>
  );
}

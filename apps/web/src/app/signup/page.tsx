'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Shield, Lock, User, Key, Mail, Building, Award, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { BRAND } from '@netra-shakti/shared-types';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('DEFENCE_CYBER_COMMAND');
  const [rank, setRank] = useState('');
  const [unit, setUnit] = useState('');
  const [clearanceLevel, setClearanceLevel] = useState('CONFIDENTIAL');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError('Cryptographic password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        username: username.trim(),
        email: email.trim(),
        displayName: displayName.trim(),
        password,
        department,
        rank: rank.trim() || undefined,
        unit: unit.trim() || undefined,
        clearanceLevel
      });

      setSuccess('DEFENCE Identity registered successfully. Redirecting to access gateway...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify submitted credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black cyber-grid p-6">
      <div className="w-full max-w-lg bg-cyber-card border border-cyber-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Header */}
        <div className="p-6 border-b border-cyber-border bg-cyber-surface/50 text-center">
          <div className="w-12 h-12 rounded bg-cyber-cyan/10 border border-cyber-cyan mx-auto flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-cyber-cyan" />
          </div>
          <h1 className="text-xl font-mono font-bold text-white uppercase tracking-wider">
            {BRAND.name}
          </h1>
          <p className="text-xs font-mono text-cyber-cyan mt-0.5">
            {BRAND.tagline}
          </p>
          <p className="text-[11px] font-mono text-cyber-muted mt-1 uppercase">
            DEFENCE PERSONNEL REGISTRATION PORTAL
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

          {success && (
            <div className="p-3 bg-cyber-green/10 border border-cyber-green/40 rounded text-xs font-mono text-cyber-green flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                OPERATIONAL USERNAME *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. officer.kumar"
                  className="w-full bg-cyber-surface border border-cyber-border rounded pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                OFFICIAL EMAIL *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="officer@defence.netrashakti.gov"
                  className="w-full bg-cyber-surface border border-cyber-border rounded pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                PERSONNEL FULL NAME / DESIGNATION *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. Maj. Rajesh Kumar"
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                CRYPTOGRAPHIC PASSWORD (MIN 8 CHARS) *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-cyber-surface border border-cyber-border rounded pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                DEPARTMENT / BRANCH
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
              >
                <option value="DEFENCE_CYBER_COMMAND">DEFENCE CYBER COMMAND</option>
                <option value="DEFENCE_INTELLIGENCE_AGENCY">DEFENCE INTELLIGENCE AGENCY</option>
                <option value="STRATEGIC_FORCES_COMMAND">STRATEGIC FORCES COMMAND</option>
                <option value="AIR_DEFENCE_INTELLIGENCE">AIR DEFENCE INTELLIGENCE</option>
                <option value="NAVAL_INTELLIGENCE_DIRECTORATE">NAVAL INTELLIGENCE DIRECTORATE</option>
                <option value="ARMY_SIGNALS_CORPS">ARMY SIGNALS CORPS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                SECURITY CLEARANCE LEVEL
              </label>
              <select
                value={clearanceLevel}
                onChange={e => setClearanceLevel(e.target.value)}
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
              >
                <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                <option value="RESTRICTED">RESTRICTED</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="SECRET">SECRET</option>
                <option value="TOP_SECRET">TOP SECRET</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                MILITARY RANK (OPTIONAL)
              </label>
              <input
                type="text"
                value={rank}
                onChange={e => setRank(e.target.value)}
                placeholder="e.g. Major / Specialist"
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                OPERATIONAL UNIT (OPTIONAL)
              </label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="e.g. 501st Cyber Task Wing"
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-6 shadow-md shadow-cyber-cyan/20"
          >
            {loading ? (
              <span>GENERATING CRYPTOGRAPHIC IDENTITY...</span>
            ) : (
              <>
                <span>REGISTER DEFENCE ACCOUNT</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center flex flex-col space-y-2">
            <Link
              href="/login"
              className="text-xs font-mono text-cyber-cyan hover:text-white transition-colors"
            >
              ALREADY REGISTERED? PROCEED TO AUTHENTICATION →
            </Link>
            <p className="text-[11px] font-mono text-cyber-muted">
              ALL REGISTRATIONS ARE CRYPTOGRAPHICALLY RECORDED IN THE DEFENCE AUDIT LEDGER
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

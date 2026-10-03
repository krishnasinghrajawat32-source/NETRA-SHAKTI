'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, User, Key, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
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
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify DEFENCE credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
      {error && (
        <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-cyber-red flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-gray-300 mb-1">
          OPERATIONAL USERNAME / OFFICIAL EMAIL
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
        <label className="block text-gray-300 mb-1">
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
            <span>AUTHENTICATE &amp; ENTER SYSTEM</span>
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
          OFFICIAL ACCESS GATEWAY // AUTHORIZED PERSONNEL ONLY
        </p>
      </div>
    </form>
  );
};

export default LoginForm;

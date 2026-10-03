'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { User, Key, Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('DEFENCE_CYBER_COMMAND');
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
        clearanceLevel
      });

      setSuccess('Account registered successfully. Redirecting to access gateway...');
      if (onSuccess) onSuccess();
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
    <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
      {error && (
        <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-cyber-red flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-cyber-green/10 border border-cyber-green/40 rounded text-cyber-green flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 mb-1">OPERATIONAL USERNAME *</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. officer.kumar"
              className="w-full bg-cyber-surface border border-cyber-border rounded pl-10 pr-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-1">OFFICIAL EMAIL *</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="officer@defence.netrashakti.gov"
              className="w-full bg-cyber-surface border border-cyber-border rounded pl-10 pr-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 mb-1">FULL NAME &amp; DESIGNATION *</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="e.g. Maj. Rajesh Kumar"
            className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-1">CRYPTOGRAPHIC PASSWORD *</label>
          <div className="relative">
            <Key className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-cyber-surface border border-cyber-border rounded pl-10 pr-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-300 mb-1">DEPARTMENT</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
          >
            <option value="DEFENCE_CYBER_COMMAND">DEFENCE CYBER COMMAND</option>
            <option value="DEFENCE_INTELLIGENCE_AGENCY">DEFENCE INTELLIGENCE AGENCY</option>
            <option value="STRATEGIC_FORCES_COMMAND">STRATEGIC FORCES COMMAND</option>
            <option value="AIR_DEFENCE_INTELLIGENCE">AIR DEFENCE INTELLIGENCE</option>
          </select>
        </div>

        <div>
          <label className="block text-gray-300 mb-1">SECURITY CLEARANCE</label>
          <select
            value={clearanceLevel}
            onChange={e => setClearanceLevel(e.target.value)}
            className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
          >
            <option value="UNCLASSIFIED">UNCLASSIFIED</option>
            <option value="RESTRICTED">RESTRICTED</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="SECRET">SECRET</option>
            <option value="TOP_SECRET">TOP SECRET</option>
          </select>
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

      <div className="pt-2 text-center">
        <Link
          href="/login"
          className="text-xs font-mono text-cyber-cyan hover:text-white transition-colors"
        >
          ALREADY REGISTERED? PROCEED TO AUTHENTICATION →
        </Link>
      </div>
    </form>
  );
};

export default SignupForm;

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { BRAND } from '@netra-shakti/shared-types';
import {
  Shield,
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Username or official email is required')
    .trim(),
  password: z
    .string()
    .min(1, 'Cryptographic password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      await login(data.identifier, data.password);
    } catch (err: any) {
      if (err.status === 401) {
        setServerError('Incorrect username/email or password.');
      } else if (err.status === 403) {
        setServerError('Account has been suspended by defense administrator.');
      } else if (err.status === 429) {
        setServerError('Too many authentication attempts. Please wait before retrying.');
      } else if (err.status === 500) {
        setServerError('Authentication service encountered an internal error. Please try again.');
      } else {
        setServerError(err.message || 'Authentication failed. Please verify DEFENCE credentials.');
      }
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
            {BRAND.name}
          </h1>
          <p className="text-xs font-mono text-cyber-cyan mt-0.5">
            {BRAND.tagline}
          </p>
          <p className="text-[11px] font-mono text-cyber-muted mt-1 uppercase">
            SECURE DEFENCE AUTHENTICATION GATEWAY
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
          {serverError && (
            <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">
              OPERATIONAL USERNAME / OFFICIAL EMAIL *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                autoComplete="username"
                {...register('identifier')}
                placeholder="e.g. officer.kumar or officer@defence.gov"
                className={`w-full bg-cyber-surface border rounded pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none font-mono ${
                  errors.identifier ? 'border-cyber-red focus:border-cyber-red' : 'border-cyber-border focus:border-cyber-cyan'
                }`}
              />
            </div>
            {errors.identifier && (
              <p className="text-[11px] font-mono text-cyber-red mt-1">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">
              CRYPTOGRAPHIC PASSWORD *
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                placeholder="••••••••••••"
                className={`w-full bg-cyber-surface border rounded pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none font-mono ${
                  errors.password ? 'border-cyber-red focus:border-cyber-red' : 'border-cyber-border focus:border-cyber-cyan'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-3 text-gray-500 hover:text-cyber-cyan focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] font-mono text-cyber-red mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-6 shadow-md shadow-cyber-cyan/20"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>LOGGING IN...</span>
              </>
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
              DON&apos;T HAVE AN ACCOUNT? CREATE DEFENCE ACCOUNT →
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

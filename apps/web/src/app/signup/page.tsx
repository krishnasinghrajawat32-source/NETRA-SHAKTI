'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Mail,
  Eye,
  EyeOff,
  Building,
  Award,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

const signupSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Full name / designation must be at least 2 characters')
      .trim(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(40, 'Username cannot exceed 40 characters')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, and hyphens')
      .trim(),
    email: z
      .string()
      .email('Must be a valid official email address')
      .trim(),
    password: z
      .string()
      .min(8, 'Cryptographic password must be at least 8 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your cryptographic password'),
    department: z.string().default('DEFENCE_CYBER_COMMAND'),
    clearanceLevel: z.string().default('CONFIDENTIAL'),
    rank: z.string().optional(),
    unit: z.string().optional()
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: 'DEFENCE_CYBER_COMMAND',
      clearanceLevel: 'CONFIDENTIAL',
      rank: '',
      unit: ''
    }
  });

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    setServerSuccess(null);

    try {
      await signup({
        displayName: data.displayName.trim(),
        username: data.username.trim(),
        email: data.email.trim(),
        password: data.password,
        department: data.department,
        clearanceLevel: data.clearanceLevel,
        rank: data.rank?.trim() || undefined,
        unit: data.unit?.trim() || undefined
      });

      setServerSuccess('DEFENCE Identity registered successfully in cryptographic registry. Redirecting to access gateway...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      if (err.status === 409) {
        setServerError(err.message || 'Username or email already exists in DEFENCE registry.');
      } else if (err.status === 400) {
        setServerError(err.message || 'Invalid registration details submitted.');
      } else {
        setServerError(err.message || 'Registration failed. Please verify submitted credentials.');
      }
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4" noValidate>
          {serverError && (
            <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {serverSuccess && (
            <div className="p-3 bg-cyber-green/10 border border-cyber-green/40 rounded text-xs font-mono text-cyber-green flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverSuccess}</span>
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
                  autoComplete="username"
                  {...register('username')}
                  placeholder="e.g. officer.kumar"
                  className={`w-full bg-cyber-surface border rounded pl-10 pr-3 py-2 text-xs text-white focus:outline-none font-mono ${
                    errors.username ? 'border-cyber-red focus:border-cyber-red' : 'border-cyber-border focus:border-cyber-cyan'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-[11px] font-mono text-cyber-red mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                OFFICIAL EMAIL *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  placeholder="officer@defence.gov"
                  className={`w-full bg-cyber-surface border rounded pl-10 pr-3 py-2 text-xs text-white focus:outline-none font-mono ${
                    errors.email ? 'border-cyber-red focus:border-cyber-red' : 'border-cyber-border focus:border-cyber-cyan'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-mono text-cyber-red mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">
              PERSONNEL FULL NAME / DESIGNATION *
            </label>
            <input
              type="text"
              autoComplete="name"
              {...register('displayName')}
              placeholder="e.g. Maj. Rajesh Kumar"
              className={`w-full bg-cyber-surface border rounded px-3 py-2 text-xs text-white focus:outline-none font-mono ${
                errors.displayName ? 'border-cyber-red focus:border-cyber-red' : 'border-cyber-border focus:border-cyber-cyan'
              }`}
            />
            {errors.displayName && (
              <p className="text-[11px] font-mono text-cyber-red mt-1">
                {errors.displayName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                PASSWORD (MIN 8 CHARS) *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  placeholder="••••••••••••"
                  className={`w-full bg-cyber-surface border rounded pl-10 pr-9 py-2 text-xs text-white focus:outline-none font-mono ${
                    errors.password ? 'border-cyber-red focus:border-cyber-red' : 'border-cyber-border focus:border-cyber-cyan'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-cyber-cyan focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] font-mono text-cyber-red mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                CONFIRM PASSWORD *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  placeholder="••••••••••••"
                  className={`w-full bg-cyber-surface border rounded pl-10 pr-9 py-2 text-xs text-white focus:outline-none font-mono ${
                    errors.confirmPassword ? 'border-cyber-red focus:border-cyber-red' : 'border-cyber-border focus:border-cyber-cyan'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute right-2.5 top-2.5 text-gray-500 hover:text-cyber-cyan focus:outline-none"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] font-mono text-cyber-red mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                DEPARTMENT / BRANCH
              </label>
              <select
                {...register('department')}
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
                {...register('clearanceLevel')}
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
                {...register('rank')}
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
                {...register('unit')}
                placeholder="e.g. 501st Cyber Task Wing"
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-6 shadow-md shadow-cyber-cyan/20"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>CREATING DEFENCE ACCOUNT...</span>
              </>
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

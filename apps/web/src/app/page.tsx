'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { EyeShieldVisual } from '@/components/cyber/EyeShieldVisual';
import {
  Shield,
  Lock,
  Fingerprint,
  Database,
  Search,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Layers
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black cyber-grid text-white">
      {/* Top DEFENCE Bar */}
      <header className="h-16 border-b border-cyber-border px-8 flex items-center justify-between backdrop-blur-md bg-cyber-black/70 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyber-cyan" />
          </div>
          <div>
            <span className="font-mono font-bold tracking-wider text-base text-white">
              NETRA SHAKTI
            </span>
            <span className="hidden sm:inline-block ml-3 px-2 py-0.5 text-[10px] font-mono rounded bg-cyber-surface border border-cyber-cyan/30 text-cyber-cyan">
              MIL-SPEC DEFENCE
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <Link
              href="/dashboard"
              className="px-5 py-2 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2"
            >
              <span>ACCESS COMMAND DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan hover:text-black font-mono font-bold text-xs transition-all flex items-center space-x-1"
              >
                <span>LOGIN</span>
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-1.5 shadow-md shadow-cyber-cyan/20"
              >
                <span>CREATE ACCOUNT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center px-8 lg:px-20 py-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Left-Locked Typography */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-cyber-surface border border-cyber-border text-xs font-mono text-cyber-cyan">
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span>TRACE THE ORIGIN, PROVE THE TRUTH</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight uppercase font-sans">
              SECURITY THAT
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-white to-cyber-green">
                SEES THE UNSEEN.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed font-sans">
              Secure confidential document distribution using cryptographic attribution,
              forensic watermarking and immutable decryption provenance.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-8 py-3.5 bg-cyber-cyan text-black font-mono font-bold text-sm hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 shadow-lg shadow-cyber-cyan/20"
                >
                  <span>ACCESS COMMAND DASHBOARD</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-8 py-3.5 bg-cyber-cyan text-black font-mono font-bold text-sm hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 shadow-lg shadow-cyber-cyan/20"
                  >
                    <span>LOGIN</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/signup"
                    className="px-8 py-3.5 bg-cyber-surface text-gray-200 border border-cyber-border font-mono text-sm hover:border-cyber-cyan hover:text-white transition-colors flex items-center space-x-2"
                  >
                    <span>CREATE ACCOUNT</span>
                  </Link>
                </>
              )}

              <a
                href="#features"
                className="px-6 py-3.5 bg-transparent text-gray-400 hover:text-cyber-cyan font-mono text-sm transition-colors flex items-center"
              >
                EXPLORE PLATFORM ↓
              </a>
            </div>

            {/* Quick Badges */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] font-mono text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-green" />
                <span>AES-256-GCM + Ed25519</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-cyan" />
                <span>Tamper-Evident Ledger</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyber-gold" />
                <span>Air-Gapped Operation</span>
              </div>
            </div>
          </div>

          {/* Right Column: Cyber Visual */}
          <div className="lg:col-span-5 flex justify-center">
            <EyeShieldVisual />
          </div>
        </div>

        {/* Feature Grid */}
        <section id="features" className="mt-24 pt-16 border-t border-cyber-border">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-wider text-cyber-cyan uppercase">
              DEFENCE-GRADE ARCHITECTURE
            </h2>
            <p className="text-sm text-gray-400 mt-2 font-mono">
              AI TO DETECT • CRYPTOGRAPHY TO VERIFY • PROVENANCE TO TRACE
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 bg-cyber-card border border-cyber-border rounded hover:border-cyber-cyan/60 transition-colors">
              <div className="w-10 h-10 rounded bg-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center text-cyber-cyan mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-mono font-bold text-white text-base uppercase">
                Cryptographic Ingestion
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Automated magic-byte validation, SHA-256 integrity hashing, and envelope AES-256-GCM encryption with wrapped master keys.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 bg-cyber-card border border-cyber-border rounded hover:border-cyber-green/60 transition-colors">
              <div className="w-10 h-10 rounded bg-cyber-green/10 border border-cyber-green/40 flex items-center justify-center text-cyber-green mb-4">
                <Fingerprint className="w-5 h-5" />
              </div>
              <h3 className="font-mono font-bold text-white text-base uppercase">
                Forensic Watermarking
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Multi-layer invisible spatial & discrete cosine transform steganography embedding recipient identity, session nonce, and checksums.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 bg-cyber-card border border-cyber-border rounded hover:border-cyber-gold/60 transition-colors">
              <div className="w-10 h-10 rounded bg-cyber-gold/10 border border-cyber-gold/40 flex items-center justify-center text-cyber-gold mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-mono font-bold text-white text-base uppercase">
                Immutable Ledger
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Append-only cryptographic hash-chained provenance ledger with digital signatures providing undeniable mathematical evidence of distribution.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyber-border py-6 px-8 text-center text-xs font-mono text-gray-500">
        <div>NETRA SHAKTI // STRATEGIC CYBER DEFENCE INITIATIVE</div>
        <div className="text-[10px] text-gray-600 mt-1">Air-Gapped Compliant • Zero Cloud Dependencies • Post-Quantum Cryptography Ready</div>
      </footer>
    </div>
  );
}

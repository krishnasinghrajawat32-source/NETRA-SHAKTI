'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, User, LogOut } from 'lucide-react';
import { BRAND } from '@netra-shakti/shared-types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="w-full h-16 bg-cyber-card border-b border-cyber-border flex items-center justify-between px-6 z-30">
      {/* Brand */}
      <Link href="/" className="flex items-center space-x-3 group">
        <div className="w-9 h-9 rounded bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center text-cyber-cyan group-hover:scale-105 transition-transform">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="font-mono font-bold text-white tracking-wider text-sm flex items-center space-x-2">
            <span>{BRAND.name}</span>
            <span className="text-[10px] text-cyber-cyan font-normal">v2.4</span>
          </div>
          <div className="text-[10px] font-mono text-cyber-muted tracking-tight">
            {BRAND.tagline}
          </div>
        </div>
      </Link>

      {/* Right User Bar */}
      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <Link
              href="/profile"
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded bg-cyber-surface hover:border-cyber-cyan border border-cyber-border transition-colors text-xs font-mono"
            >
              <User className="w-3.5 h-3.5 text-cyber-cyan" />
              <div className="text-left hidden sm:block">
                <div className="text-white font-bold">{user.displayName}</div>
                <div className="text-[10px] text-cyber-muted">[{user.clearanceLevel}]</div>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              className="p-2 rounded bg-cyber-surface hover:bg-cyber-red/20 text-gray-400 hover:text-cyber-red border border-cyber-border transition-colors"
              title="Terminate Secure Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-1.5 rounded bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all shadow-md shadow-cyber-cyan/20"
            >
              ACCESS GATEWAY
            </Link>
            <Link
              href="/signup"
              className="px-3 py-1.5 rounded border border-cyber-border hover:border-cyber-cyan text-gray-300 font-mono text-xs transition-colors hidden sm:block"
            >
              REGISTER
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

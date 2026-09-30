'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Shield, Lock, LogOut, User, Activity, AlertTriangle } from 'lucide-react';

const clearanceColors: Record<string, string> = {
  TOP_SECRET: 'bg-cyber-red/20 text-cyber-red border-cyber-red/40',
  SECRET: 'bg-cyber-gold/20 text-cyber-gold border-cyber-gold/40',
  CONFIDENTIAL: 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/40',
  RESTRICTED: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  UNCLASSIFIED: 'bg-gray-500/20 text-gray-400 border-gray-500/40'
};

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-cyber-card border-b border-cyber-border px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Classification Banner & System Indicator */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-cyber-cyan" />
          <span className="font-bold tracking-wider text-sm font-mono text-white">
            NETRA SHAKTI
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded bg-cyber-surface border border-cyber-border text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
          <span className="text-gray-300">DEFENCE CRYPTO ENGINE // ONLINE</span>
        </div>
      </div>

      {/* Right: User Clearance, Rank & Actions */}
      {user ? (
        <div className="flex items-center space-x-4">
          {/* Clearance Badge */}
          <div className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${clearanceColors[user.clearanceLevel] || 'text-gray-300'}`}>
            {user.clearanceLevel}
          </div>

          {/* User Info */}
          <div className="hidden sm:block text-right">
            <div className="text-xs font-medium text-white">{user.displayName}</div>
            <div className="text-[10px] font-mono text-cyber-muted">
              {user.rank ? `${user.rank} • ` : ''}{user.department}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            className="p-2 rounded bg-cyber-surface hover:bg-cyber-red/20 text-gray-300 hover:text-cyber-red border border-cyber-border transition-colors text-xs flex items-center space-x-1"
            title="Terminate Secure Session"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline font-mono">LOGOUT</span>
          </button>
        </div>
      ) : (
        <div>
          <Link
            href="/login"
            className="px-4 py-1.5 rounded bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-colors"
          >
            SECURE LOGIN →
          </Link>
        </div>
      )}
    </header>
  );
};

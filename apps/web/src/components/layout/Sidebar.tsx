'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Lock,
  Fingerprint,
  Database,
  Search,
  History,
  BrainCircuit,
  Key,
  Activity,
  Users,
  ShieldAlert
} from 'lucide-react';
import { UserRole } from '@netra-shakti/shared-types';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'Decryption Sessions', href: '/sessions', icon: Lock },
    { label: 'Watermark Registry', href: '/watermarks', icon: Fingerprint },
    { label: 'Immutable Ledger', href: '/ledger', icon: Database },
    {
      label: 'Digital Forensics',
      href: '/investigations',
      icon: Search,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR]
    },
    {
      label: 'Audit Trail',
      href: '/audit',
      icon: History,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVESTIGATOR]
    },
    { label: 'ML Forensic Engine', href: '/ml-models', icon: BrainCircuit },
    { label: 'Resilience Lab', href: '/lab', icon: ShieldAlert },
    { label: 'Key & PQC Setup', href: '/keys', icon: Key },
    { label: 'System Health', href: '/health', icon: Activity },
    {
      label: 'User Management',
      href: '/users',
      icon: Users,
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    }
  ];

  return (
    <aside className="w-64 bg-cyber-card border-r border-cyber-border flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-cyber-border">
        <div className="text-[11px] font-mono text-cyber-cyan font-bold tracking-widest uppercase">
          FORENSIC ATTRIBUTION
        </div>
        <div className="text-[9px] font-mono text-cyber-muted tracking-wider mt-0.5">
          AIR-GAPPED DEFENCE SUITE
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          if (item.roles && user && user.role !== UserRole.SUPER_ADMIN && !item.roles.includes(user.role)) {
            return null;
          }

          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded text-xs font-mono transition-all ${
                isActive
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border-l-2 border-cyber-cyan font-bold'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-cyber-surface'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyber-cyan' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role Footer */}
      {user && (
        <div className="p-3 border-t border-cyber-border bg-cyber-surface/50 text-[10px] font-mono">
          <div className="text-gray-400">AUTHENTICATED ROLE</div>
          <div className="text-cyber-green font-bold uppercase">{user.role}</div>
        </div>
      )}
    </aside>
  );
};

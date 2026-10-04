'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@netra-shakti/shared-types';
import { Shield, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles
}) => {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-black text-gray-100 cyber-grid p-6">
        <div className="w-12 h-12 rounded bg-cyber-cyan/10 border border-cyber-cyan flex items-center justify-center text-cyber-cyan mb-4 animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <div className="text-xs font-mono text-cyber-cyan font-bold flex items-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>VERIFYING DEFENCE AUTHENTICATION &amp; CLEARANCE...</span>
        </div>
        <p className="text-[11px] font-mono text-gray-500 mt-2">
          Zero-Trust Cryptographic Identity Verification Enforced
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasRole(...requiredRoles)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-black text-gray-100 cyber-grid p-6 text-center">
        <div className="w-14 h-14 rounded bg-cyber-red/10 border border-cyber-red flex items-center justify-center text-cyber-red mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-base font-mono font-bold text-white uppercase">
          ACCESS RESTRICTED: INSUFFICIENT DEFENCE CLEARANCE
        </h2>
        <p className="text-xs font-mono text-gray-400 max-w-md mt-2">
          Your current personnel identity (@{user.username}) does not possess the required clearance role to inspect this secure resource.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 px-5 py-2.5 bg-cyber-surface hover:bg-cyber-cyan hover:text-black border border-cyber-cyan text-cyber-cyan font-mono text-xs transition-colors"
        >
          RETURN TO AUTHORIZED DASHBOARD →
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

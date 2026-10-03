'use client';

import React from 'react';
import { Activity, Database, Shield, Lock, Cpu, Server } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface SystemHealthCardProps {
  name: string;
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'OFFLINE';
  type: 'DATABASE' | 'STORAGE' | 'CRYPTO' | 'LEDGER' | 'ML' | 'GENERAL';
  details?: string;
  latencyMs?: number;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  name,
  status,
  type,
  details,
  latencyMs
}) => {
  const getIcon = () => {
    switch (type) {
      case 'DATABASE': return <Database className="w-5 h-5 text-cyber-cyan" />;
      case 'STORAGE': return <Server className="w-5 h-5 text-cyber-gold" />;
      case 'CRYPTO': return <Shield className="w-5 h-5 text-cyber-green" />;
      case 'LEDGER': return <Lock className="w-5 h-5 text-cyber-gold" />;
      case 'ML': return <Cpu className="w-5 h-5 text-cyber-cyan" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-5 bg-cyber-card border border-cyber-border rounded flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded bg-cyber-surface border border-cyber-border flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase">{name}</h4>
            <div className="text-[10px] font-mono text-gray-400">
              {latencyMs !== undefined ? `${latencyMs}ms latency` : 'Active Daemon'}
            </div>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      {details && (
        <div className="text-[11px] font-mono text-cyber-muted bg-cyber-surface/40 p-2.5 rounded border border-cyber-border">
          {details}
        </div>
      )}
    </div>
  );
};

export default SystemHealthCard;

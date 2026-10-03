'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'cyan' | 'green' | 'red' | 'gold' | 'muted';
  size?: 'sm' | 'md';
}

const BADGE_COLORS: Record<string, string> = {
  // Classification
  TOP_SECRET: 'bg-cyber-red/15 text-cyber-red border-cyber-red/40',
  SECRET: 'bg-cyber-gold/15 text-cyber-gold border-cyber-gold/40',
  CONFIDENTIAL: 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/40',
  RESTRICTED: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
  UNCLASSIFIED: 'bg-gray-500/15 text-gray-400 border-gray-500/40',

  // Statuses
  ACTIVE: 'bg-cyber-green/15 text-cyber-green border-cyber-green/40',
  SUSPENDED: 'bg-cyber-red/15 text-cyber-red border-cyber-red/40',
  ENCRYPTED: 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/40',
  DISTRIBUTED: 'bg-cyber-green/15 text-cyber-green border-cyber-green/40',
  REVOKED: 'bg-cyber-red/15 text-cyber-red border-cyber-red/40',
  GRANTED: 'bg-cyber-green/15 text-cyber-green border-cyber-green/40',
  ACCESSED: 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/40',
  COMPLETED: 'bg-cyber-green/15 text-cyber-green border-cyber-green/40',
  FAILED: 'bg-cyber-red/15 text-cyber-red border-cyber-red/40',
  VERIFIED_MATCH: 'bg-cyber-red/20 text-cyber-red border-cyber-red/50 animate-pulse font-bold',
  NO_MATCH: 'bg-gray-500/20 text-gray-400 border-gray-500/40',
  UP: 'bg-cyber-green/15 text-cyber-green border-cyber-green/40',
  DOWN: 'bg-cyber-red/15 text-cyber-red border-cyber-red/40',
  DEGRADED: 'bg-cyber-gold/15 text-cyber-gold border-cyber-gold/40'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant, size = 'sm' }) => {
  let styleClass = BADGE_COLORS[status];

  if (!styleClass) {
    if (variant === 'green') styleClass = 'bg-cyber-green/15 text-cyber-green border-cyber-green/40';
    else if (variant === 'red') styleClass = 'bg-cyber-red/15 text-cyber-red border-cyber-red/40';
    else if (variant === 'gold') styleClass = 'bg-cyber-gold/15 text-cyber-gold border-cyber-gold/40';
    else if (variant === 'cyan') styleClass = 'bg-cyber-cyan/15 text-cyber-cyan border-cyber-cyan/40';
    else styleClass = 'bg-cyber-surface text-gray-300 border-cyber-border';
  }

  const sizeClass = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]';

  return (
    <span className={`inline-flex items-center font-mono font-bold rounded border uppercase ${sizeClass} ${styleClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;

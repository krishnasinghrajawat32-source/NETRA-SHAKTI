'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'AUTHENTICATING CLEARANCE & LOADING TELEMETRY...',
  subtext = 'Querying encrypted DEFENCE repositories'
}) => {
  return (
    <div className="w-full p-12 flex flex-col items-center justify-center space-y-3 bg-cyber-card/50 border border-cyber-border rounded">
      <RefreshCw className="w-7 h-7 text-cyber-cyan animate-spin" />
      <div className="text-xs font-mono font-bold text-cyber-cyan uppercase tracking-wider">
        {message}
      </div>
      {subtext && (
        <div className="text-[11px] font-mono text-gray-500">
          {subtext}
        </div>
      )}
    </div>
  );
};

export default LoadingState;

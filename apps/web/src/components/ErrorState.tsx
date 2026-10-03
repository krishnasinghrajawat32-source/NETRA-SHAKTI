'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'OPERATIONAL FAULT DETECTED',
  message = 'An unexpected error occurred during request execution.',
  onRetry
}) => {
  return (
    <div className="w-full p-8 flex flex-col items-center justify-center space-y-3 bg-cyber-red/5 border border-cyber-red/30 rounded text-center">
      <div className="w-10 h-10 rounded bg-cyber-red/10 border border-cyber-red flex items-center justify-center text-cyber-red">
        <AlertCircle className="w-5 h-5" />
      </div>
      <div className="text-xs font-mono font-bold text-cyber-red uppercase tracking-wider">
        {title}
      </div>
      <p className="text-xs font-mono text-gray-400 max-w-md">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-1.5 bg-cyber-surface hover:bg-cyber-cyan hover:text-black border border-cyber-cyan text-cyber-cyan font-mono text-xs transition-colors flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RETRY OPERATION</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;

'use client';

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Shield, AlertCircle, RefreshCw, Download, FileText, Lock, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api-client';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class PdfErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PdfViewer trapped rendering error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-cyber-card border border-cyber-red/40 rounded text-center">
          <div className="w-12 h-12 rounded bg-cyber-red/10 border border-cyber-red flex items-center justify-center text-cyber-red mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-mono font-bold text-white uppercase">
            {this.props.fallbackTitle || 'Unable to open this document.'}
          </h3>
          <p className="text-xs font-mono text-gray-400 max-w-md mt-2">
            The document stream could not be decoded or rendered. The system prevented this fault from affecting other platform operations.
          </p>
          {this.state.error?.message && (
            <div className="mt-3 text-[11px] font-mono text-cyber-red bg-cyber-surface px-3 py-1.5 rounded border border-cyber-border">
              {this.state.error.message}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="mt-5 px-4 py-2 bg-cyber-surface hover:bg-cyber-cyan hover:text-black border border-cyber-cyan text-cyber-cyan font-mono text-xs transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RETRY RENDERING</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface PdfViewerProps {
  documentId?: string;
  sessionId?: string;
  streamUrl?: string;
  blob?: Blob;
  title?: string;
  allowDownload?: boolean;
  classification?: string;
  onLoadSuccess?: () => void;
  onLoadError?: (err: Error) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  documentId,
  sessionId,
  streamUrl,
  blob,
  title = 'Confidential Defence Document',
  allowDownload = false,
  classification = 'CONFIDENTIAL',
  onLoadSuccess,
  onLoadError
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const loadPdfBlob = async () => {
      setLoading(true);
      setError(null);

      try {
        // Case 1: Blob passed directly
        if (blob) {
          createdUrl = URL.createObjectURL(blob);
          if (active) {
            setObjectUrl(createdUrl);
            setLoading(false);
            if (onLoadSuccess) onLoadSuccess();
          }
          return;
        }

        // Determine stream endpoint
        let endpoint = streamUrl;
        if (!endpoint && sessionId) {
          endpoint = `/decryption-sessions/${sessionId}/stream`;
        } else if (!endpoint && documentId) {
          throw new Error('Encrypted documents require completed decryption session before opening.');
        }

        if (!endpoint) {
          throw new Error('No valid PDF stream source provided.');
        }

        // Fetch securely with auth credentials and Bearer token
        const responseBlob = await api.getBlob(endpoint);

        // Security Validation: Verify magic bytes or content type
        const bufferSlice = await responseBlob.slice(0, 10).text();
        if (!bufferSlice.startsWith('%PDF-') && !responseBlob.type.includes('pdf')) {
          throw new Error('Downloaded binary payload is not a valid decrypted PDF structure.');
        }

        if (active) {
          createdUrl = URL.createObjectURL(responseBlob);
          setObjectUrl(createdUrl);
          setLoading(false);
          if (onLoadSuccess) onLoadSuccess();
        }
      } catch (err: any) {
        if (active) {
          console.error('PDF fetch/render error:', err);
          const msg = err.message || 'Unable to open this document.';
          setError(msg);
          setLoading(false);
          if (onLoadError) onLoadError(err);
        }
      }
    };

    loadPdfBlob();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [sessionId, streamUrl, blob, documentId, retryCount]);

  // Clean up objectUrl on final unmount
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  return (
    <PdfErrorBoundary fallbackTitle="Unable to open this document." onRetry={handleRetry}>
      <div className="w-full h-full flex flex-col bg-cyber-card border border-cyber-border rounded overflow-hidden shadow-2xl">
        {/* Document HUD Bar */}
        <div className="p-3 bg-cyber-surface border-b border-cyber-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyber-cyan" />
            <span className="font-bold text-white uppercase truncate max-w-xs">{title}</span>
            <span className="text-[10px] px-2 py-0.5 rounded border border-cyber-cyan/40 bg-cyber-cyan/15 text-cyber-cyan font-bold">
              {classification}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {allowDownload && objectUrl && (
              <a
                href={objectUrl}
                download={`${title.replace(/\s+/g, '_')}.pdf`}
                className="px-3 py-1 rounded bg-cyber-cyan text-black hover:bg-cyber-cyan/90 font-bold transition-all flex items-center space-x-1 text-[11px]"
              >
                <Download className="w-3 h-3" />
                <span>DOWNLOAD PDF</span>
              </a>
            )}

            {objectUrl && (
              <a
                href={objectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-cyber-surface hover:bg-cyber-border text-gray-300 font-bold transition-all flex items-center space-x-1 text-[11px] border border-cyber-border"
              >
                <ExternalLink className="w-3 h-3" />
                <span>FULLSCREEN</span>
              </a>
            )}
          </div>
        </div>

        {/* Viewport Area */}
        <div className="relative w-full h-[650px] bg-cyber-black">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-cyber-black/90 z-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-cyber-cyan animate-spin" />
              <div className="text-xs font-mono text-cyber-cyan font-bold">
                STREAMING WATERMARKED DEFENCE PDF...
              </div>
              <div className="text-[10px] font-mono text-gray-500">
                Verifying AES-256 integrity and rendering valid PDF stream
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-cyber-black/95 z-20 text-center">
              <div className="w-12 h-12 rounded bg-cyber-red/10 border border-cyber-red flex items-center justify-center text-cyber-red mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-sm font-mono font-bold text-white uppercase">
                Unable to open this document.
              </div>
              <div className="text-xs font-mono text-gray-400 max-w-md mt-1">
                {error}
              </div>
              <button
                onClick={handleRetry}
                className="mt-4 px-4 py-2 bg-cyber-surface hover:bg-cyber-cyan hover:text-black border border-cyber-cyan text-cyber-cyan font-mono text-xs transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>TRY AGAIN</span>
              </button>
            </div>
          )}

          {objectUrl && !error && (
            <iframe
              src={`${objectUrl}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>
      </div>
    </PdfErrorBoundary>
  );
};

export default PdfViewer;

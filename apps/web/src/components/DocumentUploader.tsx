'use client';

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, X, Shield, Lock } from 'lucide-react';
import { api } from '@/lib/api-client';

interface DocumentUploaderProps {
  onSuccess: (document: any) => void;
  onCancel: () => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onSuccess, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState('CONFIDENTIAL');
  const [allowDownload, setAllowDownload] = useState(false);
  const [maxAccessCount, setMaxAccessCount] = useState(5);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Only valid defence PDF documents are supported for ingestion.');
        return;
      }
      setFile(selected);
      setError(null);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').toUpperCase());
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file to encrypt and ingest.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (description) formData.append('description', description.trim());
      formData.append('classification', classification);
      formData.append('allowDownload', String(allowDownload));
      formData.append('maxAccessCount', String(maxAccessCount));

      const newDoc = await api.post('/documents', formData);
      onSuccess(newDoc);
    } catch (err: any) {
      setError(err.message || 'Ingestion and encryption failed. Check clearance and format.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-cyber-card border border-cyber-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-cyber-border bg-cyber-surface/50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyber-cyan" />
            <span className="font-mono font-bold text-sm text-white uppercase">
              DEFENCE DOCUMENT INGESTION & AES-256 ENCRYPTION
            </span>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpload} className="p-6 space-y-4 text-xs font-mono">
          {error && (
            <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-cyber-red flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* File input */}
          <div className="border-2 border-dashed border-cyber-border hover:border-cyber-cyan rounded p-6 text-center transition-colors">
            <input
              type="file"
              accept=".pdf,application/pdf"
              required
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload-input"
            />
            <label htmlFor="pdf-upload-input" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-cyber-cyan mb-2" />
              {file ? (
                <div className="text-white font-bold flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-cyber-green" />
                  <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
                </div>
              ) : (
                <>
                  <div className="text-white font-bold">CLICK TO SELECT CLASSIFIED PDF</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Magic Byte &amp; MIME validation will be executed prior to AES-256-GCM encryption
                  </div>
                </>
              )}
            </label>
          </div>

          <div>
            <label className="block text-gray-300 mb-1">DOCUMENT TITLE *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. OPERATION TRISHUL STRATEGIC DIRECTIVE"
              className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">HANDLING DIRECTIVE / DESCRIPTION</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Security handling caveats, distribution restrictions..."
              className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">CLASSIFICATION LEVEL</label>
              <select
                value={classification}
                onChange={e => setClassification(e.target.value)}
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
              >
                <option value="TOP_SECRET">TOP SECRET</option>
                <option value="SECRET">SECRET</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="UNCLASSIFIED">UNCLASSIFIED</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-1">MAX ACCESS SESSIONS</label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxAccessCount}
                onChange={e => setMaxAccessCount(parseInt(e.target.value, 10) || 5)}
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="allow-download-checkbox"
              checked={allowDownload}
              onChange={e => setAllowDownload(e.target.checked)}
              className="rounded bg-cyber-surface border-cyber-border text-cyber-cyan focus:ring-0"
            />
            <label htmlFor="allow-download-checkbox" className="text-gray-300 select-none cursor-pointer">
              Permit Recipient to Download Issued Watermarked Copy
            </label>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-cyber-border">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-cyber-surface border border-cyber-border hover:border-gray-500 rounded text-gray-300 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-cyber-cyan text-black font-bold rounded hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>ENCRYPTING &amp; INGESTING...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>ENCRYPT &amp; INGEST</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploader;

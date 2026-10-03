'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, AlertTriangle, CheckCircle2, RefreshCw, X, UserPlus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { IUser } from '@netra-shakti/shared-types';

interface RecipientSelectorProps {
  documentId: string;
  documentClassification: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const RecipientSelector: React.FC<RecipientSelectorProps> = ({
  documentId,
  documentClassification,
  onSuccess,
  onClose
}) => {
  const [users, setUsers] = useState<IUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get<{ users: IUser[] }>('/users');
        setUsers(res.users || []);
      } catch (err: any) {
        setError(err.message || 'Failed to query authorized personnel registry.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select an authorized personnel identity.');
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      await api.post(`/documents/${documentId}/recipients`, {
        recipientId: selectedUserId
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to assign recipient. Verify clearance match.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-cyber-card border border-cyber-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-cyber-border bg-cyber-surface/50 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyber-cyan" />
            <span className="font-mono font-bold text-sm text-white uppercase">
              ASSIGN RECIPIENT WITH CLEARANCE VALIDATION
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleAssign} className="p-6 space-y-4 text-xs font-mono">
          {error && (
            <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-cyber-red flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-gray-300 mb-1">
              TARGET PERSONNEL IDENTITY (CLEARANCE &gt;= {documentClassification}) *
            </label>
            {loading ? (
              <div className="py-4 text-center text-cyber-cyan flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>QUERYING PERSONNEL CLEARANCES...</span>
              </div>
            ) : (
              <select
                required
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-white focus:outline-none focus:border-cyber-cyan"
              >
                <option value="">-- Choose Personnel Identity --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.displayName} (@{u.username}) [{u.clearanceLevel}] - {u.department}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="p-3 bg-cyber-surface/50 border border-cyber-border rounded text-[11px] text-gray-400">
            Assigned recipient will receive an authorization ticket recorded in the immutable provenance ledger. Decryption will mandate real-time invisible steganographic fingerprinting.
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-cyber-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-cyber-surface border border-cyber-border hover:border-gray-500 rounded text-gray-300 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={assigning || loading}
              className="px-6 py-2 bg-cyber-cyan text-black font-bold rounded hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {assigning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>COMMITTING ASSIGNMENT...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>AUTHORIZE DISTRIBUTION</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecipientSelector;

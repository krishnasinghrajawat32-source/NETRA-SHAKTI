'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { api } from '@/lib/api';
import { IUser, UserRole, ClearanceLevel, UserStatus } from '@netra-shakti/shared-types';
import { Users, UserPlus, Shield, Lock, AlertTriangle, CheckCircle2, X, RefreshCw } from 'lucide-react';

const CLASSIFICATION_BADGES: Record<string, string> = {
  TOP_SECRET: 'bg-cyber-red/20 text-cyber-red border-cyber-red/50',
  SECRET: 'bg-cyber-gold/20 text-cyber-gold border-cyber-gold/50',
  CONFIDENTIAL: 'bg-cyber-cyan/20 text-cyber-cyan border-cyber-cyan/50',
  RESTRICTED: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  UNCLASSIFIED: 'bg-gray-500/20 text-gray-300 border-gray-500/50'
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create User Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.RECIPIENT);
  const [clearanceLevel, setClearanceLevel] = useState<ClearanceLevel>(ClearanceLevel.CONFIDENTIAL);
  const [department, setDepartment] = useState('DEFENCE_CYBER_COMMAND');
  const [rank, setRank] = useState('');
  const [unit, setUnit] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ users: IUser[]; total: number }>('/users?limit=100');
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      await api.post('/users', {
        username,
        email,
        displayName,
        role,
        clearanceLevel,
        department,
        rank: rank || undefined,
        unit: unit || undefined
      });

      setIsCreateModalOpen(false);
      setUsername('');
      setEmail('');
      setDisplayName('');
      setRank('');
      setUnit('');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create user identity');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleSuspend = async (userId: string) => {
    try {
      await api.post(`/users/${userId}/suspend`, {});
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const res = await api.post(`/users/${userId}/reset-password`, {});
      alert(`Temporary password set to: ${res.temporaryPassword}`);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-black text-gray-100 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-3">
                <Users className="w-6 h-6 text-cyber-cyan" />
                <span>PERSONNEL DIRECTORY & CLEARANCE MANAGEMENT</span>
              </h1>
              <p className="text-xs font-mono text-cyber-muted mt-1">
                Role-Based Access Control, Clearance Level Hierarchies, and Asymmetric Crypto Identities.
              </p>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 transition-all flex items-center space-x-2 shadow-md shadow-cyber-cyan/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>CREATE DEFENSE IDENTITY</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-cyber-card border border-cyber-border rounded overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-cyber-cyan">
                QUERYING DEFENSE USER DIRECTORY...
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-gray-400">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-cyber-border text-cyber-muted bg-cyber-surface/50">
                      <th className="p-4">PERSONNEL</th>
                      <th className="p-4">ROLE</th>
                      <th className="p-4">CLEARANCE LEVEL</th>
                      <th className="p-4">DEPARTMENT / UNIT</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-cyber-surface/40">
                        <td className="p-4">
                          <div className="font-bold text-white">{u.displayName}</div>
                          <div className="text-[10px] text-gray-400">@{u.username} • {u.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyber-surface border border-cyber-border text-cyber-cyan font-bold">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${CLASSIFICATION_BADGES[u.clearanceLevel] || 'text-gray-300'}`}>
                            {u.clearanceLevel}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">
                          <div>{u.department}</div>
                          <div className="text-[10px] text-cyber-muted">{u.rank ? `${u.rank} • ` : ''}{u.unit || 'Standard Unit'}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${u.status === 'ACTIVE' ? 'bg-cyber-green/15 text-cyber-green border border-cyber-green/30' : 'bg-cyber-red/15 text-cyber-red border border-cyber-red/30'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleResetPassword(u.id)}
                            className="px-2.5 py-1 rounded bg-cyber-surface hover:bg-cyber-border border border-cyber-border text-gray-300 hover:text-white text-[10px]"
                            title="Reset Password"
                          >
                            RESET PWD
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(u.id)}
                            className={`px-2.5 py-1 rounded border text-[10px] ${u.status === 'ACTIVE' ? 'bg-cyber-surface hover:bg-cyber-red/20 text-gray-400 hover:text-cyber-red border-cyber-border' : 'bg-cyber-green/20 text-cyber-green border-cyber-green/40'}`}
                          >
                            {u.status === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Create User Modal */}
          {isCreateModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg bg-cyber-card border border-cyber-border rounded-lg shadow-2xl overflow-hidden">
                <div className="p-5 border-b border-cyber-border bg-cyber-surface/50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-cyber-cyan" />
                    <span className="font-mono font-bold text-sm text-white uppercase">
                      REGISTER DEFENSE PERSONNEL IDENTITY
                    </span>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        USERNAME *
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="e.g. officer.kumar"
                        className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        OFFICIAL EMAIL *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="officer@defence.netrashakti.gov"
                        className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-gray-300 mb-1">
                      FULL DISPLAY NAME *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="e.g. Col. Vikram Sharma"
                      className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        DEFENSE ROLE *
                      </label>
                      <select
                        value={role}
                        onChange={e => setRole(e.target.value as UserRole)}
                        className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan"
                      >
                        <option value="RECIPIENT">RECIPIENT</option>
                        <option value="SENDER">SENDER</option>
                        <option value="INVESTIGATOR">INVESTIGATOR</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        SECURITY CLEARANCE *
                      </label>
                      <select
                        value={clearanceLevel}
                        onChange={e => setClearanceLevel(e.target.value as ClearanceLevel)}
                        className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyber-cyan"
                      >
                        <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                        <option value="SECRET">SECRET</option>
                        <option value="TOP_SECRET">TOP SECRET</option>
                        <option value="RESTRICTED">RESTRICTED</option>
                        <option value="UNCLASSIFIED">UNCLASSIFIED</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        DEPARTMENT
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        placeholder="AIR_FORCE_INTEL"
                        className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        RANK
                      </label>
                      <input
                        type="text"
                        value={rank}
                        onChange={e => setRank(e.target.value)}
                        placeholder="Major"
                        className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        UNIT
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        placeholder="Electronic Wing"
                        className="w-full bg-cyber-surface border border-cyber-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-cyber-cyan font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 rounded bg-cyber-surface text-gray-300 font-mono text-xs hover:bg-cyber-border"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-5 py-2 rounded bg-cyber-cyan text-black font-mono font-bold text-xs hover:bg-cyber-cyan/90 disabled:opacity-50 flex items-center space-x-1"
                    >
                      {creating ? 'GENERATING CRYPTO KEYS...' : 'REGISTER IDENTITY'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

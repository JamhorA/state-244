'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export default function AllianceMembersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, isOfficer, isR5, isSuperadmin, loading: roleLoading } = useRole();
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dataFetchedRef = useRef(false);

  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [editForm, setEditForm] = useState({ display_name: '', hq_level: 1, power: 0, notes: '' });
  const [savingMember, setSavingMember] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    display_name: '',
    role: 'member' as Profile['role'],
    can_edit_alliance: false,
  });

  useEffect(() => {
    if (!authLoading && !roleLoading && !dataFetchedRef.current) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/alliance/members');
      } else if (!isOfficer()) {
        router.replace('/dashboard');
      } else if (profile?.alliance_id) {
        dataFetchedRef.current = true;
        fetchMembers();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, profile, router]);

  async function fetchMembers() {
    if (!profile?.alliance_id) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('alliance_id', profile.alliance_id)
        .order('role');
      if (data) setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePermission(userId: string, canEdit: boolean) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        targetUserId: userId,
        can_edit_alliance: canEdit,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Error updating permission:', data.error);
      return;
    }

    setMembers(members.map(m => m.id === userId ? { ...m, can_edit_alliance: canEdit } : m));
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          ...newUser,
          alliance_id: profile?.alliance_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(`User "${newUser.display_name}" created successfully!`);
      setNewUser({
        email: '',
        password: '',
        display_name: '',
        role: 'member',
        can_edit_alliance: false,
      });
      setShowCreateForm(false);
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCreating(false);
    }
  }

  function openEditModal(member: Profile) {
    setEditingMember(member);
    setEditForm({
      display_name: member.display_name,
      hq_level: member.hq_level,
      power: member.power,
      notes: member.notes || '',
    });
    setError(null);
  }

  async function handleSaveMember() {
    if (!editingMember) return;
    
    setSavingMember(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          targetUserId: editingMember.id,
          display_name: editForm.display_name,
          hq_level: editForm.hq_level,
          power: editForm.power,
          notes: editForm.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update member');
      }

      setMembers(members.map(m => m.id === editingMember.id ? data.profile : m));
      setEditingMember(null);
      setSuccess('Member updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSavingMember(false);
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'superadmin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'r5': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'r4': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  const canCreateUsers = isR5() || isSuperadmin() || (profile?.role === 'r4' && profile.can_edit_alliance);
  const canSetR4Role = isR5() || isSuperadmin();
  const canEditMembers = isR5() || isSuperadmin();

  if (authLoading || roleLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile?.alliance_id) {
    return (
      <div className="py-8">
        <div className="glass-card rounded-xl border border-slate-800/80 p-12 text-center">
          <p className="text-slate-400">You are not assigned to an alliance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <Link href="/alliance" className="text-slate-400 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Alliance
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Alliance Members</h1>
          <p className="text-slate-400">{members.length} members total</p>
        </div>
        {canCreateUsers && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary w-full sm:w-auto justify-center px-4 sm:px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <p className="text-emerald-400">{success}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="glass-card rounded-xl border border-slate-800/80 p-4 sm:p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Member</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={newUser.display_name}
                  onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                  placeholder="In-game name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Profile['role'] })}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                >
                  {canSetR4Role && <option value="r4">R4 (Officer)</option>}
                  <option value="member">Member</option>
                </select>
              </div>
            </div>
            {newUser.role === 'r4' && (isR5() || isSuperadmin()) && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUser.can_edit_alliance}
                  onChange={(e) => setNewUser({ ...newUser, can_edit_alliance: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-sky-500"
                />
                <span className="text-slate-300">Can Edit Alliance Info</span>
              </label>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="w-full sm:flex-1 px-4 py-3 text-center text-slate-400 hover:text-white border border-slate-700/50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="w-full sm:flex-1 btn-primary px-4 py-3 rounded-xl text-white font-bold disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4 xl:hidden">
        {members.map((member) => (
          <div key={`card-${member.id}`} className="glass-card rounded-xl border border-slate-800/80 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="font-medium text-white truncate">{member.display_name}</p>
                <p className="text-xs text-slate-500">Joined {new Date(member.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium border ${getRoleBadgeColor(member.role)}`}>
                {member.role}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
              <div className="rounded-lg bg-slate-900/30 border border-slate-800/60 p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Stats</p>
                <p className="text-slate-300">HQ {member.hq_level}</p>
                <p className="text-slate-500">{member.power.toLocaleString()} power</p>
              </div>

              <div className="rounded-lg bg-slate-900/30 border border-slate-800/60 p-3">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-2">Edit Permission</p>
                {member.role === 'r4' ? (
                  (isR5() || isSuperadmin()) ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.can_edit_alliance}
                        onChange={(e) => handleUpdatePermission(member.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-sky-500"
                      />
                      <span className="text-sm text-slate-400">
                        {member.can_edit_alliance ? 'Yes' : 'No'}
                      </span>
                    </label>
                  ) : (
                    <span className={`text-sm font-medium ${member.can_edit_alliance ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {member.can_edit_alliance ? 'Yes' : 'No'}
                    </span>
                  )
                ) : (
                  <span className="text-sm text-slate-500">-</span>
                )}
              </div>
            </div>

            {canEditMembers && member.role !== 'superadmin' && member.id !== profile?.id && (
              <button
                onClick={() => openEditModal(member)}
                className="w-full sm:w-auto text-sky-400 hover:text-sky-300 text-sm font-medium flex items-center justify-center gap-2 border border-sky-500/20 rounded-xl px-4 py-2.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Member
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="hidden xl:block glass-card rounded-xl border border-slate-800/80 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Member</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Stats</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Edit Permission</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-slate-900/30 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{member.display_name}</p>
                    <p className="text-xs text-slate-500">Joined {new Date(member.created_at).toLocaleDateString()}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getRoleBadgeColor(member.role)}`}>
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="text-slate-300">HQ {member.hq_level}</p>
                    <p className="text-slate-500">{member.power.toLocaleString()} power</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {member.role === 'r4' ? (
                    (isR5() || isSuperadmin()) ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.can_edit_alliance}
                          onChange={(e) => handleUpdatePermission(member.id, e.target.checked)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-sky-500"
                        />
                        <span className="text-sm text-slate-400">
                          {member.can_edit_alliance ? 'Yes' : 'No'}
                        </span>
                      </label>
                    ) : (
                      <span className={`text-sm font-medium ${member.can_edit_alliance ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {member.can_edit_alliance ? 'Yes' : 'No'}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-slate-500">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {canEditMembers && member.role !== 'superadmin' && member.id !== profile?.id && (
                    <button
                      onClick={() => openEditModal(member)}
                      className="text-sky-400 hover:text-sky-300 text-sm font-medium flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingMember(null)} />
          <div className="relative glass-card rounded-xl border border-slate-800/80 p-4 sm:p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">Edit Member</h2>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  maxLength={50}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">HQ Level (1-35)</label>
                  <input
                  type="number"
                  value={editForm.hq_level}
                  onChange={(e) => setEditForm({ ...editForm, hq_level: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={35}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Power Level</label>
                  <input
                    type="number"
                    value={editForm.power}
                    onChange={(e) => setEditForm({ ...editForm, power: parseInt(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes <span className="text-slate-500">(Optional)</span></label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setEditingMember(null)}
                className="w-full sm:flex-1 px-4 py-3 text-center text-slate-400 hover:text-white border border-slate-700/50 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMember}
                disabled={savingMember}
                className="w-full sm:flex-1 btn-primary px-4 py-3 rounded-xl text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingMember ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

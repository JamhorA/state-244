'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { Profile, Alliance } from '@/types';

export default function UsersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isSuperadmin, loading: roleLoading } = useRole();
  const [users, setUsers] = useState<Profile[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [presidentId, setPresidentId] = useState<string | null>(null);
  const [assigningPresident, setAssigningPresident] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin/users');
      } else if (!isSuperadmin()) {
        router.replace('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, isSuperadmin, router]);

  async function fetchData() {
    try {
      const [usersRes, alliancesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('alliances')
          .select('*')
          .order('rank'),
      ]);

      if (usersRes.data) {
        setUsers(usersRes.data);
        const president = usersRes.data.find(u => u.is_president);
        setPresidentId(president?.id || null);
      }
      if (alliancesRes.data) setAlliances(alliancesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(userId: string, role: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      return;
    }

    setUsers(users.map(u => u.id === userId ? { ...u, role: role as Profile['role'] } : u));
    setEditingUser(null);
  }

  async function handleUpdateAlliance(userId: string, allianceId: string | null) {
    const { error } = await supabase
      .from('profiles')
      .update({ alliance_id: allianceId })
      .eq('id', userId);

    if (error) {
      console.error('Error updating alliance:', error);
      return;
    }

    setUsers(users.map(u => u.id === userId ? { ...u, alliance_id: allianceId } : u));
  }

  async function handleUpdateEditPermission(userId: string, canEdit: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ can_edit_alliance: canEdit })
      .eq('id', userId);

    if (error) {
      console.error('Error updating permission:', error);
      return;
    }

    setUsers(users.map(u => u.id === userId ? { ...u, can_edit_alliance: canEdit } : u));
  }

  async function handleAssignPresident(userId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setAssigningPresident(userId);

    try {
      const response = await fetch('/api/admin/president', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Error assigning president:', data.error);
        return;
      }

      setUsers(users.map(u => ({
        ...u,
        is_president: u.id === userId,
      })));
      setPresidentId(userId);
    } catch (error) {
      console.error('Error assigning president:', error);
    } finally {
      setAssigningPresident(null);
    }
  }

  async function handleRemovePresident() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setAssigningPresident(presidentId);

    try {
      const response = await fetch('/api/admin/president', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Error removing president:', data.error);
        return;
      }

      setUsers(users.map(u => ({
        ...u,
        is_president: false,
      })));
      setPresidentId(null);
    } catch (error) {
      console.error('Error removing president:', error);
    } finally {
      setAssigningPresident(null);
    }
  }

  function getAllianceName(allianceId: string | null) {
    if (!allianceId) return 'None';
    const alliance = alliances.find(a => a.id === allianceId);
    return alliance?.name || 'Unknown';
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'superadmin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'r5': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'r4': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  if (authLoading || roleLoading || loading || !isAuthenticated || !isSuperadmin()) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-slate-400">Manage user roles and permissions</p>
        </div>
        <Link
          href="/admin/users/create"
          className="btn-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create User
        </Link>
      </div>

      {presidentId && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <p className="text-amber-400 font-medium">Current President</p>
              <p className="text-sm text-slate-400">
                {users.find(u => u.id === presidentId)?.display_name} ({users.find(u => u.id === presidentId)?.role?.toUpperCase()})
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">President</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Alliance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Edit Permission</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.is_president && <span className="text-xl">👑</span>}
                      <div>
                        <p className="font-medium text-white">{user.display_name}</p>
                        <p className="text-sm text-slate-500">HQ {user.hq_level} | {user.power.toLocaleString()} power</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        onBlur={() => setEditingUser(null)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
                        autoFocus
                      >
                        <option value="superadmin">Superadmin</option>
                        <option value="r5">R5</option>
                        <option value="r4">R4</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingUser(user.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${getRoleBadgeColor(user.role)}`}
                      >
                        {user.role}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {(user.role === 'r5' || user.role === 'r4') ? (
                      user.is_president ? (
                        <button
                          onClick={handleRemovePresident}
                          disabled={assigningPresident !== null}
                          className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                        >
                          {assigningPresident === user.id ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            '👑 President'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAssignPresident(user.id)}
                          disabled={assigningPresident !== null}
                          className="px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 text-slate-400 rounded-lg text-sm font-medium hover:bg-slate-700 hover:text-slate-300 transition-colors disabled:opacity-50"
                        >
                          {assigningPresident === user.id ? (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            'Assign'
                          )}
                        </button>
                      )
                    ) : (
                      <span className="text-slate-600 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.alliance_id || ''}
                      onChange={(e) => handleUpdateAlliance(user.id, e.target.value || null)}
                      className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="">No Alliance</option>
                      {alliances.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={user.can_edit_alliance}
                        onChange={(e) => handleUpdateEditPermission(user.id, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
                        disabled={user.role !== 'r4'}
                      />
                      <span className={`text-sm ${user.role !== 'r4' ? 'text-slate-600' : 'text-slate-400'}`}>
                        {user.can_edit_alliance ? 'Yes' : 'No'}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

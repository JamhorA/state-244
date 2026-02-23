'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { Alliance, UserRole } from '@/types';

export default function CreateUserPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isSuperadmin, profile, loading: roleLoading } = useRole();
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    display_name: '',
    role: 'member' as UserRole,
    alliance_id: '',
    can_edit_alliance: false,
  });

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin/users/create');
      } else if (!isSuperadmin() && profile?.role !== 'r5' && !(profile?.role === 'r4' && profile.can_edit_alliance)) {
        router.replace('/dashboard');
      } else {
        fetchAlliances();
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, isSuperadmin, profile, router]);

  async function fetchAlliances() {
    try {
      const { data } = await supabase
        .from('alliances')
        .select('*')
        .order('rank');
      if (data) setAlliances(data);
    } catch (error) {
      console.error('Error fetching alliances:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          alliance_id: formData.alliance_id || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(`User "${formData.display_name}" created successfully!`);
      setFormData({
        email: '',
        password: '',
        display_name: '',
        role: 'member',
        alliance_id: '',
        can_edit_alliance: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  const isSuperAdminUser = isSuperadmin();
  const canChooseRole = isSuperAdminUser || profile?.role === 'r5';
  const canChooseAlliance = isSuperAdminUser;

  if (authLoading || roleLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <Link href="/admin/users" className="text-slate-400 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Create User</h1>
        <p className="text-slate-400">Create a new user account</p>
      </div>

      <div className="max-w-2xl">
        <div className="glass-card rounded-xl border border-slate-800/80 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  placeholder="user@example.com"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  placeholder="Min 6 characters"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  required
                  maxLength={50}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
                  placeholder="In-game name"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                  Role <span className="text-red-400">*</span>
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  disabled={!canChooseRole || submitting}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-50"
                >
                  {isSuperAdminUser && <option value="superadmin">Superadmin</option>}
                  {(isSuperAdminUser) && <option value="r5">R5 (Alliance Leader)</option>}
                  {(isSuperAdminUser || profile?.role === 'r5') && <option value="r4">R4 (Officer)</option>}
                  <option value="member">Member</option>
                </select>
                {!canChooseRole && (
                  <p className="mt-1 text-xs text-slate-500">You can only create member accounts</p>
                )}
              </div>

              <div>
                <label htmlFor="alliance_id" className="block text-sm font-medium text-slate-300 mb-2">
                  Alliance
                </label>
                <select
                  id="alliance_id"
                  value={formData.alliance_id}
                  onChange={(e) => setFormData({ ...formData, alliance_id: e.target.value })}
                  disabled={!canChooseAlliance || submitting}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all disabled:opacity-50"
                >
                  <option value="">No Alliance</option>
                  {alliances.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {!canChooseAlliance && (
                  <p className="mt-1 text-xs text-slate-500">Users will be assigned to your alliance</p>
                )}
              </div>

              {formData.role === 'r4' && (
                <div className="flex items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.can_edit_alliance}
                      onChange={(e) => setFormData({ ...formData, can_edit_alliance: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
                      disabled={submitting}
                    />
                    <span className="text-slate-300">Can Edit Alliance Info</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-800/80">
              <Link
                href="/admin/users"
                className="px-6 py-3 text-slate-400 font-medium hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    Create User
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

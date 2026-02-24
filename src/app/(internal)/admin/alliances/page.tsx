'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { Alliance } from '@/types';

export default function AdminAlliancesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isSuperadmin, loading: roleLoading } = useRole();
  const isSuperadminUser = isSuperadmin();
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin/alliances');
      } else if (!isSuperadminUser) {
        router.replace('/dashboard');
      } else {
        fetchAlliances();
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, isSuperadminUser, router]);

  async function fetchAlliances() {
    try {
      const { data, error } = await supabase
        .from('alliances')
        .select('*')
        .order('rank', { ascending: true });

      if (error) throw error;
      setAlliances(data || []);
    } catch (error) {
      console.error('Error fetching alliances:', error);
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || roleLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/admin" className="text-slate-400 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Alliances</h1>
          <p className="text-slate-400">Overview of all alliance records in the system</p>
        </div>
        <div className="text-sm text-slate-400">
          Total: <span className="text-white font-semibold">{alliances.length}</span>
        </div>
      </div>

      <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <p className="text-amber-300 text-sm">
          Alliance content is typically edited by alliance leaders in <code className="text-amber-200">/alliance/settings</code>. This page provides a superadmin overview.
        </p>
      </div>

      <div className="glass-card rounded-xl border border-slate-800/80 overflow-hidden">
        {alliances.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400">No alliances found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/60 border-b border-slate-800">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Recruitment</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alliances.map((alliance) => (
                  <tr key={alliance.id} className="border-b border-slate-800/60 last:border-0">
                    <td className="px-4 py-4 text-white font-semibold">#{alliance.rank}</td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white font-medium">{alliance.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[320px]">
                          {alliance.description || 'No description'}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs ${
                        alliance.recruitment_status === 'open'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : alliance.recruitment_status === 'invite_only'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-700/60 text-slate-300'
                      }`}>
                        {alliance.recruitment_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-400">
                      {alliance.contact_info || '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/alliances/${alliance.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs bg-sky-500/10 text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                        >
                          Public Profile
                        </Link>
                        <Link
                          href={`/admin/alliances/${alliance.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                        >
                          Edit
                        </Link>
                        <Link
                          href="/applications"
                          className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
                        >
                          Applications
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

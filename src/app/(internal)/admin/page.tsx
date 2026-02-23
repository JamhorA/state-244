'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isSuperadmin, loading: roleLoading } = useRole();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin');
      } else if (!isSuperadmin()) {
        router.replace('/dashboard');
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, isSuperadmin, router]);

  if (authLoading || roleLoading || !isAuthenticated || !isSuperadmin()) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Manage users, alliances, and state information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/users"
          className="glass-card rounded-xl p-6 border border-slate-800/80 hover:border-sky-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white group-hover:text-sky-400 transition-colors">
                User Management
              </h2>
              <p className="text-sm text-slate-400">Create and manage user accounts</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/alliances"
          className="glass-card rounded-xl p-6 border border-slate-800/80 hover:border-amber-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                Alliances
              </h2>
              <p className="text-sm text-slate-400">Manage all alliance data</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/state-info"
          className="glass-card rounded-xl p-6 border border-slate-800/80 hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                State Info
              </h2>
              <p className="text-sm text-slate-400">Edit state story and rules</p>
            </div>
          </div>
        </Link>

        <Link
          href="/applications"
          className="glass-card rounded-xl p-6 border border-slate-800/80 hover:border-purple-500/50 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                All Applications
              </h2>
              <p className="text-sm text-slate-400">View migration applications</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

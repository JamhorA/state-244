'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { Alliance, Profile, MigrationApplication } from '@/types';

export default function AlliancePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, isOfficer, isR5, isSuperadmin, canEditAlliance, loading: roleLoading } = useRole();
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [applications, setApplications] = useState<MigrationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !roleLoading && !dataFetchedRef.current) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/alliance');
      } else if (!isOfficer()) {
        router.replace('/dashboard');
      } else if (profile?.alliance_id) {
        dataFetchedRef.current = true;
        fetchData();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, profile, router]);

  async function fetchData() {
    if (!profile?.alliance_id) return;

    try {
      const [allianceRes, membersRes, appsRes] = await Promise.all([
        supabase
          .from('alliances')
          .select('*')
          .eq('id', profile.alliance_id)
          .single(),
        supabase
          .from('profiles')
          .select('*')
          .eq('alliance_id', profile.alliance_id)
          .order('role'),
        supabase
          .from('migration_applications')
          .select('*')
          .eq('target_alliance_id', profile.alliance_id)
          .order('submitted_at', { ascending: false })
          .limit(5),
      ]);

      if (allianceRes.data) setAlliance(allianceRes.data);
      if (membersRes.data) setMembers(membersRes.data);
      if (appsRes.data) setApplications(appsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  if (!profile?.alliance_id) {
    return (
      <div className="py-8">
        <div className="glass-card rounded-xl border border-slate-800/80 p-12 text-center">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-xl font-semibold text-white mb-2">No Alliance</h2>
          <p className="text-slate-400">You are not assigned to an alliance yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {alliance?.name || 'Alliance'} Management
        </h1>
        <p className="text-slate-400">
          Rank #{alliance?.rank} | Status: 
          <span className={`ml-2 px-2 py-1 rounded text-sm ${
            alliance?.recruitment_status === 'open' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : alliance?.recruitment_status === 'invite_only'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-slate-500/20 text-slate-400'
          }`}>
            {alliance?.recruitment_status?.replace('_', ' ')}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-card rounded-xl border border-slate-800/80 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{members.length}</p>
              <p className="text-sm text-slate-400">Members</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-slate-800/80 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{applications.filter(a => a.status === 'submitted').length}</p>
              <p className="text-sm text-slate-400">Pending Applications</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-slate-800/80 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{applications.filter(a => a.status === 'approved').length}</p>
              <p className="text-sm text-slate-400">Approved</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Link
          href="/alliance/members"
          className="glass-card rounded-xl border border-slate-800/80 p-6 hover:border-sky-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white group-hover:text-sky-400 transition-colors">
                  Members
                </h2>
                <p className="text-sm text-slate-400">View and manage alliance members</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {canEditAlliance() && (
          <Link
            href="/alliance/settings"
            className="glass-card rounded-xl border border-slate-800/80 p-6 hover:border-amber-500/50 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-amber-400 transition-colors">
                    Settings
                  </h2>
                  <p className="text-sm text-slate-400">Edit alliance info and recruitment</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        <Link
          href="/applications"
          className="glass-card rounded-xl border border-slate-800/80 p-6 hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  Applications
                </h2>
                <p className="text-sm text-slate-400">Review migration applications</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}

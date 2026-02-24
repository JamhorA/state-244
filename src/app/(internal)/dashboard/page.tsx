'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { ensureProfile } from '@/lib/profiles';
import { supabase } from '@/lib/supabase';
import type { Profile, StateInfoProposal } from '@/types';

interface ProposalWithDetails extends StateInfoProposal {
  proposer_name?: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: roleLoading, isSuperadmin, isOfficer, isR5, isPresident } = useRole();
  const [localProfile, setLocalProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', hq_level: 1, power: 0, notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingProposals, setPendingProposals] = useState<ProposalWithDetails[]>([]);
  const [pendingPresidentApps, setPendingPresidentApps] = useState<number>(0);
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const userProfile = await ensureProfile(user.id, {
          email: user.email,
          displayName: user.user_metadata?.display_name as string | undefined,
        });
        setLocalProfile(userProfile);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  useEffect(() => {
    async function fetchPendingProposals() {
      if (!isR5() && !isSuperadmin()) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch('/api/state-info/proposals', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });

        const data = await response.json();
        if (response.ok && data.proposals) {
          const pending = data.proposals.filter((p: ProposalWithDetails) => p.status === 'pending');
          setPendingProposals(pending);
        }
      } catch (error) {
        console.error('Error fetching proposals:', error);
      }
    }

    if (!authLoading && !roleLoading && !dataFetchedRef.current && (isR5() || isSuperadmin())) {
      dataFetchedRef.current = true;
      fetchPendingProposals();
    }
  }, [authLoading, roleLoading, isR5, isSuperadmin]);

  useEffect(() => {
    async function fetchPendingPresidentApps() {
      if (!isPresident()) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();

        const response = await fetch('/api/applications?filter=awaiting_president', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });

        const data = await response.json();
        if (response.ok && data.applications) {
          setPendingPresidentApps(data.applications.length);
        }
      } catch (error) {
        console.error('Error fetching president applications:', error);
      }
    }

    if (!authLoading && !roleLoading && isPresident()) {
      fetchPendingPresidentApps();
    }
  }, [authLoading, roleLoading, isPresident]);

  function openEditModal() {
    const p = profile || localProfile;
    if (p) {
      setEditForm({
        display_name: p.display_name,
        hq_level: p.hq_level,
        power: p.power,
        notes: p.notes || '',
      });
      setError(null);
      setShowEditModal(true);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setLocalProfile(data.profile);
      setShowEditModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || profileLoading || roleLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-slate-800 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-800 rounded-xl" />
            <div className="h-32 bg-slate-800 rounded-xl" />
            <div className="h-32 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const displayProfile = profile || localProfile;

  if (!displayProfile) {
    return (
      <div className="py-8">
        <div className="glass-card rounded-xl border border-slate-800/80 p-12 text-center">
          <p className="text-slate-400">Profile not found. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'superadmin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'r5': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'r4': return 'bg-sky-500/20 text-sky-400 border-sky-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {displayProfile.display_name}
        </h1>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getRoleBadgeColor(displayProfile.role)}`}>
            {displayProfile.role}
          </span>
          {displayProfile.alliance_id && (
            <span className="text-slate-400 text-sm">
              Member of alliance
            </span>
          )}
        </div>
      </div>

      {isSuperadmin() && (
        <div className="mb-8">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-400 text-sm">
                You have superadmin privileges. You can manage all users, alliances, and state information.
              </p>
            </div>
          </div>

          <Link
            href="/admin"
            className="glass-card rounded-xl border border-slate-800/80 p-6 hover:border-red-500/50 transition-all block group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                    Admin Panel
                  </h2>
                  <p className="text-sm text-slate-400">Manage users, alliances, and state info</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      )}

      {/* Pending Proposals Alert */}
      {(isR5() || isSuperadmin()) && pendingProposals.length > 0 && (
        <div className="mb-8">
          <div className="glass-card rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-400 mb-2">
                  {pendingProposals.length} Pending Proposal{pendingProposals.length > 1 ? 's' : ''} Need{pendingProposals.length === 1 ? 's' : ''} Your Vote
                </h3>
                <div className="space-y-2 mb-4">
                  {pendingProposals.slice(0, 3).map((proposal) => (
                    <div key={proposal.id} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300">{proposal.proposed_title}</span>
                      <span className="text-slate-500">by {proposal.proposer_name}</span>
                    </div>
                  ))}
                  {pendingProposals.length > 3 && (
                    <p className="text-xs text-slate-500">+{pendingProposals.length - 3} more</p>
                  )}
                </div>
                <Link
                  href="/state-info/proposals"
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  View All Proposals
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* President Applications Alert */}
      {isPresident() && pendingPresidentApps > 0 && (
        <div className="mb-8">
          <div className="glass-card rounded-xl border border-purple-500/30 bg-purple-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">👑</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">
                  {pendingPresidentApps} Application{pendingPresidentApps > 1 ? 's' : ''} Awaiting Your Final Approval
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  As President, you have the final say on migration applications.
                </p>
                <Link
                  href="/applications?filter=awaiting_president"
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Review Applications
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-card rounded-xl border border-slate-800/80 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{displayProfile.power?.toLocaleString() || 0}</p>
              <p className="text-sm text-slate-400">Power Level</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-slate-800/80 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">HQ {displayProfile.hq_level || 1}</p>
              <p className="text-sm text-slate-400">Headquarters</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl border border-slate-800/80 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{displayProfile.can_edit_alliance ? 'Editor' : 'Member'}</p>
              <p className="text-sm text-slate-400">Permissions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={openEditModal}
          className="glass-card rounded-xl border border-slate-800/80 p-5 hover:border-sky-500/50 transition-all w-full text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-sky-400 transition-colors">Edit Profile</h3>
                <p className="text-xs text-slate-500">Update your display name, HQ level, and power</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-500 group-hover:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </button>

        <Link
          href="/settings/password"
          className="glass-card rounded-xl border border-slate-800/80 p-5 hover:border-sky-500/50 transition-all w-full text-left group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-sky-400 transition-colors">Change Password</h3>
                <p className="text-xs text-slate-500">Update your account password</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-500 group-hover:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      <h2 className="text-xl font-bold text-white mb-4">Quick Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isOfficer() && (
          <Link
            href="/alliance"
            className="glass-card rounded-xl border border-slate-800/80 p-5 hover:border-sky-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-sky-400 transition-colors">Alliance</h3>
                <p className="text-xs text-slate-500">Manage your alliance</p>
              </div>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        {isOfficer() && (
          <Link
            href="/applications"
            className="glass-card rounded-xl border border-slate-800/80 p-5 hover:border-emerald-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">Applications</h3>
                <p className="text-xs text-slate-500">Review migration requests</p>
              </div>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        {(isR5() || isSuperadmin()) && (
          <Link
            href="/state-info/proposals"
            className="glass-card rounded-xl border border-slate-800/80 p-5 hover:border-amber-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">Proposals</h3>
                <p className="text-xs text-slate-500">Vote on state info changes</p>
              </div>
              {pendingProposals.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-amber-500 rounded-full">
                  {pendingProposals.length}
                </span>
              )}
              <svg className="w-4 h-4 text-slate-500 group-hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        <Link
          href="/help"
          className="glass-card rounded-xl border border-slate-800/80 p-5 hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">User Guide</h3>
              <p className="text-xs text-slate-500">Learn how to use the hub</p>
            </div>
            <svg className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <div
          className="glass-card rounded-xl border border-slate-800/80 p-5 opacity-50 cursor-not-allowed relative"
        >
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
              Coming Soon
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-400">Diplomacy Chat</h3>
              <p className="text-xs text-slate-600">Global alliance chat</p>
            </div>
          </div>
        </div>

        <div
          className="glass-card rounded-xl border border-slate-800/80 p-5 opacity-50 cursor-not-allowed relative"
        >
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
              Coming Soon
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-400">AI Image Generator</h3>
              <p className="text-xs text-slate-600">Generate alliance images</p>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="glass-card rounded-xl border border-slate-800/80 p-5 hover:border-slate-600/50 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white group-hover:text-slate-300 transition-colors">Public Site</h3>
              <p className="text-xs text-slate-500">View public pages</p>
            </div>
              <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
          </div>
        </Link>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative glass-card rounded-2xl border border-slate-700/80 p-4 sm:p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

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
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
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
                    Save
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

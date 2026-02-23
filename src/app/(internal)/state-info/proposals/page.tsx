'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { StateInfoProposal, StateInfo, StateInfoVote } from '@/types';

interface ProposalWithDetails extends StateInfoProposal {
  proposer_name?: string;
  votes: (StateInfoVote & { voter?: { display_name: string } })[];
}

export default function ProposalsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isR5, isSuperadmin, loading: roleLoading } = useRole();
  const [proposals, setProposals] = useState<ProposalWithDetails[]>([]);
  const [sections, setSections] = useState<StateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataFetchedRef = useRef(false);

  const [newProposal, setNewProposal] = useState({
    section_key: '',
    proposed_title: '',
    proposed_content: '',
  });

  useEffect(() => {
    if (!authLoading && !roleLoading && !dataFetchedRef.current) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/state-info/proposals');
      } else if (!isR5() && !isSuperadmin()) {
        router.replace('/dashboard');
      } else {
        dataFetchedRef.current = true;
        fetchData();
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, router]);

  async function fetchData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const [proposalsRes, sectionsRes] = await Promise.all([
        fetch('/api/state-info/proposals', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        }),
        fetch('/api/state-info'),
      ]);

      const [proposalsData, sectionsData] = await Promise.all([
        proposalsRes.json(),
        sectionsRes.json(),
      ]);

      if (proposalsData.proposals) setProposals(proposalsData.proposals);
      if (sectionsData.sections) setSections(sectionsData.sections);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProposal(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/state-info/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(newProposal),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create proposal');
      }

      setShowCreateForm(false);
      setNewProposal({ section_key: '', proposed_title: '', proposed_content: '' });
      dataFetchedRef.current = false;
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCreating(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  }

  function getVoteCount(proposal: ProposalWithDetails) {
    const approves = proposal.votes.filter(v => v.vote === 'approve').length;
    const rejects = proposal.votes.filter(v => v.vote === 'reject').length;
    return { approves, rejects };
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">State Info Proposals</h1>
          <p className="text-slate-400">Propose and vote on changes to state information</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary px-6 py-3 rounded-xl text-white font-bold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Proposal
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="glass-card rounded-xl border border-slate-800/80 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Proposal</h2>
          <form onSubmit={handleCreateProposal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Section to Edit</label>
              <select
                value={newProposal.section_key}
                onChange={(e) => {
                  const section = sections.find(s => s.section_key === e.target.value);
                  setNewProposal({
                    ...newProposal,
                    section_key: e.target.value,
                    proposed_title: section?.title || '',
                    proposed_content: section?.content || '',
                  });
                }}
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
              >
                <option value="">Select a section...</option>
                {sections.map(s => (
                  <option key={s.section_key} value={s.section_key}>{s.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Proposed Title</label>
              <input
                type="text"
                value={newProposal.proposed_title}
                onChange={(e) => setNewProposal({ ...newProposal, proposed_title: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Proposed Content</label>
              <textarea
                value={newProposal.proposed_content}
                onChange={(e) => setNewProposal({ ...newProposal, proposed_content: e.target.value })}
                required
                rows={8}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 resize-none"
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn-primary px-6 py-2 rounded-xl text-white font-bold disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Proposal'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="glass-card rounded-xl border border-slate-800/80 p-12 text-center">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-semibold text-white mb-2">No Proposals Yet</h3>
            <p className="text-slate-400">Create the first proposal to change state information.</p>
          </div>
        ) : (
          proposals.map((proposal) => {
            const { approves, rejects } = getVoteCount(proposal);
            return (
              <Link
                key={proposal.id}
                href={`/state-info/proposals/${proposal.id}`}
                className="glass-card rounded-xl border border-slate-800/80 p-6 hover:border-sky-500/50 transition-all block"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                      <span className="text-sm text-slate-500">
                        {proposal.section_key}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{proposal.proposed_title}</h3>
                    <p className="text-sm text-slate-400">
                      Proposed by {proposal.proposer_name} | {new Date(proposal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {approves}
                    </div>
                    {rejects > 0 && (
                      <div className="flex items-center gap-1 text-red-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {rejects}
                      </div>
                    )}
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl">
        <h3 className="font-semibold text-white mb-2">How Voting Works</h3>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>Proposals need at least <span className="text-amber-400">2 approve votes</span> to pass</li>
          <li>A single <span className="text-red-400">reject vote</span> will reject the proposal</li>
          <li>Each R5 can only vote once per proposal</li>
          <li>Superadmin votes count as immediate approval</li>
        </ul>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { StateInfoProposal, StateInfoVote } from '@/types';

interface ProposalWithDetails extends StateInfoProposal {
  proposer_name?: string;
  votes: (StateInfoVote & { voter?: { display_name: string } })[];
}

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, isR5, isSuperadmin, loading: roleLoading } = useRole();
  const [proposal, setProposal] = useState<ProposalWithDetails | null>(null);
  const [currentContent, setCurrentContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataFetchedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !roleLoading && !dataFetchedRef.current) {
      if (!isAuthenticated) {
        router.replace(`/login?redirect=/state-info/proposals/${resolvedParams.id}`);
      } else if (!isR5() && !isSuperadmin()) {
        router.replace('/dashboard');
      } else {
        dataFetchedRef.current = true;
        fetchProposal();
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, router, resolvedParams.id]);

  async function fetchProposal() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/state-info/proposals', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      
      if (data.proposals) {
        const found = data.proposals.find((p: ProposalWithDetails) => p.id === resolvedParams.id);
        if (found) {
          setProposal(found);
          
          const stateInfoRes = await fetch('/api/state-info');
          const stateInfoData = await stateInfoRes.json();
          
          if (stateInfoData.sections) {
            const currentSection = stateInfoData.sections.find(
              (s: { section_key: string }) => s.section_key === found.section_key
            );
            setCurrentContent(currentSection?.content || null);
          }
        } else {
          router.replace('/state-info/proposals');
        }
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(vote: 'approve' | 'reject') {
    if (!proposal || !profile) return;

    setError(null);
    setVoting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/state-info/proposals/${proposal.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ vote }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      dataFetchedRef.current = false;
      fetchProposal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setVoting(false);
    }
  }

  function hasVoted(): boolean {
    if (!proposal || !profile) return false;
    return proposal.votes.some(v => v.voter_id === profile.id);
  }

  function getUserVote(): 'approve' | 'reject' | null {
    if (!proposal || !profile) return null;
    const vote = proposal.votes.find(v => v.voter_id === profile.id);
    return vote?.vote || null;
  }

  function getApproveCount(): number {
    return proposal?.votes.filter(v => v.vote === 'approve').length || 0;
  }

  function getRejectCount(): number {
    return proposal?.votes.filter(v => v.vote === 'reject').length || 0;
  }

  if (authLoading || roleLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="py-8">
        <div className="glass-card rounded-xl border border-slate-800/80 p-12 text-center">
          <p className="text-slate-400">Proposal not found</p>
        </div>
      </div>
    );
  }

  const voted = hasVoted();
  const userVote = getUserVote();

  return (
    <div className="py-8">
      <Link href="/state-info/proposals" className="text-slate-400 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Proposals
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${
            proposal.status === 'approved' 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
              : proposal.status === 'rejected'
              ? 'bg-red-500/20 text-red-400 border-red-500/30'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            {proposal.status}
          </span>
          <span className="text-sm text-slate-500">{proposal.section_key}</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{proposal.proposed_title}</h1>
        <p className="text-slate-400">
          Proposed by {proposal.proposer_name} on {new Date(proposal.created_at).toLocaleDateString()}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl border border-slate-800/80 p-4">
              <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">Current Version</h2>
              <pre className="whitespace-pre-wrap text-slate-500 text-sm font-mono bg-slate-900/30 rounded-lg p-4 min-h-[200px]">
                {currentContent || '(No existing content)'}
              </pre>
            </div>
            <div className="glass-card rounded-xl border border-amber-500/30 p-4 bg-amber-500/5">
              <h2 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wide">Proposed Version</h2>
              <pre className="whitespace-pre-wrap text-slate-300 text-sm font-mono bg-slate-900/30 rounded-lg p-4 min-h-[200px]">
                {proposal.proposed_content}
              </pre>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl border border-slate-800/80 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Votes</h2>
            
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-2xl font-bold">{getApproveCount()}</span>
                </div>
                <p className="text-sm text-slate-500">Approve</p>
              </div>
              <div>
                <div className="flex items-center gap-2 text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-2xl font-bold">{getRejectCount()}</span>
                </div>
                <p className="text-sm text-slate-500">Reject</p>
              </div>
            </div>

            {proposal.votes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Voters</p>
                {proposal.votes.map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{vote.voter?.display_name || 'Unknown'}</span>
                    <span className={vote.vote === 'approve' ? 'text-emerald-400' : 'text-red-400'}>
                      {vote.vote}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {proposal.status === 'pending' && (
            <div className="glass-card rounded-xl border border-slate-800/80 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Cast Your Vote</h2>
              
              {voted ? (
                <div className="text-center py-4">
                  <p className="text-slate-400 mb-2">You voted</p>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                    userVote === 'approve' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {userVote === 'approve' ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </>
                    )}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleVote('approve')}
                    disabled={voting}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    {voting ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleVote('reject')}
                    disabled={voting}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {voting ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </>
                    )}
                  </button>
                </div>
              )}

              <p className="mt-4 text-xs text-slate-500 text-center">
                {getApproveCount()}/2 approvals needed to pass
              </p>
            </div>
          )}

          {proposal.status !== 'pending' && (
            <div className={`p-4 rounded-xl ${
              proposal.status === 'approved' 
                ? 'bg-emerald-500/10 border border-emerald-500/20' 
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <p className={`text-sm ${proposal.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                {proposal.status === 'approved' 
                  ? 'This proposal was approved and changes have been applied.' 
                  : 'This proposal was rejected.'}
              </p>
              {proposal.resolved_at && (
                <p className="text-xs text-slate-500 mt-1">
                  Resolved on {new Date(proposal.resolved_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

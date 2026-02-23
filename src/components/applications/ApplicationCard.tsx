'use client';

import { useState } from 'react';
import type { MigrationApplication, ApprovalStageStatus } from '@/types';
import { StatusBadge } from './StatusBadge';

interface ApplicationWithDetails extends MigrationApplication {
  target_alliance?: { id: string; name: string } | null;
  alliance_reviewer?: { id: string; display_name: string } | null;
  president_reviewer?: { id: string; display_name: string } | null;
}

interface ApplicationCardProps {
  application: ApplicationWithDetails;
  onApprove: (id: string, stage: 'alliance' | 'president', decision: 'approve' | 'reject', note?: string) => Promise<{ success: boolean }>;
  canApproveAlliance: boolean;
  canApprovePresident: boolean;
  showAlliance?: boolean;
  userAllianceId?: string;
  isStateAdmin?: boolean;
  onClick?: () => void;
}

export function ApplicationCard({ 
  application, 
  onApprove, 
  canApproveAlliance, 
  canApprovePresident,
  showAlliance = false,
  userAllianceId,
  isStateAdmin = false,
  onClick
}: ApplicationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [allianceNote, setAllianceNote] = useState('');
  const [presidentNote, setPresidentNote] = useState('');

  const canApproveThisAlliance = canApproveAlliance && (isStateAdmin || application.target_alliance_id === userAllianceId);

  const handleApproval = async (stage: 'alliance' | 'president', decision: 'approve' | 'reject') => {
    setIsUpdating(true);
    setUpdateError(null);
    
    try {
      const note = stage === 'alliance' ? allianceNote : presidentNote;
      const result = await onApprove(application.id, stage, decision, note || undefined);
      
      if (!result.success) {
        setUpdateError('Failed to update');
      }
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: ApprovalStageStatus) => {
    switch (status) {
      case 'approved':
        return (
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getStatusColor = (status: ApprovalStageStatus) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-slate-800/50 border-slate-700/50';
    }
  };

  return (
    <div className="glass-card rounded-xl border border-slate-800/80 p-6">
      {updateError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{updateError}</p>
        </div>
      )}

      {/* Header */}
      <div 
        className="flex items-start justify-between mb-4 cursor-pointer group"
        onClick={onClick}
      >
        <div>
          <h3 className="font-semibold text-white text-lg group-hover:text-sky-400 transition-colors flex items-center gap-2">
            {application.player_name}
            <svg className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </h3>
          <p className="text-sm text-slate-400">
            {application.current_server} • Power: {application.power_level?.toLocaleString() || 0}
          </p>
          {showAlliance && application.target_alliance && (
            <p className="text-xs text-sky-400 mt-1">
              Target: {application.target_alliance.name}
            </p>
          )}
        </div>
        <StatusBadge status={application.status} />
      </div>

      {/* Player Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-slate-900/30 rounded-lg">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">HQ Level</p>
          <p className="text-white font-medium">{application.hq_level}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Submitted</p>
          <p className="text-white font-medium">
            {new Date(application.submitted_at).toLocaleDateString()}
          </p>
        </div>
        {application.troop_level && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Troops</p>
            <p className="text-white font-medium">{application.troop_level}</p>
          </div>
        )}
        {application.arena_power && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Arena</p>
            <p className="text-white font-medium">{application.arena_power}</p>
          </div>
        )}
      </div>

      {/* Motivation */}
      <div className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Motivation</p>
        <p className="text-slate-300 text-sm bg-slate-900/30 p-3 rounded-lg">
          {application.motivation}
        </p>
      </div>

      {/* Approval Stages */}
      <div className="space-y-4">
        {/* Alliance Approval */}
        <div className={`p-4 rounded-lg border ${getStatusColor(application.alliance_status)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(application.alliance_status)}
              <span className="font-medium text-white">Alliance Approval</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              application.alliance_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
              application.alliance_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-700 text-slate-400'
            }`}>
              {application.alliance_status}
            </span>
          </div>

          {application.alliance_status !== 'pending' ? (
            <div className="text-sm text-slate-400">
              <p>
                By: {application.alliance_reviewer?.display_name || 'Unknown'} • 
                {application.alliance_reviewed_at && new Date(application.alliance_reviewed_at).toLocaleDateString()}
              </p>
              {application.alliance_note && (
                <p className="mt-2 italic text-slate-500">"{application.alliance_note}"</p>
              )}
            </div>
          ) : canApproveThisAlliance ? (
            <div className="space-y-3">
              <textarea
                value={allianceNote}
                onChange={(e) => setAllianceNote(e.target.value)}
                placeholder="Optional note about this decision..."
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500/50 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproval('alliance', 'approve')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApproval('alliance', 'reject')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Awaiting alliance review...</p>
          )}
        </div>

        {/* President Approval */}
        <div className={`p-4 rounded-lg border ${getStatusColor(application.president_status)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(application.president_status)}
              <span className="font-medium text-white">President Approval</span>
              <span className="text-amber-400">👑</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              application.president_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
              application.president_status === 'rejected' ? 'bg-red-500/20 text-red-400' :
              'bg-slate-700 text-slate-400'
            }`}>
              {application.president_status}
            </span>
          </div>

          {application.president_status !== 'pending' ? (
            <div className="text-sm text-slate-400">
              <p>
                By: {application.president_reviewer?.display_name || 'Unknown'} • 
                {application.president_reviewed_at && new Date(application.president_reviewed_at).toLocaleDateString()}
              </p>
              {application.president_note && (
                <p className="mt-2 italic text-slate-500">"{application.president_note}"</p>
              )}
            </div>
          ) : application.alliance_status === 'approved' && canApprovePresident ? (
            <div className="space-y-3">
              <textarea
                value={presidentNote}
                onChange={(e) => setPresidentNote(e.target.value)}
                placeholder="Optional note about this decision..."
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500/50 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleApproval('president', 'approve')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleApproval('president', 'reject')}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : application.alliance_status !== 'approved' ? (
            <p className="text-sm text-slate-500">Waiting for alliance approval first...</p>
          ) : (
            <p className="text-sm text-slate-500">Awaiting president review...</p>
          )}
        </div>
      </div>
    </div>
  );
}

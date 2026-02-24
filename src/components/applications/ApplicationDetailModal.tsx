'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MigrationApplication, ApprovalStageStatus } from '@/types';
import { StatusBadge } from './StatusBadge';

interface ApplicationWithDetails extends MigrationApplication {
  target_alliance?: { id: string; name: string } | null;
  alliance_reviewer?: { id: string; display_name: string } | null;
  president_reviewer?: { id: string; display_name: string } | null;
}

interface ApplicationDetailModalProps {
  application: ApplicationWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, stage: 'alliance' | 'president', decision: 'approve' | 'reject', note?: string) => Promise<{ success: boolean }>;
  canApproveAlliance: boolean;
  canApprovePresident: boolean;
  userAllianceId?: string;
  isStateAdmin?: boolean;
}

const appDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'numeric',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatAppDate(dateString: string) {
  return appDateFormatter.format(new Date(dateString));
}

export function ApplicationDetailModal({
  application,
  isOpen,
  onClose,
  onApprove,
  canApproveAlliance,
  canApprovePresident,
  userAllianceId,
  isStateAdmin = false
}: ApplicationDetailModalProps) {
  const [allianceNote, setAllianceNote] = useState('');
  const [presidentNote, setPresidentNote] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const canApproveThisAlliance = canApproveAlliance && (isStateAdmin || application.target_alliance_id === userAllianceId);
  const screenshots = application.screenshots?.filter(Boolean) || [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else {
          onClose();
        }
      }
      if (lightboxIndex !== null) {
        if (e.key === 'ArrowLeft' && lightboxIndex > 0) {
          setLightboxIndex(lightboxIndex - 1);
        }
        if (e.key === 'ArrowRight' && lightboxIndex < screenshots.length - 1) {
          setLightboxIndex(lightboxIndex + 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxIndex, screenshots.length, onClose]);

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

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-slate-900 border-b border-slate-700/80 p-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-white">Application Details</h2>
            <div className="flex items-center gap-3">
              <StatusBadge status={application.status} />
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {updateError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{updateError}</p>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">{application.player_name}</h3>
                <p className="text-slate-400 mt-1">
                  {application.current_server} • Power: {application.power_level?.toLocaleString() || 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-800/30 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">HQ Level</p>
                <p className="text-white font-medium text-lg">{application.hq_level}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Current Alliance</p>
                <p className="text-white font-medium text-lg">{application.current_alliance || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Target Alliance</p>
                <p className="text-sky-400 font-medium text-lg">{application.target_alliance?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Troop Level</p>
                <p className="text-white font-medium text-lg">{application.troop_level || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Arena Power</p>
                <p className="text-white font-medium text-lg">{application.arena_power || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Duel Points</p>
                <p className="text-white font-medium text-lg">{application.duel_points || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">SVS Participation</p>
                <p className="text-white font-medium text-lg">{application.svs_participation || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Submitted</p>
                <p className="text-white font-medium text-lg">
                  {formatAppDate(application.submitted_at)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Motivation</p>
              <p className="text-slate-300 bg-slate-800/30 p-4 rounded-xl whitespace-pre-wrap">
                {application.motivation}
              </p>
            </div>

            {screenshots.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
                  Screenshots ({screenshots.length})
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {screenshots.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setLightboxIndex(index)}
                      className="aspect-square bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-sky-500/50 transition-colors"
                    >
                      <img
                        src={url}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-slate-700/50">
              <div className={`p-4 rounded-xl border ${getStatusColor(application.alliance_status)}`}>
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
                      {application.alliance_reviewed_at && formatAppDate(application.alliance_reviewed_at)}
                    </p>
                    {application.alliance_note && (
                      <p className="mt-2 italic text-slate-500 bg-slate-900/50 p-2 rounded">"{application.alliance_note}"</p>
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

              <div className={`p-4 rounded-xl border ${getStatusColor(application.president_status)}`}>
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
                      {application.president_reviewed_at && formatAppDate(application.president_reviewed_at)}
                    </p>
                    {application.president_note && (
                      <p className="mt-2 italic text-slate-500 bg-slate-900/50 p-2 rounded">"{application.president_note}"</p>
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
        </div>
      </div>

      {lightboxIndex !== null && screenshots[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-slate-900/50 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {screenshots.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
                }}
                disabled={lightboxIndex === 0}
                className="absolute left-4 p-3 text-white/70 hover:text-white bg-slate-900/50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (lightboxIndex < screenshots.length - 1) setLightboxIndex(lightboxIndex + 1);
                }}
                disabled={lightboxIndex === screenshots.length - 1}
                className="absolute right-4 p-3 text-white/70 hover:text-white bg-slate-900/50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <img
            src={screenshots[lightboxIndex]}
            alt={`Screenshot ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/70 rounded-full text-white/70 text-sm">
            {lightboxIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </>
  );
}

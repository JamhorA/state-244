import type { MigrationApplication, ApprovalStageStatus } from '@/types';
import { ApplicationCard } from './ApplicationCard';

interface ApplicationWithDetails extends MigrationApplication {
  target_alliance?: { id: string; name: string } | null;
  alliance_reviewer?: { id: string; display_name: string } | null;
  president_reviewer?: { id: string; display_name: string } | null;
}

interface ApplicationListProps {
  applications: ApplicationWithDetails[];
  loading?: boolean;
  onApprove: (id: string, stage: 'alliance' | 'president', decision: 'approve' | 'reject', note?: string) => Promise<{ success: boolean }>;
  canApproveAlliance: boolean;
  canApprovePresident: boolean;
  showAlliance?: boolean;
  userAllianceId?: string;
  isStateAdmin?: boolean;
  onCardClick?: (application: ApplicationWithDetails) => void;
}

export function ApplicationList({ 
  applications, 
  loading, 
  onApprove, 
  canApproveAlliance, 
  canApprovePresident,
  showAlliance = false,
  userAllianceId,
  isStateAdmin = false,
  onCardClick
}: ApplicationListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl border border-slate-800/80 p-6 animate-pulse">
            <div className="h-6 bg-slate-800 rounded w-1/3 mb-2"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-800 rounded w-1/2"></div>
              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
              <div className="h-4 bg-slate-800 rounded w-2/3"></div>
            </div>
            <div className="h-8 bg-slate-800 rounded w-full mt-4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-slate-800/80 p-12 text-center">
        <p className="text-slate-400">No applications found.</p>
      </div>
    );
  }

  const getApprovalStage = (app: ApplicationWithDetails): 'submitted' | 'alliance_pending' | 'president_pending' | 'finalized' => {
    if (app.status === 'approved' || app.status === 'rejected') return 'finalized';
    if (app.alliance_status === 'approved' && app.president_status === 'pending') return 'president_pending';
    if (app.alliance_status === 'pending') return 'alliance_pending';
    return 'submitted';
  };

  const groups: Record<string, ApplicationWithDetails[]> = {
    alliance_pending: [],
    president_pending: [],
    finalized: [],
    other: [],
  };

  applications.forEach(app => {
    const stage = getApprovalStage(app);
    if (stage in groups) {
      groups[stage].push(app);
    } else {
      groups.other.push(app);
    }
  });

  return (
    <div className="space-y-8">
      {groups.alliance_pending.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Awaiting Alliance Review ({groups.alliance_pending.length})
          </h2>
          <div className="space-y-4">
            {groups.alliance_pending.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                onApprove={onApprove}
                canApproveAlliance={canApproveAlliance}
                canApprovePresident={canApprovePresident}
                showAlliance={showAlliance}
                userAllianceId={userAllianceId}
                isStateAdmin={isStateAdmin}
                onClick={() => onCardClick?.(app)}
              />
            ))}
          </div>
        </div>
      )}

      {groups.president_pending.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-amber-400">👑</span>
            Awaiting President Review ({groups.president_pending.length})
          </h2>
          <div className="space-y-4">
            {groups.president_pending.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                onApprove={onApprove}
                canApproveAlliance={canApproveAlliance}
                canApprovePresident={canApprovePresident}
                showAlliance={showAlliance}
                userAllianceId={userAllianceId}
                isStateAdmin={isStateAdmin}
                onClick={() => onCardClick?.(app)}
              />
            ))}
          </div>
        </div>
      )}

      {groups.finalized.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Finalized ({groups.finalized.length})
          </h2>
          <div className="space-y-4">
            {groups.finalized.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                onApprove={onApprove}
                canApproveAlliance={canApproveAlliance}
                canApprovePresident={canApprovePresident}
                showAlliance={showAlliance}
                userAllianceId={userAllianceId}
                isStateAdmin={isStateAdmin}
                onClick={() => onCardClick?.(app)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

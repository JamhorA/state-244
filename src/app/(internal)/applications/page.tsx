'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { ApplicationDetailModal } from '@/components/applications/ApplicationDetailModal';
import { useApplications, useApplicationApproval } from '@/hooks/use-applications';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { MigrationApplication } from '@/types';

type FilterType = 'all' | 'awaiting_alliance' | 'awaiting_president' | 'approved' | 'rejected';

interface Alliance {
  id: string;
  name: string;
}

interface ApplicationWithDetails extends MigrationApplication {
  target_alliance?: { id: string; name: string } | null;
  alliance_reviewer?: { id: string; display_name: string } | null;
  president_reviewer?: { id: string; display_name: string } | null;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loading: roleLoading, isPresident, isOfficer, isSuperadmin } = useRole();
  const [filter, setFilter] = useState<FilterType>('all');
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [alliancesLoading, setAlliancesLoading] = useState(true);
  const [allianceId, setAllianceId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const { applications, loading: appsLoading, refresh } = useApplications({ filter, allianceId });
  const { approve, isUpdating, error: updateError } = useApplicationApproval();

  const canViewAll = isPresident() || isSuperadmin();
  const canApproveAlliance = isOfficer() || isSuperadmin();
  const canApprovePresident = isPresident() || isSuperadmin();

  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    
    const query = searchQuery.toLowerCase().trim();
    return applications.filter(app => 
      app.player_name?.toLowerCase().includes(query) ||
      app.current_server?.toLowerCase().includes(query) ||
      app.current_alliance?.toLowerCase().includes(query)
    );
  }, [applications, searchQuery]);

  useEffect(() => {
    async function fetchAlliances() {
      try {
        const { data, error } = await supabase
          .from('alliances')
          .select('id, name')
          .order('name');
        
        if (!error && data) {
          setAlliances(data);
        }
      } catch (err) {
        console.error('Error fetching alliances:', err);
      } finally {
        setAlliancesLoading(false);
      }
    }

    fetchAlliances();
  }, []);

  useEffect(() => {
    if (!roleLoading && profile && !alliancesLoading) {
      if (!canViewAll && profile.alliance_id) {
        setAllianceId(profile.alliance_id);
      }
    }
  }, [roleLoading, profile, alliancesLoading, canViewAll]);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/applications');
      } else if (!isOfficer() && !isSuperadmin() && !isPresident()) {
        router.replace('/dashboard');
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, isOfficer, isSuperadmin, isPresident, router]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleApprove = async (
    applicationId: string, 
    stage: 'alliance' | 'president', 
    decision: 'approve' | 'reject',
    note?: string
  ) => {
    const result = await approve(applicationId, stage, decision, note);
    if (result.success) {
      refresh();
    }
    return result;
  };

  const exportToXLSX = () => {
    const data = filteredApplications.map(app => ({
      'Player Name': app.player_name,
      'Current Server': app.current_server,
      'Power Level': app.power_level,
      'HQ Level': app.hq_level,
      'Target Alliance': app.target_alliance?.name || '',
      'Current Alliance': app.current_alliance || '',
      'Troop Level': app.troop_level || '',
      'Arena Power': app.arena_power || '',
      'Duel Points': app.duel_points || '',
      'SVS Participation': app.svs_participation || '',
      'Alliance Status': app.alliance_status,
      'Alliance Reviewed By': app.alliance_reviewer?.display_name || '',
      'President Status': app.president_status,
      'President Reviewed By': app.president_reviewer?.display_name || '',
      'Status': app.status,
      'Submitted At': app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    const MAX_COL_WIDTH = 15;
    const MIN_COL_WIDTH = 10;
    
    if (data.length > 0) {
      const colWidths = Object.keys(data[0]).map((key, colIndex) => {
        let maxWidth = key.length;
        
        data.forEach(row => {
          const cellValue = String(Object.values(row)[colIndex] || '');
          maxWidth = Math.max(maxWidth, cellValue.length);
        });
        
        const width = Math.min(Math.max(maxWidth + 2, MIN_COL_WIDTH), MAX_COL_WIDTH);
        return { wch: width };
      });
      
      ws['!cols'] = colWidths;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');
    const now = new Date();
    const filename = `applications_${now.toISOString().split('T')[0]}_${now.getHours()}-${String(now.getMinutes()).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'awaiting_alliance', label: 'Awaiting Alliance' },
    { key: 'awaiting_president', label: 'Awaiting President' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Migration Applications
          {canViewAll && <span className="text-amber-400 ml-2">👑 State-wide View</span>}
        </h1>
        <p className="text-slate-400">
          Review all migration applications in the state.
          {!canViewAll && !isSuperadmin() && ' You can only approve/reject applications for your alliance.'}
        </p>
      </div>

      {updateError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400">{updateError}</p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative w-full sm:w-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search player, server, alliance..."
            className="w-full sm:w-64 pl-10 pr-10 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <select
          value={allianceId || ''}
          onChange={(e) => setAllianceId(e.target.value || undefined)}
          className="w-full sm:w-auto px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-sky-500/50 sm:min-w-[200px]"
          disabled={alliancesLoading}
        >
          <option value="">All Alliances</option>
          {alliances.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <button
          onClick={exportToXLSX}
          disabled={appsLoading || filteredApplications.length === 0}
          className="w-full sm:w-auto justify-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Excel ({filteredApplications.length})
        </button>
      </div>

      <ApplicationList
        applications={filteredApplications}
        loading={appsLoading}
        onApprove={handleApprove}
        canApproveAlliance={canApproveAlliance && !isUpdating}
        canApprovePresident={canApprovePresident && !isUpdating}
        showAlliance={true}
        userAllianceId={profile?.alliance_id || undefined}
        isStateAdmin={canViewAll}
        onCardClick={setSelectedApplication}
      />

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onApprove={handleApprove}
          canApproveAlliance={canApproveAlliance && !isUpdating}
          canApprovePresident={canApprovePresident && !isUpdating}
          userAllianceId={profile?.alliance_id || undefined}
          isStateAdmin={canViewAll}
        />
      )}
    </div>
  );
}

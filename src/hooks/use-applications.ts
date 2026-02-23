'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MigrationApplication, ApprovalStageStatus } from '@/types';

interface ApplicationWithDetails extends MigrationApplication {
  target_alliance?: { id: string; name: string } | null;
  alliance_reviewer?: { id: string; display_name: string } | null;
  president_reviewer?: { id: string; display_name: string } | null;
}

interface UseApplicationsOptions {
  initialLoad?: boolean;
  filter?: string;
  allianceId?: string;
}

export function useApplications({ initialLoad = true, filter, allianceId }: UseApplicationsOptions = {}) {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (allianceId) params.append('alliance_id', allianceId);
      
      const url = `/api/applications${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications');
      }

      setApplications(data.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialLoad) {
      fetchApplications();
    }
  }, [initialLoad, filter, allianceId]);

  const refresh = () => fetchApplications();

  return {
    applications,
    loading,
    error,
    refresh,
  };
}

interface ApprovalResult {
  success: boolean;
  application?: ApplicationWithDetails;
  error?: string;
}

export function useApplicationApproval() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = async (
    applicationId: string,
    stage: 'alliance' | 'president',
    decision: 'approve' | 'reject',
    note?: string
  ): Promise<ApprovalResult> => {
    setIsUpdating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ stage, decision, note }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update application');
      }

      return { success: true, application: data.application };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update application';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    approve,
    isUpdating,
    error,
  };
}

import { supabase } from './supabase';
import type { MigrationApplication, ApplicationStatus, ApprovedPlayer } from '@/types';

/**
 * Fetch applications for a specific alliance (R4/R5 only)
 */
export async function fetchAllianceApplications(allianceId: string): Promise<MigrationApplication[]> {
  const { data, error } = await supabase
    .from('migration_applications')
    .select('*')
    .eq('target_alliance_id', allianceId)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    throw new Error('Failed to load applications');
  }

  return data || [];
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('migration_applications')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq('id', applicationId);

  if (error) {
    console.error('Error updating application:', error);
    throw new Error('Failed to update application');
  }
}

/**
 * Get application by ID
 */
export async function getApplicationById(applicationId: string): Promise<MigrationApplication | null> {
  const { data, error } = await supabase
    .from('migration_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching application:', error);
    throw new Error('Failed to load application');
  }

  return data;
}

export async function fetchApprovedApplications(): Promise<ApprovedPlayer[]> {
  const { data, error } = await supabase
    .from('migration_applications')
    .select(`
      id,
      player_name,
      power_level,
      troop_level,
      updated_at,
      target_alliance:alliances!migration_applications_target_alliance_id_fkey(name)
    `)
    .eq('status', 'approved')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching approved applications:', error);
    throw new Error('Failed to load approved players');
  }

  return (data || []).map(app => {
    const alliance = app.target_alliance as unknown as { name: string } | null;
    return {
      id: app.id,
      player_name: app.player_name,
      target_alliance_name: alliance?.name || 'Unknown',
      power_level: app.power_level,
      troop_level: app.troop_level,
      approved_at: app.updated_at,
    };
  });
}

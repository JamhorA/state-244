import { supabase } from './supabase';
import type { Alliance } from '@/types';

/**
 * Fetch Top 3 Alliances
 */
export async function fetchTop3Alliances(): Promise<Alliance[]> {
  const { data, error } = await supabase
    .from('alliances')
    .select('*')
    .order('rank', { ascending: true })
    .limit(3);

  if (error) {
    console.error('Error fetching alliances:', error);
    throw new Error('Failed to load alliances. Please try again.');
  }

  return data || [];
}

/**
 * Fetch All Alliances (for dropdown)
 */
export async function fetchAllAlliances(): Promise<Alliance[]> {
  const { data, error } = await supabase
    .from('alliances')
    .select('*')
    .order('rank', { ascending: true });

  if (error) {
    console.error('Error fetching all alliances:', error);
    throw new Error('Failed to load alliances. Please try again.');
  }

  return data || [];
}

/**
 * Fetch Alliance by ID
 */
export async function fetchAllianceById(id: string): Promise<Alliance | null> {
  const { data, error } = await supabase
    .from('alliances')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching alliance:', error);
    throw new Error('Failed to load alliance. Please try again.');
  }

  return data;
}

/**
 * Check if alliance is recruiting
 */
export function isRecruiting(alliance: Alliance): boolean {
  return alliance.recruitment_status === 'open';
}

/**
 * Get recruitment status text
 */
export function getRecruitmentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    open: 'Open for applications',
    closed: 'Not recruiting',
    invite_only: 'Invite only',
  };
  return statusMap[status] || status;
}

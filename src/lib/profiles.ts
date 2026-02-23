import { supabase } from './supabase';
import type { Profile } from '@/types';

/**
 * Fetch user profile by user ID
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Profile not found
    }
    console.error('Error fetching profile:', error);
    throw new Error('Failed to load profile');
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'alliance_id'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile');
  }

  return data;
}

/**
 * Create user profile (for new users)
 */
export async function createProfile(
  userId: string,
  profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      ...profileData,
      id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error creating profile:', error);
    throw new Error('Failed to create profile');
  }

  return data;
}

/**
 * Ensure profile exists for authenticated user.
 * Creates a default member profile on first login.
 */
export async function ensureProfile(
  userId: string,
  options?: {
    email?: string | null;
    displayName?: string | null;
  }
): Promise<Profile> {
  const existingProfile = await fetchProfile(userId);
  if (existingProfile) return existingProfile;

  const emailPrefix = options?.email?.split('@')[0]?.trim();
  const fallbackName = emailPrefix && emailPrefix.length > 0 ? emailPrefix : 'New Member';
  const displayName = options?.displayName?.trim() || fallbackName;

  return createProfile(userId, {
    display_name: displayName.slice(0, 50),
    hq_level: 1,
    power: 0,
    notes: null,
    role: 'member',
    alliance_id: null,
    can_edit_alliance: false,
    is_president: false,
  });
}

/**
 * Check if user has a complete profile
 */
export async function hasCompleteProfile(userId: string): Promise<boolean> {
  const profile = await fetchProfile(userId);
  return !!profile;
}

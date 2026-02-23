'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole, Profile } from '@/types';
import { ensureProfile } from '@/lib/profiles';

export function useRole() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const data = await ensureProfile(user.id, {
          email: user.email,
          displayName: user.user_metadata?.display_name as string | undefined,
        });
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  const hasRole = (role: UserRole): boolean => {
    return profile?.role === role;
  };

  const isMember = (): boolean => {
    return !!profile;
  };

  const isR4 = (): boolean => {
    return profile?.role === 'r4';
  };

  const isR5 = (): boolean => {
    return profile?.role === 'r5';
  };

  const isSuperadmin = (): boolean => {
    return profile?.role === 'superadmin';
  };

  const isOfficer = (): boolean => {
    return profile?.role === 'r4' || profile?.role === 'r5' || profile?.role === 'superadmin';
  };

  const canEditAlliance = (): boolean => {
    if (!profile) return false;
    if (profile.role === 'superadmin') return true;
    if (profile.role === 'r5') return true;
    if (profile.role === 'r4' && profile.can_edit_alliance) return true;
    return false;
  };

  const isAdmin = (): boolean => {
    return profile?.role === 'superadmin' || profile?.role === 'r5';
  };

  const isPresident = (): boolean => {
    return profile?.is_president === true;
  };

  return {
    profile,
    loading,
    hasRole,
    isMember,
    isR4,
    isR5,
    isSuperadmin,
    isOfficer,
    canEditAlliance,
    isAdmin,
    isPresident,
    role: profile?.role ?? null,
  };
}

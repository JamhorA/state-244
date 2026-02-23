'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="px-4 py-2 rounded-md border border-slate-300 bg-white/80 text-slate-700 hover:text-red-700 hover:border-red-300 hover:bg-red-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSigningOut ? 'Signing Out...' : 'Sign Out'}
    </button>
  );
}

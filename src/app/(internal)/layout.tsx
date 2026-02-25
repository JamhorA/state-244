'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { ReactNode } from 'react';

interface InternalLayoutProps {
  children: ReactNode;
}

export default function InternalLayout({ children }: InternalLayoutProps) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, signOut } = useAuth();
  const { isOfficer, isSuperadmin, isR5, profile } = useRole();
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function fetchPendingCount() {
      if (!isR5() && !isSuperadmin()) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/state-info/proposals/count', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });
        
        const data = await response.json();
        if (response.ok && data.pendingCount !== undefined) {
          setPendingCount(data.pendingCount);
        }
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    }

    if (isAuthenticated) {
      fetchPendingCount();
    }
  }, [isAuthenticated, isR5, isSuperadmin]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 sm:gap-3 group min-w-0"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
                <span className="text-white font-bold text-sm">244</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-100 group-hover:text-white transition-colors tracking-tight whitespace-nowrap truncate">
                State 244 <span className="text-sky-400">Hub</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="text-slate-400 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm"
              >
                Dashboard
              </Link>

              {isOfficer() && (
                <Link
                  href="/alliance"
                  className="text-slate-400 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm"
                >
                  Alliance
                </Link>
              )}

              {isOfficer() && (
                <Link
                  href="/applications"
                  className="text-slate-400 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm"
                >
                  Applications
                </Link>
              )}

              {isOfficer() && (
                <Link
                  href="/war-plan"
                  className="text-slate-400 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm"
                >
                  War Plan
                </Link>
              )}

              {(isR5() || isSuperadmin()) && (
                <Link
                  href="/state-info/proposals"
                  className="text-slate-400 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm flex items-center gap-2"
                >
                  Proposals
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-amber-500 rounded-full animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}

              {isSuperadmin() && (
                <Link
                  href="/admin"
                  className="text-amber-400 hover:text-amber-300 font-medium px-4 py-2 rounded-lg hover:bg-amber-500/10 transition-all text-sm"
                >
                  Admin
                </Link>
              )}

              <Link
                href="/help"
                className="text-slate-400 hover:text-emerald-400 font-medium px-4 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm"
              >
                Help
              </Link>

              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-800 min-w-0">
                <span className="text-sm text-slate-500 max-w-[180px] truncate">
                  {profile?.display_name}
                  <span className="ml-2 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
                    {profile?.role}
                  </span>
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-slate-500 hover:text-red-400 transition-colors p-2"
                  title="Sign out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/80"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="xl:hidden fixed inset-0 z-40 animate-fade-in">
          <div 
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-md"
            onClick={closeMobileMenu}
          />
          
          <div className="relative h-full flex flex-col pt-16 sm:pt-20 px-4 sm:px-6">
            <div className="flex flex-col space-y-2 w-full max-w-xl mx-auto">
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className="w-full text-left text-lg sm:text-xl font-semibold text-slate-200 py-3 sm:py-4 px-4 sm:px-6 hover:text-white hover:bg-slate-800/50 transition-all rounded-xl"
              >
                Dashboard
              </Link>

              {isOfficer() && (
                <Link
                  href="/alliance"
                  onClick={closeMobileMenu}
                  className="w-full text-left text-lg sm:text-xl font-semibold text-slate-200 py-3 sm:py-4 px-4 sm:px-6 hover:text-white hover:bg-slate-800/50 transition-all rounded-xl"
                >
                  Alliance
                </Link>
              )}

              {isOfficer() && (
                <Link
                  href="/applications"
                  onClick={closeMobileMenu}
                  className="w-full text-left text-lg sm:text-xl font-semibold text-slate-200 py-3 sm:py-4 px-4 sm:px-6 hover:text-white hover:bg-slate-800/50 transition-all rounded-xl"
                >
                  Applications
                </Link>
              )}

              {isOfficer() && (
                <Link
                  href="/war-plan"
                  onClick={closeMobileMenu}
                  className="w-full text-left text-lg sm:text-xl font-semibold text-slate-200 py-3 sm:py-4 px-4 sm:px-6 hover:text-white hover:bg-slate-800/50 transition-all rounded-xl"
                >
                  War Plan
                </Link>
              )}

              {(isR5() || isSuperadmin()) && (
                <Link
                  href="/state-info/proposals"
                  onClick={closeMobileMenu}
                  className="w-full text-left text-lg sm:text-xl font-semibold text-slate-200 py-3 sm:py-4 px-4 sm:px-6 hover:text-white hover:bg-slate-800/50 transition-all rounded-xl flex items-center gap-3"
                >
                  Proposals
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-sm font-bold text-white bg-amber-500 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )}

              {isSuperadmin() && (
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className="w-full text-left text-lg sm:text-xl font-semibold text-amber-400 py-3 sm:py-4 px-4 sm:px-6 hover:text-amber-300 hover:bg-amber-500/10 transition-all rounded-xl"
                >
                  Admin
                </Link>
              )}

              <Link
                href="/help"
                onClick={closeMobileMenu}
                className="w-full text-left text-lg sm:text-xl font-semibold text-emerald-400 py-3 sm:py-4 px-4 sm:px-6 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all rounded-xl"
              >
                Help
              </Link>
            </div>

            <div className="h-px bg-slate-800 my-6" />

            <div className="flex flex-col items-stretch space-y-4 w-full max-w-xl mx-auto">
              <div className="flex items-center gap-3 text-slate-400 px-4 sm:px-6">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm sm:text-base truncate">{profile?.display_name}</span>
                <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">
                  {profile?.role}
                </span>
              </div>
              
              <button
                onClick={handleSignOut}
                className="self-start flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors py-2 px-4 sm:px-6 text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';

const warModes = [
  {
    key: 'glory-war',
    title: 'Glory War',
    description: 'Build attacker and defender teams for your alliance and export the plan.',
    active: true,
    href: '/war-plan/glory-war',
    accent: 'from-amber-400/20 to-amber-600/10 border-amber-400/30',
  },
  {
    key: 'canyon-clash',
    title: 'Canyon Clash',
    description: 'Coming soon',
    active: false,
    href: '#',
    accent: 'from-slate-700/30 to-slate-900/20 border-slate-700/60',
  },
  {
    key: 'svs',
    title: 'State vs State (SvS)',
    description: 'Coming soon',
    active: false,
    href: '#',
    accent: 'from-slate-700/30 to-slate-900/20 border-slate-700/60',
  },
  {
    key: 'arctic-ice-pit-clash',
    title: 'Arctic Ice Pit Clash',
    description: 'Coming soon',
    active: false,
    href: '#',
    accent: 'from-slate-700/30 to-slate-900/20 border-slate-700/60',
  },
];

export default function WarPlanPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isOfficer, loading: roleLoading } = useRole();
  const isOfficerUser = isOfficer();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/war-plan');
      } else if (!isOfficerUser) {
        router.replace('/dashboard');
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, isOfficerUser, router]);

  if (authLoading || roleLoading || !isAuthenticated || !isOfficerUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">War Plan</h1>
        <p className="text-slate-400">Choose a battle mode and prepare your alliance strategy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {warModes.map((mode) => {
          if (mode.active) {
            return (
              <Link
                key={mode.key}
                href={mode.href}
                className={`group glass-card rounded-xl border p-5 sm:p-6 bg-gradient-to-br ${mode.accent} hover:border-amber-300/50 transition-all`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {mode.title}
                  </h2>
                  <span className="px-2 py-1 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-400/20">
                    Active
                  </span>
                </div>
                <p className="text-slate-300 text-sm sm:text-base">{mode.description}</p>
                <div className="mt-5 flex items-center gap-2 text-amber-300 text-sm font-medium">
                  Open Planner
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          }

          return (
            <div
              key={mode.key}
              className={`glass-card rounded-xl border p-5 sm:p-6 bg-gradient-to-br ${mode.accent} opacity-80`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-slate-200">{mode.title}</h2>
                <span className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700/70">
                  Coming Soon
                </span>
              </div>
              <p className="text-slate-400 text-sm sm:text-base">{mode.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

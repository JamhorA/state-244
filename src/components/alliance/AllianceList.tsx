import type { Alliance } from '@/types';
import { AllianceCard } from './AllianceCard';

interface AllianceListProps {
  alliances: Alliance[];
  loading?: boolean;
}

export function AllianceList({ alliances, loading }: AllianceListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
                  <div className="w-16 h-5 rounded-full bg-slate-200 animate-pulse" />
                </div>
                <div className="h-6 bg-slate-200 rounded-lg animate-pulse w-32" />
              </div>
              <div className="w-16 h-16 rounded-xl bg-slate-200 animate-pulse" />
            </div>
            <div className="space-y-2 mb-6">
              <div className="h-4 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-slate-200 rounded animate-pulse w-24" />
              <div className="h-10 bg-slate-200 rounded-lg animate-pulse w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (alliances.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No Alliances Available</h3>
        <p className="text-slate-600">Check back soon for new alliance listings.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {alliances.map((alliance) => (
        <AllianceCard key={alliance.id} alliance={alliance} />
      ))}
    </div>
  );
}

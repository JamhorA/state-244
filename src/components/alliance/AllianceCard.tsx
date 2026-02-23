import Link from 'next/link';
import type { Alliance } from '@/types';
import { getRecruitmentStatusText, isRecruiting } from '@/lib/alliances';

interface AllianceCardProps {
  alliance: Alliance;
}

export function AllianceCard({ alliance }: AllianceCardProps) {
  const recruiting = isRecruiting(alliance);
  const statusText = getRecruitmentStatusText(alliance.recruitment_status);

  return (
    <div className="glass-card rounded-2xl p-6 card-hover group relative overflow-hidden flex flex-col h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
      
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-sm shadow-[0_0_15px_rgba(251,191,36,0.3)] shrink-0">
              #{alliance.rank}
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border shrink-0 ${
              recruiting
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {recruiting ? 'Recruiting' : 'Closed'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
            {alliance.name}
          </h2>
        </div>
        
        {alliance.logo_url && (
          <div className="w-16 h-16 shrink-0 rounded-xl border border-slate-700/50 bg-slate-900/50 p-1.5 shadow-sm overflow-hidden ml-4">
            <img
              src={alliance.logo_url}
              alt={`${alliance.name} logo`}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        )}
      </div>

      <p className="text-slate-400 mb-6 line-clamp-2 leading-relaxed text-sm flex-grow">
        {alliance.description}
      </p>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/60">
        <span className="text-sm text-slate-500 font-medium">{statusText}</span>
        <Link
          href={`/alliances/${alliance.id}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white font-medium text-sm rounded-lg hover:bg-slate-700 transition-all group-hover:bg-sky-500 shadow-[0_4px_14px_rgba(0,0,0,0.1)] group-hover:shadow-[0_4px_14px_rgba(14,165,233,0.3)]"
        >
          View Profile
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

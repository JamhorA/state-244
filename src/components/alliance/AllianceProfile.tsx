import Link from 'next/link';
import type { Alliance } from '@/types';
import { getRecruitmentStatusText, isRecruiting } from '@/lib/alliances';

interface AllianceProfileProps {
  alliance: Alliance;
}

function formatDescription(description: string) {
  const lines = description.split('\n');
  
  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      return <div key={index} className="h-4" />;
    }
    
    if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && !trimmedLine.includes('—')) {
      return (
        <h3 key={index} className="text-lg font-bold text-slate-100 mt-6 mb-2 first:mt-0">
          {trimmedLine}
        </h3>
      );
    }
    
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      return (
        <h3 key={index} className="text-lg font-bold text-slate-100 mt-6 mb-2 first:mt-0">
          {trimmedLine.slice(2, -2)}
        </h3>
      );
    }
    
    const parts = trimmedLine.split(/(\*\*[^*]+\*\*)/g);
    if (parts.length > 1) {
      return (
        <p key={index} className="text-slate-300 leading-relaxed mb-2">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    }
    
    if (trimmedLine.startsWith('*') && trimmedLine.endsWith('*') && !trimmedLine.startsWith('**')) {
      return (
        <p key={index} className="text-slate-400 italic mt-4">
          {trimmedLine.slice(1, -1)}
        </p>
      );
    }
    
    return (
      <p key={index} className="text-slate-300 leading-relaxed mb-2">
        {trimmedLine}
      </p>
    );
  });
}

export function AllianceProfile({ alliance }: AllianceProfileProps) {
  const recruiting = isRecruiting(alliance);
  const statusText = getRecruitmentStatusText(alliance.recruitment_status);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {alliance.logo_url && (
            <img
              src={alliance.logo_url}
              alt={`${alliance.name} logo`}
              className="w-32 h-32 object-contain rounded-xl bg-slate-900/50 border border-slate-700/50"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              {alliance.name}
            </h1>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="px-4 py-1.5 text-sm font-semibold rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 border border-amber-500/30">
                Rank #{alliance.rank}
              </span>
              <span className={`px-4 py-1.5 text-sm font-semibold rounded-full border ${
                recruiting
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {statusText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Our Story
        </h2>
        <div className="text-slate-300 leading-relaxed">
          {formatDescription(alliance.description)}
        </div>
      </div>

      {/* Contact Information */}
      {alliance.contact_info && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Information
          </h2>
          <p className="text-slate-300">{alliance.contact_info}</p>
        </div>
      )}

      {/* Apply Button */}
      {recruiting && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6 border-emerald-500/20">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Join This Alliance
          </h2>
          <p className="text-slate-400 mb-6">
            Submit a migration application to become a member of {alliance.name}.
          </p>
          <Link
            href={`/apply?alliance=${alliance.id}`}
            className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold group"
          >
            Apply Now
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      )}

      {!recruiting && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6 border-slate-700/50">
          <div className="flex items-center gap-3 text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>This alliance is not currently accepting new members.</span>
          </div>
        </div>
      )}

      {/* Back Link */}
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-sky-400 font-medium transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to All Alliances
        </Link>
      </div>
    </div>
  );
}

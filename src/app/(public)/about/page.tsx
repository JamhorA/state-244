import { fetchStateInfo } from '@/lib/state-info';
import type { StateInfoSection } from '@/lib/state-info';

function formatContent(content: string) {
  const lines = content.split('\n');
  
  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      return <div key={index} className="h-4" />;
    }
    
    if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && !trimmedLine.includes(':')) {
      return (
        <h3 key={index} className="text-lg font-bold text-slate-100 mt-6 mb-3 first:mt-0 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          {trimmedLine}
        </h3>
      );
    }
    
    return (
      <p key={index} className="text-slate-300 leading-relaxed mb-2">
        {trimmedLine}
      </p>
    );
  });
}

function getSectionIcon(sectionKey: string) {
  switch (sectionKey) {
    case 'story':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'rules':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'server_info':
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getSectionGradient(sectionKey: string) {
  switch (sectionKey) {
    case 'story':
      return 'from-sky-400 to-blue-600';
    case 'rules':
      return 'from-amber-400 to-orange-600';
    case 'server_info':
      return 'from-emerald-400 to-teal-600';
    default:
      return 'from-indigo-400 to-purple-600';
  }
}

export default async function AboutPage() {
  let sections: StateInfoSection[] = [];
  
  try {
    sections = await fetchStateInfo();
  } catch (error) {
    console.error('Failed to load state info:', error);
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px] animate-float" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-30 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-md mb-8">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-300">Active Server</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            State <span className="gradient-text">244</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Your home in State of Survival. Discover our story, learn our rules, and join our community.
          </p>
        </div>

        {/* Sections */}
        {sections.length > 0 ? (
          <div className="space-y-8">
            {sections.map((section) => (
              <div key={section.id} className="glass-card rounded-2xl p-8 sm:p-10 border border-slate-800/80 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-sky-500/10 transition-colors" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getSectionGradient(section.section_key)} flex items-center justify-center shadow-lg`}>
                      <div className="text-white">
                        {getSectionIcon(section.section_key)}
                      </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                      {section.title}
                    </h2>
                  </div>
                  
                  <div className="text-slate-300 leading-relaxed">
                    {formatContent(section.content)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center border border-slate-800/80">
            <p className="text-slate-400">Unable to load state information. Please try again later.</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-6 text-center border border-slate-800/60">
            <div className="text-3xl font-bold text-white mb-1">244</div>
            <div className="text-sm text-slate-400">State Number</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center border border-slate-800/60">
            <div className="text-3xl font-bold text-white mb-1">3</div>
            <div className="text-sm text-slate-400">Top Alliances</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center border border-slate-800/60">
            <div className="text-3xl font-bold text-white mb-1">24/7</div>
            <div className="text-sm text-slate-400">Active Community</div>
          </div>
          <div className="glass-card rounded-xl p-6 text-center border border-slate-800/60">
            <div className="text-3xl font-bold text-sky-400 mb-1">Open</div>
            <div className="text-sm text-slate-400">Recruitment</div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <a
            href="/"
            className="btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg group"
          >
            View Alliances
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

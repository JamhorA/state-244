import { AllianceList } from '@/components/alliance/AllianceList';
import { ApprovedPlayersMarquee } from '@/components/approved-players/ApprovedPlayersMarquee';
import { fetchTop3Alliances } from '@/lib/alliances';
import { fetchApprovedApplications } from '@/lib/applications';
import type { Alliance, ApprovedPlayer } from '@/types';
import Link from 'next/link';

// Revalidate every 5 minutes to show database changes
export const revalidate = 300;

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default async function HomePage() {
  let alliances: Alliance[] = [];
  let approvedPlayers: ApprovedPlayer[] = [];
  let loadError = false;

  try {
    alliances = await fetchTop3Alliances();
  } catch (error) {
    loadError = true;
    console.error('Failed to load top alliances:', error);
  }

  try {
    approvedPlayers = await fetchApprovedApplications();
  } catch (error) {
    console.error('Failed to load approved players:', error);
  }

  return (
    <>
      <main className="relative min-h-screen bg-slate-950 text-slate-50 selection:bg-sky-500/30">
        {/* Ambient Background Lights */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px] animate-pulse-glow" />
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-sky-500/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] animate-float" />
          <div className="absolute inset-0 bg-grid-pattern opacity-40 mix-blend-overlay" />
        </div>

        {/* --- HERO SECTION --- */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16 lg:pb-24">
          <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
            
            {/* 5-Star Rating Badge */}
            <div className="mb-10 relative">
              <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full scale-150 opacity-50"></div>
              <div className="relative flex items-center gap-1.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-amber-500/10 border border-amber-400/30 backdrop-blur-sm">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} className="w-7 h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                ))}
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-md mb-8 shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold tracking-wide text-slate-200">UNDEFEATED IN STATE VS STATE WAR</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 leading-[1.05] tracking-tight">
              Welcome to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                State 244
              </span>
            </h1>
            
            {/* Tagline */}
            <p className="text-2xl sm:text-3xl text-slate-300 mb-4 font-medium tracking-wide">
              Where Legends Are Made.
            </p>
            
            {/* Sub-headline */}
            <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              A 5-star server with an unbroken war record. Three elite alliances. 
              <span className="text-slate-300 font-medium"> One family when it matters.</span>
            </p>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-12">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-white">5</div>
                <div className="text-sm text-amber-400 font-semibold tracking-wider uppercase">Stars</div>
              </div>
              <div className="w-px h-12 bg-slate-700 hidden sm:block"></div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-white">0</div>
                <div className="text-sm text-emerald-400 font-semibold tracking-wider uppercase">Defeats</div>
              </div>
              <div className="w-px h-12 bg-slate-700 hidden sm:block"></div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black text-white">3</div>
                <div className="text-sm text-sky-400 font-semibold tracking-wider uppercase">Top Alliances</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Link href="/apply" className="btn-primary w-full sm:w-auto px-10 py-4 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                <span>Join Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/about" className="w-full sm:w-auto px-8 py-4 rounded-xl text-slate-300 font-semibold text-lg flex items-center justify-center gap-2 group border border-slate-700/50 bg-slate-900/50 hover:bg-slate-800/50 hover:border-slate-600 transition-all">
                Learn More
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="w-5 h-5 shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* --- APPROVED PLAYERS MARQUEE --- */}
        <ApprovedPlayersMarquee players={approvedPlayers} />

        {/* --- FEATURES SECTION --- */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card rounded-2xl p-8 card-hover relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                <StarIcon className="w-7 h-7 text-white drop-shadow-md" />
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">5-Star Server</h3>
              <p className="text-slate-400 leading-relaxed">
                The highest honor in State of Survival. Earned through unity, skill, and an unbroken record of victory.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card rounded-2xl p-8 card-hover relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" className="w-7 h-7 text-white drop-shadow-md shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">Undefeated</h3>
              <p className="text-slate-400 leading-relaxed">
                Zero defeats in State vs State war. When State 244 fights, we fight as one—and we never lose.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card rounded-2xl p-8 card-hover relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
              <div className="w-14 h-14 shrink-0 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" className="w-7 h-7 text-white drop-shadow-md shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-100 mb-3 tracking-wide">Elite Alliances</h3>
              <p className="text-slate-400 leading-relaxed">
                Three legendary alliances compete for glory—yet stand as brothers when the state calls.
              </p>
            </div>
          </div>
        </section>

        {/* --- ALLIANCES SECTION --- */}
        <section id="alliances" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-6 border-b border-slate-800 pb-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">Top 3 Alliances</h2>
              <p className="text-slate-400 text-lg">The most powerful alliances recruiting now</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-emerald-400">Open for applications</span>
            </div>
          </div>

          {loadError ? (
            <div className="glass-card rounded-2xl p-10 text-center border-amber-500/20 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-5 border border-amber-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Unable to Load Alliances</h3>
              <p className="text-slate-400">Our scouts encountered an issue. Please try again in a moment.</p>
            </div>
          ) : (
            <div className="relative">
              <AllianceList alliances={alliances} />
            </div>
          )}
        </section>

        {/* --- BOTTOM CTA --- */}
        <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-500/10 via-slate-900 to-amber-500/5 border border-amber-400/20 p-8 sm:p-12 lg:p-16 xl:p-20 shadow-[0_0_60px_rgba(251,191,36,0.1)]">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl animate-float" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-400/5 rounded-full blur-3xl animate-float-delayed" />
              <div className="absolute inset-0 bg-grid-pattern opacity-20 mix-blend-overlay" />
            </div>
            
            <div className="relative text-center max-w-3xl mx-auto z-10">
              {/* 5 Stars in CTA */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} className="w-6 h-6 text-amber-400" />
                ))}
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
                Ready to Make History?
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-10 leading-relaxed font-light">
                Join a 5-star state with an undefeated legacy. Your chapter in our story begins today.
              </p>
              <Link
                href="/apply"
                className="inline-flex w-full sm:w-auto justify-center items-center gap-3 px-6 sm:px-8 lg:px-10 py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-bold text-base sm:text-lg rounded-xl shadow-[0_10px_40px_rgba(251,191,36,0.3)] hover:shadow-[0_15px_50px_rgba(251,191,36,0.4)] hover:-translate-y-1 transition-all duration-300 group"
              >
                Start Your Application
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* --- FOOTER --- */}
      <footer className="relative bg-slate-950 border-t border-slate-800/80 text-slate-300">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <span className="text-white font-bold text-sm">244</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-white tracking-tight">State 244 </span>
                  <span className="text-2xl font-bold text-amber-400 tracking-tight">Hub</span>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon key={star} className="w-3 h-3 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-slate-400 max-w-md leading-relaxed">
                A 5-star server with an undefeated war record. Connect with elite alliances, submit migration applications, and become part of our legendary community.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/" className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    Alliances
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    About State 244
                  </Link>
                </li>
                <li>
                  <Link href="/apply" className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    Apply
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-6 uppercase tracking-wider text-sm">Server Stats</h4>
              <ul className="space-y-4">
                <li className="text-slate-400 flex items-center gap-2">
                  <StarIcon className="w-4 h-4 text-amber-400" />
                  5-Star Server
                </li>
                <li className="text-slate-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Undefeated SvS
                </li>
                <li className="text-slate-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  3 Elite Alliances
                </li>
                <li className="text-slate-400 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Open Recruitment
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800/80 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} State 244 Hub. All rights reserved.</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} className="w-3 h-3 text-amber-400" />
              ))}
              <span className="text-slate-500 text-xs ml-2">5-Star Server</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

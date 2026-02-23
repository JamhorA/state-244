import Link from 'next/link';

export default function ApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-sky-500/10 blur-[100px] animate-float" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-lg w-full glass-card rounded-2xl p-8 sm:p-10 text-center border border-slate-800/80 shadow-2xl">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(52,211,153,0.4)]">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
          Application <span className="gradient-text">Submitted!</span>
        </h1>

        {/* Message */}
        <p className="text-slate-400 mb-8 leading-relaxed">
          Thank you for your interest in joining the alliance. Your application has been received and is being reviewed by alliance leadership.
        </p>

        {/* Info Box */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            What happens next?
          </h2>
          <ul className="text-slate-400 text-sm space-y-3">
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Alliance officers will review your application
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              You will be notified when a decision is made
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Check your email for updates
            </li>
          </ul>
        </div>

        {/* Back to Home Button */}
        <Link
          href="/"
          className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-bold group"
        >
          Back to Home
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
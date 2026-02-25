import Link from 'next/link';
import { ContactForm } from '@/components/forms/ContactForm';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 sm:px-6 py-10 sm:py-14 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-500/10 blur-[120px] animate-float" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm font-medium mb-5">
            Contact State 244 Hub
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            Need Help or Have a Question?
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Send us a message for alliance inquiries, website support, or general questions. If you are applying to join, use the
            {' '}
            <Link href="/apply" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
              migration application form
            </Link>
            .
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}

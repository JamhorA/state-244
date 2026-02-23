import { notFound } from 'next/navigation';
import { MigrationApplicationForm } from '@/components/forms/MigrationApplicationForm';
import { fetchAllianceById, fetchAllAlliances } from '@/lib/alliances';

interface ApplyPageProps {
  searchParams: Promise<{ alliance?: string }>;
}

export default async function ApplyPage({ searchParams }: ApplyPageProps) {
  const { alliance: allianceId } = await searchParams;

  const alliances = await fetchAllAlliances();
  let selectedAlliance = null;

  if (allianceId) {
    selectedAlliance = await fetchAllianceById(allianceId);
    if (!selectedAlliance) {
      notFound();
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-500/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 blur-[100px] animate-float" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30 mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Migration <span className="gradient-text">Application</span>
          </h1>
          <p className="text-lg text-slate-400">
            Submit your details to start your journey in State 244.
          </p>
        </div>
        
        <MigrationApplicationForm 
          alliance={selectedAlliance || undefined} 
          alliances={alliances} 
        />
      </div>
    </div>
  );
}

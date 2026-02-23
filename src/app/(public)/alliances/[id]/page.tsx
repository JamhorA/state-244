import { notFound } from 'next/navigation';
import { AllianceProfile } from '@/components/alliance/AllianceProfile';
import { fetchAllianceById } from '@/lib/alliances';

interface AlliancePageProps {
  params: Promise<{ id: string }>;
}

export default async function AlliancePage({ params }: AlliancePageProps) {
  const { id } = await params;
  const alliance = await fetchAllianceById(id);

  if (!alliance) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-500/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[100px] animate-float" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30 mix-blend-overlay" />
      </div>

      <div className="relative z-10">
        <AllianceProfile alliance={alliance} />
      </div>
    </div>
  );
}

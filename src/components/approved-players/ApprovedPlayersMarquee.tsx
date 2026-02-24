'use client';

import { useEffect, useRef, useState } from 'react';
import type { ApprovedPlayer } from '@/types';

interface ApprovedPlayersMarqueeProps {
  players: ApprovedPlayer[];
}

const approvedDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatApprovedDate(dateString: string) {
  return approvedDateFormatter.format(new Date(dateString));
}

function RegularCard({ player }: { player: ApprovedPlayer }) {
  const formattedDate = formatApprovedDate(player.approved_at);

  const formattedPower = player.power_level >= 1000000
    ? `${(player.power_level / 1000000).toFixed(1)}M`
    : player.power_level >= 1000
    ? `${(player.power_level / 1000).toFixed(0)}K`
    : player.power_level.toString();

  return (
    <div className="flex-shrink-0 w-52 p-4 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)] group">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">🎊</span>
        <h3 className="font-bold text-white text-lg truncate group-hover:text-amber-400 transition-colors">
          {player.player_name}
        </h3>
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent mb-3" />
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-base">🏆</span>
          <span className="truncate font-medium">{player.target_alliance_name}</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-base">⚡</span>
          <span>{formattedPower} Power</span>
        </div>
        
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-base">📅</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

function T10EliteCard({ player }: { player: ApprovedPlayer }) {
  const formattedDate = formatApprovedDate(player.approved_at);

  const formattedPower = player.power_level >= 1000000
    ? `${(player.power_level / 1000000).toFixed(1)}M`
    : player.power_level >= 1000
    ? `${(player.power_level / 1000).toFixed(0)}K`
    : player.power_level.toString();

  return (
    <div className="flex-shrink-0 w-56 t10-elite-card">
      <div className="absolute inset-0 rounded-xl t10-shimmer-border" />
      <div className="absolute -inset-1 rounded-xl t10-glow blur-sm" />
      
      <div className="t10-sparkle t10-sparkle-1">✨</div>
      <div className="t10-sparkle t10-sparkle-2">✨</div>
      <div className="t10-sparkle t10-sparkle-3">✨</div>
      <div className="t10-sparkle t10-sparkle-4">✨</div>
      
      <div className="relative p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-400/30 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">👑</span>
              <h3 className="font-bold text-lg truncate t10-gold-text">
                {player.player_name}
              </h3>
            </div>
            <span className="t10-badge">T10</span>
          </div>
          
          <div className="h-px t10-gold-divider mb-3" />
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-amber-200">
              <span className="text-base">🏆</span>
              <span className="truncate font-medium">{player.target_alliance_name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-amber-300">
              <span className="text-base">⚡</span>
              <span className="font-semibold">{formattedPower} Power</span>
            </div>
            
            <div className="flex items-center gap-2 text-amber-200/70">
              <span className="text-base">📅</span>
              <span>{formattedDate}</span>
            </div>
          </div>
          
          <div className="flex justify-center mt-3 gap-0.5">
            <span className="text-amber-400 text-sm drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]">⭐</span>
            <span className="text-amber-400 text-sm drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]">⭐</span>
            <span className="text-amber-400 text-sm drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]">⭐</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: ApprovedPlayer }) {
  const isT10 = player.troop_level?.toUpperCase() === 'T10';
  
  if (isT10) {
    return <T10EliteCard player={player} />;
  }
  
  return <RegularCard player={player} />;
}

export function ApprovedPlayersMarquee({ players }: ApprovedPlayersMarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureTrackRef = useRef<HTMLDivElement>(null);
  const [shouldMarquee, setShouldMarquee] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !measureTrackRef.current) return;

    const updateMode = () => {
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const contentWidth = measureTrackRef.current?.scrollWidth ?? 0;

      // Use marquee only when a single track meaningfully exceeds the viewport.
      setShouldMarquee(contentWidth > containerWidth * 1.05);
    };

    updateMode();

    const resizeObserver = new ResizeObserver(() => {
      updateMode();
    });

    resizeObserver.observe(containerRef.current);
    resizeObserver.observe(measureTrackRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [players]);

  if (players.length === 0) return null;

  const animationDuration = Math.max(15, players.length * 1.2);
  return (
    <section className="relative z-10 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative">
        <div className="text-center mb-8 px-4">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="text-4xl">🎉</span>
            <span>Welcome to the Family!</span>
            <span className="text-4xl">🎉</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Our newest approved members
          </p>
        </div>

        <div className="relative" ref={containerRef}>
          {/* Invisible single-track measurement for adaptive marquee/static mode */}
          <div className="absolute inset-0 -z-10 pointer-events-none opacity-0 overflow-hidden">
            <div ref={measureTrackRef} className="flex w-max gap-4 pr-4">
              {players.map((player) => (
                <PlayerCard key={`measure-${player.id}`} player={player} />
              ))}
            </div>
          </div>

          {shouldMarquee && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 lg:w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 lg:w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />
            </>
          )}

          <div className="overflow-hidden py-4">
            {shouldMarquee ? (
              <div
                className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none"
                style={{
                  animationDuration: `${animationDuration}s`,
                }}
              >
                <div className="flex shrink-0 gap-4 pr-4">
                  {players.map((player) => (
                    <PlayerCard key={`primary-${player.id}`} player={player} />
                  ))}
                </div>
                <div className="flex shrink-0 gap-4 pr-4" aria-hidden="true">
                  {players.map((player) => (
                    <PlayerCard key={`clone-${player.id}`} player={player} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4">
                <div className="flex flex-wrap justify-center gap-4">
                  {players.map((player) => (
                    <PlayerCard key={`static-${player.id}`} player={player} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

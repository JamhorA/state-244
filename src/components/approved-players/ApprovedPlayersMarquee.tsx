'use client';

import { useEffect, useRef, useState } from 'react';
import type { ApprovedPlayer } from '@/types';

interface ApprovedPlayersMarqueeProps {
  players: ApprovedPlayer[];
}

function RegularCard({ player }: { player: ApprovedPlayer }) {
  const formattedDate = new Date(player.approved_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
  const formattedDate = new Date(player.approved_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (!scrollerRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    
    // Keep duplicating until we have at least 2.5x container width for seamless loop
    while (scrollerRef.current.scrollWidth < containerWidth * 2.5) {
      const originalItems = Array.from(scrollerRef.current.children).slice(0, players.length);
      originalItems.forEach((item) => {
        const clone = item.cloneNode(true);
        scrollerRef.current?.appendChild(clone);
      });
    }

    setStart(true);
  }, [players]);

  if (players.length === 0) return null;

  const animationDuration = Math.max(15, players.length * 1.2);

  return (
    <section className="relative z-10 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950" />
      
      <div className="relative">
        <div className="text-center mb-8 px-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <span className="text-4xl">🎉</span>
            <span>Welcome to the Family!</span>
            <span className="text-4xl">🎉</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Our newest approved members
          </p>
        </div>

        <div className="relative" ref={containerRef}>
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden py-4">
            <div
              ref={scrollerRef}
              className="flex gap-4 hover:[animation-play-state:paused]"
              style={{
                animation: start 
                  ? `marquee ${animationDuration}s linear infinite` 
                  : 'none',
              }}
            >
              {players.map((player, index) => (
                <PlayerCard key={`${player.id}-${index}`} player={player} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

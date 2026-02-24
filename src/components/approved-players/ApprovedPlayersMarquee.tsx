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

function getRegularTierStyle(troopLevel?: string | null) {
  const tier = troopLevel?.toUpperCase();

  if (tier === 'T9') {
    return {
      widthClass: 'w-56',
      cardClass: 'bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-sky-950/30 border border-sky-400/20 hover:border-sky-300/40 hover:shadow-[0_0_28px_rgba(56,189,248,0.15)]',
      titleHoverClass: 'group-hover:text-sky-300',
      dividerClass: 'bg-gradient-to-r from-transparent via-sky-400/35 to-transparent',
      allianceClass: 'text-slate-200',
      powerClass: 'text-sky-200/90',
      dateClass: 'text-slate-500',
      chipClass: 'bg-sky-400/10 text-sky-300 border border-sky-400/20',
      badgeClass: 'bg-sky-400/10 text-sky-200 border border-sky-400/20',
      label: 'T9',
    };
  }

  if (tier === 'T8') {
    return {
      widthClass: 'w-52',
      cardClass: 'bg-gradient-to-br from-slate-800/85 via-slate-900/85 to-amber-950/20 border border-amber-500/20 hover:border-amber-400/40 hover:shadow-[0_0_24px_rgba(251,191,36,0.13)]',
      titleHoverClass: 'group-hover:text-amber-300',
      dividerClass: 'bg-gradient-to-r from-transparent via-amber-500/30 to-transparent',
      allianceClass: 'text-slate-300',
      powerClass: 'text-amber-100/80',
      dateClass: 'text-slate-500',
      chipClass: 'bg-amber-400/10 text-amber-300 border border-amber-400/20',
      badgeClass: 'bg-amber-400/10 text-amber-200 border border-amber-400/20',
      label: 'T8',
    };
  }

  return {
    widthClass: 'w-52',
    cardClass: 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 hover:border-slate-500/60 hover:shadow-[0_0_18px_rgba(148,163,184,0.12)]',
    titleHoverClass: 'group-hover:text-slate-100',
    dividerClass: 'bg-gradient-to-r from-transparent via-slate-600/50 to-transparent',
    allianceClass: 'text-slate-300',
    powerClass: 'text-slate-400',
    dateClass: 'text-slate-500',
    chipClass: 'bg-slate-700/40 text-slate-300 border border-slate-600/40',
    badgeClass: 'bg-slate-700/30 text-slate-300 border border-slate-600/30',
    label: tier || 'MEM',
  };
}

function RegularCard({ player }: { player: ApprovedPlayer }) {
  const formattedDate = formatApprovedDate(player.approved_at);
  const tierStyle = getRegularTierStyle(player.troop_level);

  const formattedPower = player.power_level >= 1000000
    ? `${(player.power_level / 1000000).toFixed(1)}M`
    : player.power_level >= 1000
    ? `${(player.power_level / 1000).toFixed(0)}K`
    : player.power_level.toString();

  return (
    <div className={`flex-shrink-0 ${tierStyle.widthClass} p-4 rounded-xl transition-all duration-300 group ${tierStyle.cardClass}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">{'\u{1F38A}'}</span>
          <h3 className={`font-bold text-white text-lg truncate transition-colors ${tierStyle.titleHoverClass}`}>
            {player.player_name}
          </h3>
        </div>
        {player.troop_level && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tierStyle.badgeClass}`}>
            {player.troop_level}
          </span>
        )}
      </div>

      <div className={`h-px mb-3 ${tierStyle.dividerClass}`} />

      <div className="space-y-2 text-sm">
        <div className={`flex items-center gap-2 ${tierStyle.allianceClass}`}>
          <span className="text-base">{'\u{1F3C6}'}</span>
          <span className="truncate font-medium">{player.target_alliance_name}</span>
        </div>

        <div className={`flex items-center gap-2 ${tierStyle.powerClass}`}>
          <span className="text-base">{'\u26A1'}</span>
          <span>{formattedPower} Power</span>
        </div>

        <div className={`flex items-center gap-2 ${tierStyle.dateClass}`}>
          <span className="text-base">{'\u{1F4C5}'}</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

type EliteTheme = 'gold' | 'silver';

function EliteCard({ player, theme }: { player: ApprovedPlayer; theme: EliteTheme }) {
  const formattedDate = formatApprovedDate(player.approved_at);

  const formattedPower = player.power_level >= 1000000
    ? `${(player.power_level / 1000000).toFixed(1)}M`
    : player.power_level >= 1000
    ? `${(player.power_level / 1000).toFixed(0)}K`
    : player.power_level.toString();

  const isGold = theme === 'gold';

  const themeStyles = isGold
    ? {
        shimmerClass: 't10-shimmer-border',
        glowClass: 't10-glow',
        shellClass: 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-400/30',
        overlayClass: 'bg-gradient-to-br from-amber-500/5 to-transparent',
        icon: '\u{1F451}',
        iconGlow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]',
        titleClass: 't10-gold-text',
        badge: 'T10',
        badgeClass: 't10-badge',
        dividerClass: 't10-gold-divider',
        allianceTextClass: 'text-amber-200',
        powerTextClass: 'text-amber-300',
        dateTextClass: 'text-amber-200/70',
        starChar: '\u2B50',
        starClass: 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]',
      }
    : {
        shimmerClass: 'bg-[linear-gradient(90deg,transparent_0%,rgba(56,189,248,0.25)_25%,rgba(56,189,248,0.5)_50%,rgba(56,189,248,0.25)_75%,transparent_100%)] bg-[length:200%_100%] animate-[t10-shimmer_3s_linear_infinite]',
        glowClass: 'bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.28)_0%,transparent_70%)]',
        shellClass: 'bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/30 border border-sky-400/30',
        overlayClass: 'bg-gradient-to-br from-sky-400/5 to-transparent',
        icon: '\u2694',
        iconGlow: 'drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]',
        titleClass: 'bg-gradient-to-r from-sky-200 via-cyan-300 to-sky-400 bg-clip-text text-transparent',
        badge: 'T9',
        badgeClass: 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(56,189,248,0.45)]',
        dividerClass: 'bg-gradient-to-r from-transparent via-sky-400/50 to-transparent',
        allianceTextClass: 'text-sky-100',
        powerTextClass: 'text-cyan-200',
        dateTextClass: 'text-sky-100/70',
        starChar: '\u2726',
        starClass: 'text-sky-300 drop-shadow-[0_0_4px_rgba(56,189,248,0.6)]',
      };

  return (
    <div className="flex-shrink-0 w-56 t10-elite-card">
      <div className={`absolute inset-0 rounded-xl ${themeStyles.shimmerClass}`} />
      <div className={`absolute -inset-1 rounded-xl blur-sm ${themeStyles.glowClass}`} />

      <div className="t10-sparkle t10-sparkle-1">{'\u2728'}</div>
      <div className="t10-sparkle t10-sparkle-2">{'\u2728'}</div>
      <div className="t10-sparkle t10-sparkle-3">{'\u2728'}</div>
      <div className="t10-sparkle t10-sparkle-4">{'\u2728'}</div>

      <div className={`relative p-4 rounded-xl overflow-hidden ${themeStyles.shellClass}`}>
        <div className={`absolute inset-0 pointer-events-none ${themeStyles.overlayClass}`} />

        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl ${themeStyles.iconGlow}`}>{themeStyles.icon}</span>
              <h3 className={`font-bold text-lg truncate ${themeStyles.titleClass}`}>
                {player.player_name}
              </h3>
            </div>
            <span className={themeStyles.badgeClass}>
              {themeStyles.badge}
            </span>
          </div>

          <div className={`h-px mb-3 ${themeStyles.dividerClass}`} />

          <div className="space-y-2 text-sm">
            <div className={`flex items-center gap-2 ${themeStyles.allianceTextClass}`}>
              <span className="text-base">{'\u{1F3C6}'}</span>
              <span className="truncate font-medium">{player.target_alliance_name}</span>
            </div>

            <div className={`flex items-center gap-2 ${themeStyles.powerTextClass}`}>
              <span className="text-base">{'\u26A1'}</span>
              <span className="font-semibold">{formattedPower} Power</span>
            </div>

            <div className={`flex items-center gap-2 ${themeStyles.dateTextClass}`}>
              <span className="text-base">{'\u{1F4C5}'}</span>
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="flex justify-center mt-3 gap-0.5">
            <span className={`text-sm ${themeStyles.starClass}`}>{themeStyles.starChar}</span>
            <span className={`text-sm ${themeStyles.starClass}`}>{themeStyles.starChar}</span>
            <span className={`text-sm ${themeStyles.starClass}`}>{themeStyles.starChar}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function T10EliteCard({ player }: { player: ApprovedPlayer }) {
  return <EliteCard player={player} theme="gold" />;
}

function T9EliteCard({ player }: { player: ApprovedPlayer }) {
  return <EliteCard player={player} theme="silver" />;
}

function PlayerCard({ player }: { player: ApprovedPlayer }) {
  const isT10 = player.troop_level?.toUpperCase() === 'T10';
  const isT9 = player.troop_level?.toUpperCase() === 'T9';
  
  if (isT10) {
    return <T10EliteCard player={player} />;
  }

  if (isT9) {
    return <T9EliteCard player={player} />;
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
            <span className="text-4xl">{'\u{1F389}'}</span>
            <span>Welcome to the Family!</span>
            <span className="text-4xl">{'\u{1F389}'}</span>
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


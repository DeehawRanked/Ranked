'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { formatCountdownMs } from '@/lib/season';
import { CATEGORY_GRADIENT } from '@/lib/types';
import CategoryIcon from './CategoryIcon';

interface Props {
  endedSeason: string;   // YYYY-MM that just ended
  nextSeason: string;    // YYYY-MM about to start
  transitionEndsAt: Date;
}

export default function SeasonTransition({ endedSeason, nextSeason, transitionEndsAt }: Props) {
  const { state } = useStore();
  const [remaining, setRemaining] = useState(() =>
    formatCountdownMs(transitionEndsAt.getTime() - Date.now()),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(formatCountdownMs(transitionEndsAt.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [transitionEndsAt]);

  const [endYear, endMonth] = endedSeason.split('-').map(Number);
  const endedMonthName = new Date(endYear, endMonth - 1).toLocaleString('en-US', {
    month: 'long', year: 'numeric',
  });

  const [nextYear, nextMonthNum] = nextSeason.split('-').map(Number);
  const nextMonthName = new Date(nextYear, nextMonthNum - 1).toLocaleString('en-US', {
    month: 'long', year: 'numeric',
  });

  const seasonWinners = state.hallOfFame
    .filter((e) => e.season === endedSeason)
    .sort((a, b) => a.peakRank - b.peakRank)
    .slice(0, 3);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-950 to-black px-6 pt-16 pb-8 text-center border-b border-zinc-900">
        <div className="text-5xl mb-3">👑</div>
        <h1 className="text-white font-black text-3xl mb-1">Season Over</h1>
        <p className="text-zinc-400 text-sm">{endedMonthName} has ended</p>
      </div>

      {/* Countdown to new season */}
      <div className="px-6 py-6 text-center border-b border-zinc-900">
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-3">
          {nextMonthName} Season Starts In
        </p>
        <div className="flex items-end justify-center gap-3">
          {[
            { value: remaining.h, label: 'hrs' },
            { value: remaining.m, label: 'min' },
            { value: remaining.s, label: 'sec' },
          ].map(({ value, label }, i) => (
            <div key={label} className="flex items-end gap-3">
              {i > 0 && <span className="text-zinc-700 text-2xl font-black mb-1">:</span>}
              <div className="text-center">
                <div className="text-4xl font-black text-white tabular-nums leading-none">
                  {String(value).padStart(2, '0')}
                </div>
                <div className="text-zinc-600 text-xs mt-1">{label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-zinc-700 text-xs mt-4">
          Posting resumes at noon · Results finalize shortly
        </p>
      </div>

      {/* Winners */}
      <div className="px-4 py-6 flex-1">
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 text-center">
          {endedMonthName} Champions
        </p>

        {seasonWinners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-600 text-sm">Results are being tallied...</p>
          </div>
        ) : (
          <div className="space-y-4 max-w-lg mx-auto">
            {seasonWinners.map((entry, idx) => (
              <div
                key={entry.id}
                className={`relative overflow-hidden rounded-2xl border ${
                  idx === 0 ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                <div className="flex gap-3 p-4">
                  <div className="text-3xl shrink-0 mt-0.5">{medals[idx]}</div>
                  <div className="flex-1 min-w-0">
                    {entry.imageUrl ? (
                      <img
                        src={entry.imageUrl}
                        alt={entry.caption}
                        className="w-full h-40 object-cover rounded-xl mb-3"
                      />
                    ) : (
                      <div className={`w-full h-40 rounded-xl mb-3 bg-gradient-to-br ${CATEGORY_GRADIENT[entry.category]} flex items-center justify-center`}>
                        <CategoryIcon category={entry.category} size={40} className="opacity-30 text-white" />
                      </div>
                    )}
                    <p className="text-white font-bold text-sm leading-tight">{entry.caption}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-zinc-500 text-xs">@{entry.username}</span>
                      <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CategoryIcon category={entry.category} size={10} />{entry.category}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-white text-xs font-bold">❤️ {entry.likes.toLocaleString()}</span>
                      <span className="text-red-500 text-xs font-bold">#{entry.peakRank} Peak</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center border-t border-zinc-900">
        <p className="text-zinc-600 text-xs">
          Get your best shots ready — {nextMonthName} competition opens at noon.
        </p>
      </div>
    </div>
  );
}

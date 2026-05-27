'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

function getSeasonEndDate(season: string): Date {
  const [year, month] = season.split('-').map(Number);
  return new Date(year, month, 1);
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

export default function SeasonBanner() {
  const { state } = useStore();
  const endDate = getSeasonEndDate(state.season);
  const [remaining, setRemaining] = useState(() => formatCountdown(endDate.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(formatCountdown(endDate.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const [year, month] = state.season.split('-').map(Number);
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' });
  const { days, hours, minutes, seconds } = remaining;

  return (
    <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest">Season Live</span>
          </div>
          <h2 className="text-white font-black text-lg">{monthName} {year} Rankings</h2>
          <p className="text-zinc-500 text-xs mt-0.5">Rankings reset at month end</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Resets in</div>
          <div className="flex items-end gap-1">
            {[
              { value: days, label: 'd' },
              { value: hours, label: 'h' },
              { value: minutes, label: 'm' },
              { value: seconds, label: 's' },
            ].map(({ value, label }, i) => (
              <div key={label} className="flex items-end gap-1">
                {i > 0 && <span className="text-zinc-600 text-lg font-black leading-none mb-1">:</span>}
                <div className="text-center min-w-[1.5rem]">
                  <div className="text-2xl font-black text-white leading-none tabular-nums">
                    {label === 'd' ? value : String(value).padStart(2, '0')}
                  </div>
                  <div className="text-zinc-600 text-xs">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

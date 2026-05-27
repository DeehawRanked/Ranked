export type SeasonPhase = 'active' | 'transition';

export interface SeasonStatus {
  phase: SeasonPhase;
  activeSeason: string;       // YYYY-MM currently in play (or just ended)
  nextSeason: string;         // YYYY-MM about to start
  transitionEndsAt?: Date;    // noon on the 1st — only set during transition
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function getSeasonStatus(now = new Date()): SeasonStatus {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const day = now.getDate();
  const hours = now.getHours();

  // Transition window: 00:00 → 12:00 on the 1st of each month
  if (day === 1 && hours < 12) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const activeSeason = `${prevYear}-${pad(prevMonth + 1)}`;
    const nextSeason = `${year}-${pad(month + 1)}`;
    const transitionEndsAt = new Date(year, month, 1, 12, 0, 0);
    return { phase: 'transition', activeSeason, nextSeason, transitionEndsAt };
  }

  const activeSeason = `${year}-${pad(month + 1)}`;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const nextSeason = `${nextYear}-${pad(nextMonth + 1)}`;
  return { phase: 'active', activeSeason, nextSeason };
}

export function formatCountdownMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { h, m, s };
}

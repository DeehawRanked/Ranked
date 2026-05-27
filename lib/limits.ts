import { Post, UploadRecord, Category } from './types';

export const POST_LIMITS = {
  ACTIVE_PER_CATEGORY: 3,
  ACTIVE_TOTAL_MONTHLY: 15,
  UPLOADS_PER_DAY: 5,
} as const;

export interface UploadStatus {
  canUpload: boolean;
  blockedReason?: string;
  // Daily
  dailyUsed: number;
  dailyRemaining: number;
  // Monthly
  monthlyActiveUsed: number;
  monthlyActiveRemaining: number;
  // Category-specific (only when a category is selected)
  categoryUsed: number;
  categoryRemaining: number;
  // Cooldown — ISO string of when uploads reset (midnight)
  cooldownUntil?: string;
  isDuplicate?: boolean;
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function tomorrowMidnight(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getActiveCategoryCount(
  posts: Post[],
  userId: string,
  category: Category,
  season: string,
): number {
  return posts.filter(
    (p) =>
      p.userId === userId &&
      p.category === category &&
      p.season === season &&
      p.status === 'active',
  ).length;
}

export function getActiveMonthlyCount(
  posts: Post[],
  userId: string,
  season: string,
): number {
  return posts.filter(
    (p) => p.userId === userId && p.season === season && p.status === 'active',
  ).length;
}

export function getDailyUploadCount(
  history: UploadRecord[],
  userId: string,
): number {
  const start = todayStart().getTime();
  return history.filter(
    (r) => r.userId === userId && new Date(r.uploadedAt).getTime() >= start,
  ).length;
}

export function isDuplicateUpload(
  history: UploadRecord[],
  userId: string,
  category: Category,
  season: string,
  filename: string,
): boolean {
  if (!filename) return false;
  return history.some(
    (r) =>
      r.userId === userId &&
      r.category === category &&
      r.season === season &&
      r.filename === filename,
  );
}

export function getUploadStatus(
  posts: Post[],
  history: UploadRecord[],
  userId: string,
  category: Category | '',
  season: string,
  filename = '',
): UploadStatus {
  const dailyUsed = getDailyUploadCount(history, userId);
  const dailyRemaining = Math.max(0, POST_LIMITS.UPLOADS_PER_DAY - dailyUsed);

  const monthlyActiveUsed = getActiveMonthlyCount(posts, userId, season);
  const monthlyActiveRemaining = Math.max(
    0,
    POST_LIMITS.ACTIVE_TOTAL_MONTHLY - monthlyActiveUsed,
  );

  const categoryUsed = category
    ? getActiveCategoryCount(posts, userId, category, season)
    : 0;
  const categoryRemaining = Math.max(
    0,
    POST_LIMITS.ACTIVE_PER_CATEGORY - categoryUsed,
  );

  const isDup = category
    ? isDuplicateUpload(history, userId, category, season, filename)
    : false;

  let canUpload = true;
  let blockedReason: string | undefined;
  let cooldownUntil: string | undefined;

  if (dailyRemaining === 0) {
    canUpload = false;
    blockedReason = `Daily limit reached (${POST_LIMITS.UPLOADS_PER_DAY}/day). Resets at midnight.`;
    cooldownUntil = tomorrowMidnight();
  } else if (monthlyActiveRemaining === 0) {
    canUpload = false;
    blockedReason = `Monthly active post limit reached (${POST_LIMITS.ACTIVE_TOTAL_MONTHLY} active posts). Archive or wait for season reset.`;
  } else if (category && categoryRemaining === 0) {
    canUpload = false;
    blockedReason = `${category} is full. You have ${POST_LIMITS.ACTIVE_PER_CATEGORY}/${POST_LIMITS.ACTIVE_PER_CATEGORY} active posts in this category. Switch category or wait for one to go inactive.`;
  } else if (isDup) {
    canUpload = false;
    blockedReason = `Duplicate detected. This image was already posted in ${category} this season.`;
  }

  return {
    canUpload,
    blockedReason,
    dailyUsed,
    dailyRemaining,
    monthlyActiveUsed,
    monthlyActiveRemaining,
    categoryUsed,
    categoryRemaining,
    cooldownUntil,
    isDuplicate: isDup,
  };
}

export function formatCooldown(isoString: string): string {
  const until = new Date(isoString).getTime();
  const ms = Math.max(0, until - Date.now());
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

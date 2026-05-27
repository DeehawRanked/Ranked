import { Post, PostTrend } from './types';

// ─── Internal helpers ────────────────────────────────────────────────────────

function effectiveNow(offset: number): number {
  return Date.now() + offset * 3_600_000;
}

function hoursActive(post: Post, offset: number): number {
  return Math.max(0.5, (effectiveNow(offset) - new Date(post.createdAt).getTime()) / 3_600_000);
}

// Raw velocity = total engagement divided by hours alive.
// Returns engagements/hour.
function rawVelocity(post: Post, offset: number): number {
  const totalEngagement = post.likes + post.comments.length * 2 + post.shares * 3;
  return totalEngagement / hoursActive(post, offset);
}

// ─── Public scoring API ──────────────────────────────────────────────────────

export function calculateVelocityBonus(post: Post, offset = 0): number {
  return Math.floor(rawVelocity(post, offset) * 8);
}

export function calculateScore(post: Post, offset = 0): number {
  const hours = hoursActive(post, offset);
  const agePenalty = Math.floor(hours * 0.8);
  const velocityBonus = calculateVelocityBonus(post, offset);
  const base = post.likes * 3 + post.comments.length * 2 + post.shares * 4;
  const reportPenalty = (post.reports?.length ?? 0) * 20;
  return Math.max(0, base + velocityBonus - agePenalty - reportPenalty);
}

// ─── Trend detection ─────────────────────────────────────────────────────────

export function getPostTrend(post: Post, offset = 0): PostTrend {
  const hours = (effectiveNow(offset) - new Date(post.createdAt).getTime()) / 3_600_000;

  // Just posted — hasn't had time to establish a score history yet
  if (hours < 4 && post.likes < 5) return 'new_challenger';

  if (post.previousScore === undefined) return 'stable';

  const delta = post.score - post.previousScore;
  const vel = rawVelocity(post, offset);

  // Trending: big velocity burst that caused a noticeable score jump
  if (vel > 15 && delta > 30) return 'trending';
  if (delta > 8) return 'rising';
  if (delta < -8) return 'falling';
  return 'stable';
}

// positive number = moved up, negative = moved down
export function getRankMovement(post: Post): number {
  if (post.previousRank == null || post.currentRank == null) return 0;
  return post.previousRank - post.currentRank;
}

// ─── Time formatting ─────────────────────────────────────────────────────────

export function formatTimeAgo(dateStr: string, offset = 0): string {
  const diffMs = effectiveNow(offset) - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  const hrs = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

// ─── Sorted post lists ───────────────────────────────────────────────────────

export function isInactive(post: Post, offset = 0): boolean {
  if (post.likes > 0) return false;
  const hours = (effectiveNow(offset) - new Date(post.createdAt).getTime()) / 3_600_000;
  return hours >= 72;
}

export function getHoursRemaining(post: Post, offset = 0): number {
  const hours = (effectiveNow(offset) - new Date(post.createdAt).getTime()) / 3_600_000;
  return Math.max(0, 72 - hours);
}

export function getRankedPosts(posts: Post[]): Post[] {
  return [...posts].filter((p) => p.status === 'active').sort((a, b) => b.score - a.score);
}

// Sorted by engagement velocity — fastest-rising posts appear first
export function getVelocityRankedPosts(posts: Post[], offset = 0): Post[] {
  return [...posts]
    .filter((p) => p.status === 'active')
    .sort((a, b) => rawVelocity(b, offset) - rawVelocity(a, offset));
}

// Active posts posted in the last 24h, sorted by engagement velocity (early momentum first).
// Pass limit to cap results; omit for all matching posts.
export function getJustDroppedPosts(posts: Post[], offset = 0, limit?: number): Post[] {
  const now = effectiveNow(offset);
  const result = [...posts]
    .filter((p) => p.status === 'active' && now - new Date(p.createdAt).getTime() < 86_400_000)
    .sort((a, b) => rawVelocity(b, offset) - rawVelocity(a, offset));
  return limit !== undefined ? result.slice(0, limit) : result;
}

export function getTopByCategory(posts: Post[]): Record<string, Post | undefined> {
  const result: Record<string, Post | undefined> = {};
  for (const post of posts.filter((p) => p.status === 'active')) {
    if (!result[post.category] || post.score > result[post.category]!.score) {
      result[post.category] = post;
    }
  }
  return result;
}

// Assign currentRank to all active posts in-place, returns a new array
export function assignCurrentRanks(posts: Post[]): Post[] {
  const activeSorted = [...posts]
    .filter((p) => p.status === 'active')
    .sort((a, b) => b.score - a.score);

  const rankMap = new Map(activeSorted.map((p, i) => [p.id, i + 1]));

  return posts.map((p) => {
    const rank = rankMap.get(p.id);
    if (rank === undefined) return p;
    return { ...p, currentRank: rank };
  });
}

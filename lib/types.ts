export type Category =
  | 'Cars'
  | 'Fits'
  | 'Pets'
  | 'Food'
  | 'Setups & Spaces'
  | 'Travel'
  | 'Fitness'
  | 'Outdoors';

export const CATEGORIES: Category[] = [
  'Cars', 'Fits', 'Pets', 'Food', 'Setups & Spaces', 'Travel', 'Fitness', 'Outdoors',
];

export const CATEGORY_EMOJI: Record<Category, string> = {
  Cars: '🚗',
  Fits: '👔',
  Pets: '🐾',
  Food: '🍔',
  'Setups & Spaces': '🖥️',
  Travel: '✈️',
  Fitness: '💪',
  Outdoors: '🏔️',
};

export const CATEGORY_GRADIENT: Record<Category, string> = {
  Cars: 'from-slate-800 to-slate-900',
  Fits: 'from-purple-900 to-slate-900',
  Pets: 'from-amber-900 to-slate-900',
  Food: 'from-orange-900 to-slate-900',
  'Setups & Spaces': 'from-blue-900 to-slate-900',
  Travel: 'from-cyan-900 to-slate-900',
  Fitness: 'from-red-900 to-slate-900',
  Outdoors: 'from-green-900 to-slate-900',
};

export const CATEGORY_DESCRIPTION: Record<Category, string> = {
  Cars: 'Your ride, modified builds, or shots on the road',
  Fits: 'Daily wear, special occasions, and personal style',
  Pets: 'Cats, dogs, and every animal in between',
  Food: 'Home cooking, restaurant finds, anything delicious',
  'Setups & Spaces': 'Desk setups, gaming rigs, room decor, and living spaces',
  Travel: 'Destinations, landmarks, and adventures away from home',
  Fitness: 'Gym sessions, runs, sports, and physical progress',
  Outdoors: 'Nature, hiking, landscapes, and the open world',
};

export type PostStatus = 'active' | 'inactive' | 'archived' | 'hall_of_fame' | 'under_review';

export type BoostTier = 'spark' | 'fire' | 'viral';

export interface BoostTierConfig {
  label: string;
  price: number;
  impressions: number;
  icon: string;
}

export const BOOST_TIERS: Record<BoostTier, BoostTierConfig> = {
  spark: { label: 'Spark',  price: 0.99, impressions: 500,    icon: '✨' },
  fire:  { label: 'Fire',   price: 2.99, impressions: 2_000,  icon: '🔥' },
  viral: { label: 'Viral',  price: 7.99, impressions: 10_000, icon: '🚀' },
};

export interface Boost {
  tier: BoostTier;
  impressionsTotal: number;
  impressionsRemaining: number;
  purchasedAt: string;
}

export type PostTrend = 'trending' | 'rising' | 'falling' | 'new_challenger' | 'stable';

export type ReportReason = 'nudity' | 'ai_generated' | 'racism';

export interface Report {
  userId: string;
  reason: ReportReason;
  reportedAt: string;
}

export const REPORT_FLAG_THRESHOLD = 7;   // show warning badge
export const DAILY_REPORT_LIMIT = 3;      // max reports a user can submit per day

// Review threshold scales with post engagement so brigading popular posts is hard.
// Requires at least 10 reports, OR 20% of the post's like count — whichever is higher.
export function getReportReviewThreshold(likes: number): number {
  return Math.max(10, Math.floor(likes * 0.2));
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
  parentId?: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  caption: string;
  imageUrl: string;
  images?: string[];
  category: Category;
  likes: number;
  comments: Comment[];
  shares: number;
  views: number;
  createdAt: string;
  status: PostStatus;
  season: string;
  score: number;
  peakRank?: number;
  likedBy: string[];
  previousScore?: number;
  previousRank?: number;
  currentRank?: number;
  uploadFilename?: string;
  reports?: Report[];
  boost?: Boost;
}

export type AchievementType =
  | 'Former #1 Overall'
  | '7-Day Survivor'
  | 'Category Champion'
  | 'Upset Win'
  | 'Top 10 Finish';

export interface Achievement {
  type: AchievementType;
  earnedAt: string;
  details?: string;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  website?: string;
}

export interface User {
  id: string;
  username: string;
  bio: string;
  avatar: string;
  avatarUrl?: string;
  followers: number;
  following: number;
  totalLikes: number;
  highestRank: number;
  monthlyWins: number;
  survivalRate: number;
  achievements: Achievement[];
  joinedAt: string;
  socialLinks?: SocialLinks;
  accountDisabled?: boolean;
  followingIds?: string[];
  currentStreak?: number;
  longestStreak?: number;
}

export interface HallOfFameEntry {
  id: string;
  postId: string;
  userId: string;
  username: string;
  caption: string;
  imageUrl: string;
  images?: string[];
  category: Category;
  likes: number;
  commentsCount: number;
  comments?: Comment[];
  peakRank: number;
  season: string;
  winningMonth: string;
  isOverallWinner: boolean;
}

export interface UploadRecord {
  postId: string;
  userId: string;
  category: Category;
  season: string;
  filename: string;
  uploadedAt: string;
}

export interface AppState {
  posts: Post[];
  currentUser: User;
  season: string;
  hallOfFame: HallOfFameEntry[];
  simulatedHoursOffset: number;
  uploadHistory: UploadRecord[];
  devMode: boolean;
  seenSponsoredPostIds: string[];
  disabledActivePostIds: string[];
  hasMorePosts: boolean;
  postsPage: number;
}

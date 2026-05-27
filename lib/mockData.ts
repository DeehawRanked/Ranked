import { Post, User, HallOfFameEntry, UploadRecord } from './types';
import { calculateScore, assignCurrentRanks } from './ranking';

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

export const CURRENT_SEASON = '2026-05';

export const MOCK_USERS: User[] = [
  {
    id: 'user_1',
    username: 'deehaw',
    bio: 'Built different. Post. Rank. Survive.',
    avatar: '',
    followers: 1240,
    following: 312,
    totalLikes: 8430,
    highestRank: 1,
    monthlyWins: 2,
    survivalRate: 87,
    joinedAt: '2025-01-15',
    achievements: [
      { type: 'Former #1 Overall', earnedAt: '2026-03-01', details: 'March 2026' },
      { type: 'Category Champion', earnedAt: '2026-04-01', details: 'Cars — April 2026' },
      { type: '7-Day Survivor', earnedAt: '2026-02-08', details: '7 days without going inactive' },
      { type: 'Top 10 Finish', earnedAt: '2026-01-01', details: 'January 2026' },
    ],
    socialLinks: {
      instagram: '',
      tiktok: '',
      youtube: '',
      website: '',
    },
  },
];

export const CURRENT_USER = MOCK_USERS[0];

function makePost(
  overrides: Partial<Post> & Pick<Post, 'id' | 'caption' | 'category' | 'likes' | 'shares'>,
): Post {
  const base: Post = {
    userId: 'user_1',
    username: 'deehaw',
    imageUrl: '',
    comments: [],
    createdAt: hoursAgo(12),
    status: 'active',
    season: CURRENT_SEASON,
    score: 0,
    peakRank: undefined,
    likedBy: [],
    uploadFilename: '',
    views: 0,
    ...overrides,
  };
  base.score = calculateScore(base);
  return base;
}

// Build posts without rank data first
const rawPosts: Post[] = [
  makePost({
    id: 'p5',
    caption: 'Gas station meal that somehow hits different',
    category: 'Food',
    likes: 310,
    shares: 58,
    views: 4800,
    createdAt: hoursAgo(3),
    comments: [
      { id: 'c8', userId: 'u9', username: 'foodhead', text: 'Every time bro', createdAt: hoursAgo(2) },
      { id: 'c9', userId: 'u10', username: 'latenighteat', text: 'Underrated', createdAt: hoursAgo(1) },
    ],
    // Was #3 before, now rocketed up — trending
    previousRank: 3,
    previousScore: 1200,
  }),
  makePost({
    id: 'p3',
    caption: 'This dog runs the house no debate',
    category: 'Pets',
    likes: 215,
    shares: 41,
    views: 3200,
    createdAt: hoursAgo(5),
    comments: [
      { id: 'c4', userId: 'u5', username: 'dogdad', text: '😭😭 icon', createdAt: hoursAgo(4) },
      { id: 'c5', userId: 'u6', username: 'petlover', text: 'I need one', createdAt: hoursAgo(3) },
      { id: 'c6', userId: 'u7', username: 'barkcity', text: 'Best post this month', createdAt: hoursAgo(2) },
    ],
    // Was #1, slipping — falling
    previousRank: 1,
    previousScore: 1500,
  }),
  makePost({
    id: 'p8',
    caption: 'These Jordans are not leaving the case',
    category: 'Fits',
    likes: 255,
    shares: 44,
    views: 3900,
    createdAt: hoursAgo(10),
    comments: [
      { id: 'c12', userId: 'u13', username: 'sneakerhead', text: 'DS?', createdAt: hoursAgo(9) },
      { id: 'c13', userId: 'u14', username: 'kicksgod', text: 'Grail status', createdAt: hoursAgo(8) },
    ],
    // Steady at #3, slight fall
    previousRank: 2,
    previousScore: 1300,
  }),
  makePost({
    id: 'p6',
    caption: 'NYC at 2am — nobody else around',
    category: 'Travel',
    likes: 189,
    shares: 33,
    views: 2700,
    createdAt: hoursAgo(15),
    comments: [
      { id: 'c10', userId: 'u11', username: 'citynight', text: 'This is cinematic', createdAt: hoursAgo(13) },
    ],
    // Climbing into top 5 from #6
    previousRank: 6,
    previousScore: 780,
  }),
  makePost({
    id: 'p1',
    caption: 'Late night gas station shot',
    category: 'Cars',
    likes: 142,
    shares: 23,
    views: 2100,
    createdAt: hoursAgo(8),
    comments: [
      { id: 'c1', userId: 'u2', username: 'fastlane99', text: 'This goes hard', createdAt: hoursAgo(7) },
      { id: 'c2', userId: 'u3', username: 'nightcruise', text: 'Clean af', createdAt: hoursAgo(6) },
    ],
    // Fell from #4
    previousRank: 4,
    previousScore: 760,
  }),
  // p10 very new — rising fast via velocity
  makePost({
    id: 'p10',
    caption: 'Skyline hits different from the rooftop',
    category: 'Travel',
    likes: 31,
    shares: 5,
    createdAt: hoursAgo(1),
    previousRank: 9,
    previousScore: 90,
  }),
  // p9 new challenger
  makePost({
    id: 'p9',
    caption: 'Woke up and chose violence (fit)',
    category: 'Fits',
    likes: 48,
    shares: 8,
    createdAt: hoursAgo(2),
    previousRank: 8,
    previousScore: 150,
  }),
  makePost({
    id: 'p7',
    caption: '6 months of reps. Results speak.',
    category: 'Fitness',
    likes: 122,
    shares: 19,
    createdAt: hoursAgo(40),
    comments: [
      { id: 'c11', userId: 'u12', username: 'gymrat', text: 'Insane progress', createdAt: hoursAgo(38) },
    ],
    // Old post, slowly decaying from #5
    previousRank: 5,
    previousScore: 510,
  }),
  makePost({
    id: 'p2',
    caption: 'Simple black fit — less is more',
    category: 'Fits',
    likes: 98,
    shares: 12,
    createdAt: hoursAgo(20),
    comments: [
      { id: 'c3', userId: 'u4', username: 'styledrop', text: 'W fit', createdAt: hoursAgo(18) },
    ],
    previousRank: 7,
    previousScore: 380,
  }),
  makePost({
    id: 'p4',
    caption: 'Clean desk setup — minimal, productive',
    category: 'Setups & Spaces',
    likes: 77,
    shares: 9,
    createdAt: hoursAgo(30),
    comments: [
      { id: 'c7', userId: 'u8', username: 'techdesk', text: 'Monitor brand?', createdAt: hoursAgo(28) },
    ],
    previousRank: 10,
    previousScore: 270,
  }),
  // Near inactive — danger zone
  makePost({
    id: 'p11',
    caption: 'Thought this fit was fire idk',
    category: 'Fits',
    likes: 2,
    shares: 0,
    createdAt: hoursAgo(68),
    previousRank: 11,
    previousScore: 5,
  }),
  makePost({
    id: 'p12',
    caption: 'Sunday meal prep grind',
    category: 'Food',
    likes: 1,
    shares: 0,
    createdAt: hoursAgo(70),
    previousRank: 12,
    previousScore: 2,
  }),
];

// Assign initial currentRank based on score order
const ranked = assignCurrentRanks(rawPosts);

export const SEED_POSTS: Post[] = ranked.map((p, i) => ({
  ...p,
  peakRank: i < 5 ? (p.currentRank ?? i + 1) : undefined,
}));

// Seed upload history — one record per seed post (no filenames since they're mock)
export const SEED_UPLOAD_HISTORY: UploadRecord[] = SEED_POSTS.filter(
  (p) => p.userId === 'user_1',
).map((p) => ({
  postId: p.id,
  userId: p.userId,
  category: p.category,
  season: p.season,
  filename: '',
  uploadedAt: p.createdAt,
}));

export const SEED_HALL_OF_FAME: HallOfFameEntry[] = [
  {
    id: 'hof1',
    postId: 'old_p1',
    userId: 'user_1',
    username: 'deehaw',
    caption: 'The 911 that started it all',
    imageUrl: '',
    category: 'Cars',
    likes: 1204,
    commentsCount: 87,
    peakRank: 1,
    season: '2026-04',
    winningMonth: 'April 2026',
    isOverallWinner: true,
  },
  {
    id: 'hof2',
    postId: 'old_p2',
    userId: 'u_nova',
    username: 'nova.fits',
    caption: 'All black everything — March winner',
    imageUrl: '',
    category: 'Fits',
    likes: 988,
    commentsCount: 62,
    peakRank: 1,
    season: '2026-03',
    winningMonth: 'March 2026',
    isOverallWinner: false,
  },
  {
    id: 'hof3',
    postId: 'old_p3',
    userId: 'u_snkr',
    username: 'kicksgod',
    caption: 'The pair that broke the internet',
    imageUrl: '',
    category: 'Fits',
    likes: 1455,
    commentsCount: 130,
    peakRank: 1,
    season: '2026-03',
    winningMonth: 'March 2026',
    isOverallWinner: true,
  },
  {
    id: 'hof4',
    postId: 'old_p4',
    userId: 'u_city',
    username: 'urbanframe',
    caption: 'Manhattan midnight — February',
    imageUrl: '',
    category: 'Travel',
    likes: 876,
    commentsCount: 54,
    peakRank: 2,
    season: '2026-02',
    winningMonth: 'February 2026',
    isOverallWinner: false,
  },
  {
    id: 'hof5',
    postId: 'old_p5',
    userId: 'u_pet',
    username: 'fluffyboss',
    caption: 'Golden hour with the golden retriever',
    imageUrl: '',
    category: 'Pets',
    likes: 1102,
    commentsCount: 98,
    peakRank: 1,
    season: '2026-02',
    winningMonth: 'February 2026',
    isOverallWinner: true,
  },
];

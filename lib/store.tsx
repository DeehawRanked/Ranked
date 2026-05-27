'use client';

// Session-scoped view deduplication — resets on app restart, never persisted
const _sessionViewedIds = new Set<string>();

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  fetchSupabasePosts,
  likeSupabasePost,
  addSupabaseComment,
  reportSupabasePost,
  recordSupabaseView,
  shareSupabasePost,
  deleteSupabasePost,
  updateSupabaseCaption,
  updateProfileData,
  uploadAvatarImage,
  fetchFollowingIds,
  followSupabaseUser,
  unfollowSupabaseUser,
  saveSupabaseBoost,
  decrementSupabaseBoostImpression,
  SupabaseProfile,
} from './db';
import { AppState, Post, Comment, HallOfFameEntry, UploadRecord, SocialLinks, Report, ReportReason, DAILY_REPORT_LIMIT, getReportReviewThreshold, BoostTier, BOOST_TIERS, Boost } from './types';
import {
  SEED_POSTS,
  SEED_HALL_OF_FAME,
  SEED_UPLOAD_HISTORY,
  CURRENT_USER,
  CURRENT_SEASON,
} from './mockData';
import {
  calculateScore,
  isInactive,
  getRankedPosts,
  assignCurrentRanks,
} from './ranking';

const STORAGE_KEY = 'ranked_state_v7';

function makeInitialState(): AppState {
  return {
    posts: SEED_POSTS,
    currentUser: CURRENT_USER,
    season: CURRENT_SEASON,
    hallOfFame: SEED_HALL_OF_FAME,
    simulatedHoursOffset: 0,
    uploadHistory: SEED_UPLOAD_HISTORY,
    devMode: false,
    seenSponsoredPostIds: [],
    disabledActivePostIds: [],
    hasMorePosts: false,
    postsPage: 0,
  };
}

function loadState(): AppState {
  if (typeof window === 'undefined') return makeInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return makeInitialState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.uploadHistory) parsed.uploadHistory = SEED_UPLOAD_HISTORY;
    if (parsed.devMode === undefined) parsed.devMode = false;
    if (!parsed.currentUser.socialLinks) parsed.currentUser.socialLinks = {};
    if (!parsed.seenSponsoredPostIds) parsed.seenSponsoredPostIds = [];
    if (!parsed.disabledActivePostIds) parsed.disabledActivePostIds = [];
    if (parsed.currentUser.accountDisabled === undefined) parsed.currentUser.accountDisabled = false;
    if (!parsed.currentUser.followingIds) parsed.currentUser.followingIds = [];
    if (parsed.currentUser.currentStreak === undefined) parsed.currentUser.currentStreak = 0;
    if (parsed.currentUser.longestStreak === undefined) parsed.currentUser.longestStreak = 0;
    if (parsed.hasMorePosts === undefined) parsed.hasMorePosts = false;
    if (parsed.postsPage === undefined) parsed.postsPage = 0;
    return parsed;
  } catch {
    return makeInitialState();
  }
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage quota exceeded — retry without image data to preserve post metadata
    try {
      const trimmed = {
        ...state,
        posts: state.posts.map((p) => ({ ...p, imageUrl: '', images: undefined })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // still failing, nothing we can do
    }
  }
}

function recalculate(state: AppState): Post[] {
  const rescored = state.posts.map((p) => ({
    ...p,
    previousScore: p.score,
    score: calculateScore(p, state.simulatedHoursOffset),
  }));
  return assignCurrentRanks(rescored);
}

type Action =
  | { type: 'SET_POSTS'; posts: Post[]; hasMore: boolean }
  | { type: 'APPEND_POSTS'; posts: Post[]; hasMore: boolean }
  | { type: 'SET_PROFILE'; profile: SupabaseProfile }
  | { type: 'LIKE_POST'; postId: string }
  | { type: 'ADD_COMMENT'; postId: string; text: string; parentId?: string }
  | { type: 'ADD_POST'; post: Post; record: UploadRecord }
  | { type: 'SIMULATE_72H' }
  | { type: 'END_SEASON' }
  | { type: 'RESET_STATE' }
  | { type: 'RECALCULATE_SCORES' }
  | { type: 'UPDATE_PROFILE'; bio: string; socialLinks: SocialLinks }
  | { type: 'UPDATE_AVATAR'; avatarUrl: string }
  | { type: 'SET_USERNAME'; username: string; userId: string }
  | { type: 'REPORT_POST'; postId: string; reason: ReportReason }
  | { type: 'BOOST_POST'; postId: string; tier: BoostTier }
  | { type: 'RECORD_VIEW'; postId: string }
  | { type: 'CONSUME_BOOST_IMPRESSION'; postId: string }
  | { type: 'MARK_SPONSORED_SEEN'; postId: string }
  | { type: 'TOGGLE_ACCOUNT_DISABLED' }
  | { type: 'TOGGLE_DEV_MODE' }
  | { type: 'DELETE_POST'; postId: string }
  | { type: 'EDIT_POST_CAPTION'; postId: string; caption: string }
  | { type: 'SHARE_POST'; postId: string }
  | { type: 'FOLLOW_USER'; userId: string }
  | { type: 'UNFOLLOW_USER'; userId: string }
  | { type: 'SET_FOLLOWING_IDS'; ids: string[] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_POSTS': {
      const scored = action.posts.map((p) => ({
        ...p,
        score: calculateScore(p, state.simulatedHoursOffset),
      }));
      return { ...state, posts: assignCurrentRanks(scored), hasMorePosts: action.hasMore, postsPage: 1 };
    }
    case 'APPEND_POSTS': {
      const existingIds = new Set(state.posts.map((p) => p.id));
      const merged = [
        ...state.posts,
        ...action.posts.filter((p) => !existingIds.has(p.id)).map((p) => ({
          ...p,
          score: calculateScore(p, state.simulatedHoursOffset),
        })),
      ];
      return {
        ...state,
        posts: assignCurrentRanks(merged),
        hasMorePosts: action.hasMore,
        postsPage: state.postsPage + 1,
      };
    }

    case 'SET_PROFILE': {
      const { id, username, bio, avatarUrl, socialLinks, followersCount, followingCount } = action.profile;
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          id,
          username,
          bio,
          avatarUrl,
          socialLinks,
          followers: followersCount,
          following: followingCount,
        },
        posts: state.posts.map((p) =>
          p.userId === state.currentUser.id ? { ...p, userId: id, username } : p,
        ),
      };
    }

    case 'LIKE_POST': {
      const uid = state.currentUser.id;
      const posts = state.posts.map((p) => {
        if (p.id !== action.postId) return p;
        const already = p.likedBy.includes(uid);
        const likes = already ? p.likes - 1 : p.likes + 1;
        const likedBy = already ? p.likedBy.filter((id) => id !== uid) : [...p.likedBy, uid];
        const updated = { ...p, likes, likedBy };
        updated.score = calculateScore(updated, state.simulatedHoursOffset);
        return updated;
      });
      return { ...state, posts: assignCurrentRanks(posts) };
    }

    case 'ADD_COMMENT': {
      const posts = state.posts.map((p) => {
        if (p.id !== action.postId) return p;
        const comment: Comment = {
          id: `c_${Date.now()}`,
          userId: state.currentUser.id,
          username: state.currentUser.username,
          text: action.text,
          createdAt: new Date().toISOString(),
          parentId: action.parentId,
        };
        const updated = { ...p, comments: [...p.comments, comment] };
        updated.score = calculateScore(updated, state.simulatedHoursOffset);
        return updated;
      });
      return { ...state, posts: assignCurrentRanks(posts) };
    }

    case 'ADD_POST': {
      const newPost = {
        ...action.post,
        previousScore: 0,
        currentRank: undefined,
        score: calculateScore(action.post, state.simulatedHoursOffset),
      };
      const posts = assignCurrentRanks([newPost, ...state.posts]);
      const newHistory = [...state.uploadHistory, action.record];
      // Streak: count consecutive weeks (Sun–Sat buckets) ending at current week
      const weekKey = (d: string) => Math.floor(new Date(d).getTime() / (7 * 24 * 60 * 60 * 1000));
      const currentWeek = weekKey(new Date().toISOString());
      const userWeeks = new Set(newHistory.filter(r => r.userId === state.currentUser.id).map(r => weekKey(r.uploadedAt)));
      let streak = 0;
      for (let w = currentWeek; userWeeks.has(w); w--) streak++;
      const currentStreak = Math.max(1, streak);
      const longestStreak = Math.max(currentStreak, state.currentUser.longestStreak ?? 0);
      return {
        ...state,
        posts,
        uploadHistory: newHistory,
        currentUser: { ...state.currentUser, currentStreak, longestStreak },
      };
    }

    case 'SIMULATE_72H': {
      const newOffset = state.simulatedHoursOffset + 72;
      const posts = state.posts.map((p) => {
        if (p.status !== 'active') return p;
        if (isInactive(p, newOffset)) return { ...p, status: 'inactive' as const };
        return { ...p, score: calculateScore(p, newOffset) };
      });
      const withSnapshot = assignCurrentRanks(posts).map((p) => ({
        ...p,
        previousRank: p.currentRank ?? p.previousRank,
        previousScore: p.score,
      }));
      return { ...state, posts: withSnapshot, simulatedHoursOffset: newOffset };
    }

    case 'END_SEASON': {
      const ranked = getRankedPosts(state.posts);
      const newHof: HallOfFameEntry[] = ranked.slice(0, 3).map((post, idx) => ({
        id: `hof_${Date.now()}_${idx}`,
        postId: post.id,
        userId: post.userId,
        username: post.username,
        caption: post.caption,
        imageUrl: post.imageUrl,
        category: post.category,
        likes: post.likes,
        commentsCount: post.comments.length,
        peakRank: idx + 1,
        season: state.season,
        winningMonth: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        isOverallWinner: idx === 0,
      }));
      const posts = state.posts.map((p) =>
        p.status === 'active' || p.status === 'inactive'
          ? { ...p, status: 'archived' as const }
          : p,
      );
      const [year, month] = state.season.split('-').map(Number);
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const newSeason = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      return {
        ...state,
        posts,
        hallOfFame: [...newHof, ...state.hallOfFame],
        season: newSeason,
        simulatedHoursOffset: 0,
      };
    }

    case 'RECALCULATE_SCORES':
      return { ...state, posts: recalculate(state) };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          bio: action.bio,
          socialLinks: action.socialLinks,
        },
      };

    case 'REPORT_POST': {
      const uid = state.currentUser.id;
      const today = new Date().toISOString().slice(0, 10);

      // Enforce daily report cap across all posts
      const reportsToday = state.posts
        .flatMap((p) => p.reports ?? [])
        .filter((r) => r.userId === uid && r.reportedAt.slice(0, 10) === today).length;
      if (reportsToday >= DAILY_REPORT_LIMIT) return state;

      const posts = state.posts.map((p) => {
        if (p.id !== action.postId) return p;
        const existing = p.reports ?? [];
        // Block: already reported, or reporter liked the post
        if (existing.some((r) => r.userId === uid)) return p;
        if (p.likedBy.includes(uid)) return p;
        const report: Report = { userId: uid, reason: action.reason, reportedAt: new Date().toISOString() };
        const reports = [...existing, report];
        // Threshold scales with engagement — harder to brigade popular posts
        const reviewThreshold = getReportReviewThreshold(p.likes);
        const status = reports.length >= reviewThreshold ? 'under_review' as const : p.status;
        const updated = { ...p, reports, status };
        updated.score = calculateScore(updated, state.simulatedHoursOffset);
        return updated;
      });
      return { ...state, posts: assignCurrentRanks(posts) };
    }

    case 'UPDATE_AVATAR':
      return { ...state, currentUser: { ...state.currentUser, avatarUrl: action.avatarUrl } };

    case 'SET_USERNAME':
      return {
        ...state,
        currentUser: { ...state.currentUser, id: action.userId, username: action.username },
        posts: state.posts.map((p) =>
          p.userId === state.currentUser.id ? { ...p, userId: action.userId, username: action.username } : p,
        ),
      };

    case 'BOOST_POST': {
      const cfg = BOOST_TIERS[action.tier];
      const boost: Boost = {
        tier: action.tier,
        impressionsTotal: cfg.impressions,
        impressionsRemaining: cfg.impressions,
        purchasedAt: new Date().toISOString(),
      };
      return {
        ...state,
        posts: state.posts.map((p) => (p.id === action.postId ? { ...p, boost } : p)),
      };
    }

    case 'RECORD_VIEW':
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.postId ? { ...p, views: (p.views ?? 0) + 1 } : p,
        ),
      };

    case 'CONSUME_BOOST_IMPRESSION': {
      const posts = state.posts.map((p) => {
        if (p.id !== action.postId || !p.boost) return p;
        const remaining = p.boost.impressionsRemaining - 1;
        const boost = remaining <= 0 ? undefined : { ...p.boost, impressionsRemaining: remaining };
        return { ...p, boost };
      });
      return { ...state, posts };
    }

    case 'MARK_SPONSORED_SEEN': {
      const seen = [...state.seenSponsoredPostIds, action.postId];
      const activeBoostedIds = state.posts
        .filter((p) => p.status === 'active' && (p.boost?.impressionsRemaining ?? 0) > 0)
        .map((p) => p.id);
      // Reset when user has seen the entire pool so rotation starts fresh
      const allSeen = activeBoostedIds.every((id) => seen.includes(id));
      return { ...state, seenSponsoredPostIds: allSeen ? [] : seen };
    }

    case 'TOGGLE_ACCOUNT_DISABLED': {
      const uid = state.currentUser.id;
      const disabling = !state.currentUser.accountDisabled;
      let posts: Post[];
      let disabledActivePostIds: string[];
      if (disabling) {
        // Save active post IDs and mark them inactive
        disabledActivePostIds = state.posts
          .filter((p) => p.userId === uid && p.status === 'active')
          .map((p) => p.id);
        posts = state.posts.map((p) =>
          disabledActivePostIds.includes(p.id) ? { ...p, status: 'inactive' as const } : p,
        );
      } else {
        // Restore previously active posts
        disabledActivePostIds = [];
        posts = state.posts.map((p) =>
          state.disabledActivePostIds.includes(p.id) ? { ...p, status: 'active' as const } : p,
        );
        posts = assignCurrentRanks(posts.map((p) => ({ ...p, score: calculateScore(p, state.simulatedHoursOffset) })));
      }
      return {
        ...state,
        posts,
        disabledActivePostIds,
        currentUser: { ...state.currentUser, accountDisabled: disabling },
      };
    }

    case 'DELETE_POST': {
      const posts = assignCurrentRanks(state.posts.filter((p) => p.id !== action.postId));
      const disabledActivePostIds = state.disabledActivePostIds.filter((id) => id !== action.postId);
      return { ...state, posts, disabledActivePostIds };
    }

    case 'EDIT_POST_CAPTION':
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.postId ? { ...p, caption: action.caption } : p,
        ),
      };

    case 'SHARE_POST': {
      const posts = state.posts.map((p) => {
        if (p.id !== action.postId) return p;
        const updated = { ...p, shares: p.shares + 1 };
        updated.score = calculateScore(updated, state.simulatedHoursOffset);
        return updated;
      });
      return { ...state, posts: assignCurrentRanks(posts) };
    }

    case 'FOLLOW_USER': {
      const already = state.currentUser.followingIds?.includes(action.userId);
      if (already) return state;
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          following: state.currentUser.following + 1,
          followingIds: [...(state.currentUser.followingIds ?? []), action.userId],
        },
      };
    }

    case 'UNFOLLOW_USER': {
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          following: Math.max(0, state.currentUser.following - 1),
          followingIds: (state.currentUser.followingIds ?? []).filter(id => id !== action.userId),
        },
      };
    }

    case 'SET_FOLLOWING_IDS': {
      return {
        ...state,
        currentUser: {
          ...state.currentUser,
          followingIds: action.ids,
        },
      };
    }

    case 'TOGGLE_DEV_MODE':
      return { ...state, devMode: !state.devMode };

    case 'RESET_STATE':
      return makeInitialState();

    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  likePost: (postId: string) => void;
  addComment: (postId: string, text: string, parentId?: string) => void;
  addPost: (post: Post, record: UploadRecord) => void;
  simulate72h: () => void;
  endSeason: () => void;
  resetState: () => void;
  recalculateScores: () => void;
  updateProfile: (bio: string, socialLinks: SocialLinks) => void;
  updateAvatar: (avatarUrl: string) => void;
  setUsername: (username: string, userId: string) => void;
  setProfile: (profile: SupabaseProfile) => void;
  reportPost: (postId: string, reason: ReportReason) => void;
  boostPost: (postId: string, tier: BoostTier) => void;
  recordView: (postId: string) => void;
  consumeBoostImpression: (postId: string) => void;
  markSponsoredSeen: (postId: string) => void;
  toggleAccountDisabled: () => void;
  toggleDevMode: () => void;
  deletePost: (postId: string) => void;
  editPostCaption: (postId: string, caption: string) => void;
  sharePost: (postId: string) => void;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  refreshFeed: () => Promise<void>;
  loadMorePosts: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const DEV_USERNAMES = ['sultan', 'deehaw'];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const s = loadState();
    if (!DEV_USERNAMES.includes(s.currentUser.username.toLowerCase())) s.devMode = false;
    return s;
  });

  // Keep a ref to state so Supabase callbacks don't need state as a dep
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => { saveState(state); }, [state]);
  useEffect(() => { dispatch({ type: 'RECALCULATE_SCORES' }); }, []);

  // Fetch real posts and following list from Supabase whenever the user logs in
  useEffect(() => {
    const uid = state.currentUser.id;
    if (!uid || uid === 'user_1') return;
    fetchSupabasePosts(0).then(({ posts, hasMore }) => {
      if (posts.length > 0) dispatch({ type: 'SET_POSTS', posts, hasMore });
    });
    fetchFollowingIds(uid).then((ids) => {
      if (ids.length > 0) dispatch({ type: 'SET_FOLLOWING_IDS', ids });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentUser.id]);

  const likePost = useCallback((postId: string) => {
    const s = stateRef.current;
    const post = s.posts.find((p) => p.id === postId);
    const isLiked = post?.likedBy.includes(s.currentUser.id) ?? false;
    dispatch({ type: 'LIKE_POST', postId });
    if (s.currentUser.id !== 'user_1') {
      likeSupabasePost(postId, s.currentUser.id, isLiked);
    }
  }, []);

  const addComment = useCallback(
    (postId: string, text: string, parentId?: string) => {
      dispatch({ type: 'ADD_COMMENT', postId, text, parentId });
      const s = stateRef.current;
      if (s.currentUser.id !== 'user_1') {
        addSupabaseComment({ postId, userId: s.currentUser.id, username: s.currentUser.username, text, parentId });
      }
    },
    [],
  );
  const addPost = useCallback(
    (post: Post, record: UploadRecord) => dispatch({ type: 'ADD_POST', post, record }),
    [],
  );
  const simulate72h = useCallback(() => dispatch({ type: 'SIMULATE_72H' }), []);
  const endSeason = useCallback(() => dispatch({ type: 'END_SEASON' }), []);
  const resetState = useCallback(() => dispatch({ type: 'RESET_STATE' }), []);
  const recalculateScores = useCallback(() => dispatch({ type: 'RECALCULATE_SCORES' }), []);
  const updateProfile = useCallback(
    (bio: string, socialLinks: SocialLinks) => {
      dispatch({ type: 'UPDATE_PROFILE', bio, socialLinks });
      const uid = stateRef.current.currentUser.id;
      if (uid !== 'user_1') updateProfileData(uid, bio, socialLinks);
    },
    [],
  );
  const updateAvatar = useCallback(
    (avatarUrl: string) => {
      dispatch({ type: 'UPDATE_AVATAR', avatarUrl });
      const uid = stateRef.current.currentUser.id;
      if (uid !== 'user_1') uploadAvatarImage(uid, avatarUrl);
    },
    [],
  );
  const setProfile = useCallback(
    (profile: SupabaseProfile) => dispatch({ type: 'SET_PROFILE', profile }),
    [],
  );
  const setUsername = useCallback(
    (username: string, userId: string) => dispatch({ type: 'SET_USERNAME', username, userId }),
    [],
  );
  const reportPost = useCallback(
    (postId: string, reason: ReportReason) => {
      dispatch({ type: 'REPORT_POST', postId, reason });
      const s = stateRef.current;
      if (s.currentUser.id !== 'user_1') {
        reportSupabasePost(postId, s.currentUser.id, reason);
      }
    },
    [],
  );
  const boostPost = useCallback(
    (postId: string, tier: BoostTier) => {
      dispatch({ type: 'BOOST_POST', postId, tier });
      if (stateRef.current.currentUser.id !== 'user_1') {
        saveSupabaseBoost(postId, tier);
      }
    },
    [],
  );
  const recordView = useCallback(
    (postId: string) => {
      if (_sessionViewedIds.has(postId)) return;
      _sessionViewedIds.add(postId);
      dispatch({ type: 'RECORD_VIEW', postId });
      const s = stateRef.current;
      if (s.currentUser.id !== 'user_1') {
        recordSupabaseView(postId);
      }
    },
    [],
  );
  const consumeBoostImpression = useCallback(
    (postId: string) => {
      dispatch({ type: 'CONSUME_BOOST_IMPRESSION', postId });
      if (stateRef.current.currentUser.id !== 'user_1') {
        decrementSupabaseBoostImpression(postId);
      }
    },
    [],
  );
  const markSponsoredSeen = useCallback(
    (postId: string) => dispatch({ type: 'MARK_SPONSORED_SEEN', postId }),
    [],
  );
  const toggleAccountDisabled = useCallback(() => dispatch({ type: 'TOGGLE_ACCOUNT_DISABLED' }), []);
  const toggleDevMode = useCallback(() => dispatch({ type: 'TOGGLE_DEV_MODE' }), []);
  const deletePost = useCallback((postId: string) => {
    dispatch({ type: 'DELETE_POST', postId });
    if (stateRef.current.currentUser.id !== 'user_1') {
      deleteSupabasePost(postId);
    }
  }, []);
  const editPostCaption = useCallback(
    (postId: string, caption: string) => {
      dispatch({ type: 'EDIT_POST_CAPTION', postId, caption });
      if (stateRef.current.currentUser.id !== 'user_1') {
        updateSupabaseCaption(postId, caption);
      }
    },
    [],
  );
  const sharePost = useCallback((postId: string) => {
    dispatch({ type: 'SHARE_POST', postId });
    if (stateRef.current.currentUser.id !== 'user_1') {
      shareSupabasePost(postId);
    }
  }, []);
  const followUser = useCallback((userId: string) => {
    dispatch({ type: 'FOLLOW_USER', userId });
    const uid = stateRef.current.currentUser.id;
    if (uid !== 'user_1') followSupabaseUser(uid, userId);
  }, []);
  const unfollowUser = useCallback((userId: string) => {
    dispatch({ type: 'UNFOLLOW_USER', userId });
    const uid = stateRef.current.currentUser.id;
    if (uid !== 'user_1') unfollowSupabaseUser(uid, userId);
  }, []);
  const refreshFeed = useCallback(async () => {
    const uid = stateRef.current.currentUser.id;
    if (!uid || uid === 'user_1') {
      dispatch({ type: 'RECALCULATE_SCORES' });
      return;
    }
    const { posts, hasMore } = await fetchSupabasePosts(0);
    if (posts.length > 0) dispatch({ type: 'SET_POSTS', posts, hasMore });
    dispatch({ type: 'RECALCULATE_SCORES' });
  }, []);

  const loadMorePosts = useCallback(async () => {
    const uid = stateRef.current.currentUser.id;
    if (!uid || uid === 'user_1' || !stateRef.current.hasMorePosts) return;
    const { posts, hasMore } = await fetchSupabasePosts(stateRef.current.postsPage);
    if (posts.length > 0) dispatch({ type: 'APPEND_POSTS', posts, hasMore });
  }, []);

  return (
    <StoreContext.Provider
      value={{
        state,
        likePost,
        addComment,
        addPost,
        simulate72h,
        endSeason,
        resetState,
        recalculateScores,
        updateProfile,
        updateAvatar,
        setUsername,
        setProfile,
        reportPost,
        boostPost,
        recordView,
        consumeBoostImpression,
        markSponsoredSeen,
        toggleAccountDisabled,
        toggleDevMode,
        deletePost,
        editPostCaption,
        sharePost,
        followUser,
        unfollowUser,
        refreshFeed,
        loadMorePosts,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

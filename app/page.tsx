'use client';

import { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import {
  getRankedPosts,
  getVelocityRankedPosts,
  getPostTrend,
  getRankMovement,
  getJustDroppedPosts,
} from '@/lib/ranking';
import { fetchRecentPosts } from '@/lib/db';
import { Post } from '@/lib/types';
import PostCard from '@/components/PostCard';
import SeasonBanner from '@/components/SeasonBanner';
import SimulationControls from '@/components/SimulationControls';

export default function HomePage() {
  const { state, recalculateScores, consumeBoostImpression, markSponsoredSeen, refreshFeed, loadMorePosts } = useStore();
  const [loadingMore, setLoadingMore] = useState(false);
  const [serverRecentPosts, setServerRecentPosts] = useState<Post[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);
  const onRefresh = useCallback(async () => {
    await refreshFeed();
    setRefreshCount((c) => c + 1);
  }, [refreshFeed]);
  const { refreshing, pullY } = usePullToRefresh(onRefresh);
  const { posts, simulatedHoursOffset } = state;
  const [feedTab, setFeedTab] = useState<'for-you' | 'following'>('for-you');

  // Re-pick sponsored post on every refresh using weighted random selection.
  // Higher impressionsRemaining = higher probability, but all boosted posts get a chance.
  const sponsoredPost = useMemo(() => {
    const boosted = posts.filter((p) => p.status === 'active' && (p.boost?.impressionsRemaining ?? 0) > 0);
    if (!boosted.length) return null;
    const seen = new Set(state.seenSponsoredPostIds);
    const unseen = boosted.filter((p) => !seen.has(p.id));
    const pool = unseen.length > 0 ? unseen : boosted;
    // Weighted random: each post's weight = impressionsRemaining
    const totalWeight = pool.reduce((sum, p) => sum + (p.boost?.impressionsRemaining ?? 0), 0);
    let rand = Math.random() * totalWeight;
    for (const post of pool) {
      rand -= post.boost?.impressionsRemaining ?? 0;
      if (rand <= 0) return post;
    }
    return pool[pool.length - 1];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, state.seenSponsoredPostIds, refreshCount]);

  const consumedSponsoredIds = useRef(new Set<string>());
  useEffect(() => {
    if (sponsoredPost && !consumedSponsoredIds.current.has(sponsoredPost.id)) {
      consumedSponsoredIds.current.add(sponsoredPost.id);
      consumeBoostImpression(sponsoredPost.id);
      markSponsoredSeen(sponsoredPost.id);
    }
  }, [sponsoredPost, consumeBoostImpression, markSponsoredSeen]);

  // Re-score every 60 s so age penalties and time-ago labels stay fresh
  useEffect(() => {
    const id = setInterval(recalculateScores, 60_000);
    return () => clearInterval(id);
  }, [recalculateScores]);

  // Fetch recent posts independently for Just Dropped section
  useEffect(() => {
    const userId = state.currentUser.id;
    if (!userId || userId === 'user_1') return;
    fetchRecentPosts().then((posts) => { if (posts.length > 0) setServerRecentPosts(posts); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure push notification permission is requested for returning sessions
  useEffect(() => {
    const userId = state.currentUser.id;
    if (!userId || userId === 'user_1') return;
    import('@/lib/notifications').then(({ registerPushNotifications }) => {
      registerPushNotifications(userId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ranked = useMemo(() => getRankedPosts(posts), [posts]);

  const followingIds = state.currentUser.followingIds ?? [];
  const followingPosts = useMemo(
    () => getRankedPosts(posts.filter((p) => followingIds.includes(p.userId))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [posts, followingIds.join(',')],
  );

  const number1 = ranked[0];

  // Trending Fast — highest velocity regardless of total score or age
  const trendingFast = useMemo(
    () => getVelocityRankedPosts(posts, simulatedHoursOffset).slice(0, 3),
    [posts, simulatedHoursOffset],
  );

  // Rising Fast — biggest positive rank movement (currentRank rose vs previousRank)
  const risingFast = useMemo(
    () =>
      [...ranked]
        .filter((p) => getRankMovement(p) > 0)
        .sort((a, b) => getRankMovement(b) - getRankMovement(a))
        .slice(0, 3),
    [ranked],
  );

  // New Challengers — posted recently, not yet proven
  const newChallengers = useMemo(
    () =>
      ranked
        .filter((p) => getPostTrend(p, simulatedHoursOffset) === 'new_challenger')
        .slice(0, 3),
    [ranked, simulatedHoursOffset],
  );

  // Near Inactive — 0 likes, nearing 72h
  const nearInactive = useMemo(
    () =>
      posts
        .filter((p) => {
          if (p.status !== 'active' || p.likes > 0) return false;
          const ageHours =
            (Date.now() + simulatedHoursOffset * 3_600_000 - new Date(p.createdAt).getTime()) /
            3_600_000;
          return ageHours >= 48;
        })
        .slice(0, 3),
    [posts, simulatedHoursOffset],
  );

  // Just Dropped — use server fetch for real users, local state for mock
  const justDropped = useMemo(() => {
    const source = serverRecentPosts.length > 0
      ? serverRecentPosts
      : getJustDroppedPosts(posts, simulatedHoursOffset, 6);
    return source.filter((p) => p.id !== number1?.id).slice(0, 6);
  }, [serverRecentPosts, posts, simulatedHoursOffset, number1]);

  return (
    <div className="px-4 py-6 space-y-8">
      {/* Pull-to-refresh indicator */}
      <div
        style={{ height: pullY > 0 ? pullY : refreshing ? 48 : 0, transition: pullY > 0 ? 'none' : 'height 0.3s ease' }}
        className="flex items-center justify-center overflow-hidden"
      >
        <div className={`w-6 h-6 rounded-full border-2 border-red-600 border-t-transparent ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: pullY > 0 ? `rotate(${(pullY / 72) * 360}deg)` : undefined }}
        />
      </div>
      <SeasonBanner />
      {state.devMode && <SimulationControls />}

      {/* Feed tabs */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
        {(['for-you', 'following'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFeedTab(t)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
              feedTab === t ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'for-you' ? '🏆 Rankings' : '👥 Following'}
          </button>
        ))}
      </div>

      {/* Following feed */}
      {feedTab === 'following' && (
        followingPosts.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-500 text-sm font-semibold mb-1">No one followed yet</p>
            <p className="text-zinc-600 text-xs">Tap @username on any post to visit their profile and follow them.</p>
          </div>
        ) : (
          <section>
            <SectionHeader icon="👥" title="Following" subtitle="Ranked posts from people you follow" />
            <div className="space-y-4">
              {followingPosts.map((post, idx) => (
                <PostCard key={post.id} post={post} rank={idx + 1} showRank />
              ))}
            </div>
          </section>
        )
      )}

      {/* For You feed */}
      {feedTab === 'for-you' && (
        <>
          {/* #1 Overall */}
          {number1 && (
            <section>
              <SectionHeader icon="🥇" title="#1 Overall" />
              <PostCard post={number1} rank={1} showRank />
            </section>
          )}

          {/* Sponsored slot */}
          {sponsoredPost && (
            <section>
              <SectionHeader icon="✨" title="Sponsored" accent="text-violet-400" />
              <PostCard post={sponsoredPost} isSponsored />
            </section>
          )}

          {/* Just Dropped */}
          {justDropped.length > 0 && (
            <section>
              <SectionHeader icon="🆕" title="Just Dropped" subtitle="Posted in the last 24 hours — sorted by early momentum" accent="text-sky-400" />
              <div className="space-y-4">
                {justDropped.map((post) => <PostCard key={post.id} post={post} compact />)}
              </div>
            </section>
          )}

          {/* Trending Fast */}
          {trendingFast.length > 0 && (
            <section>
              <SectionHeader icon="🔥" title="Trending Fast" subtitle="Highest engagement velocity right now" accent="text-orange-400" />
              <div className="space-y-4">
                {trendingFast.map((post) => <PostCard key={post.id} post={post} compact />)}
              </div>
            </section>
          )}

          {/* Full Live Rankings */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader icon="📊" title="Live Rankings" inline />
              <span className="text-xs text-zinc-500">{ranked.length} active</span>
            </div>
            {ranked.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                <p className="text-zinc-600 text-sm">No active posts this season.</p>
                <p className="text-zinc-700 text-xs mt-1">Be the first to post.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {ranked.map((post, idx) => <PostCard key={post.id} post={post} rank={idx + 1} showRank />)}
                </div>
                {state.hasMorePosts && (
                  <button
                    onClick={async () => { setLoadingMore(true); await loadMorePosts(); setLoadingMore(false); }}
                    disabled={loadingMore}
                    className="w-full mt-4 py-3 text-sm font-bold text-zinc-400 border border-zinc-800 rounded-2xl hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </>
            )}
          </section>

          {/* Rising Fast */}
          {risingFast.length > 0 && (
            <section>
              <SectionHeader icon="↑" title="Rising Fast" subtitle="Biggest rank jumps since last snapshot" accent="text-green-400" />
              <div className="space-y-4">
                {risingFast.map((post) => <PostCard key={post.id} post={post} compact />)}
              </div>
            </section>
          )}

          {/* New Challengers */}
          {newChallengers.length > 0 && (
            <section>
              <SectionHeader icon="⚡" title="New Challengers" subtitle="Just posted — 72-hour window open" accent="text-sky-400" />
              <div className="space-y-4">
                {newChallengers.map((post) => <PostCard key={post.id} post={post} compact />)}
              </div>
            </section>
          )}

          {/* Near Inactive */}
          {nearInactive.length > 0 && (
            <section>
              <SectionHeader icon="⚠️" title="Near Inactive" subtitle="No likes — clock running out" accent="text-red-400" />
              <div className="space-y-4">
                {nearInactive.map((post) => <PostCard key={post.id} post={post} compact />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ─── Local helper ─────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  subtitle,
  accent = 'text-white',
  inline = false,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  accent?: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className={`font-black text-base uppercase tracking-widest ${accent}`}>{title}</h2>
      </div>
    );
  }
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className={`font-black text-base uppercase tracking-widest ${accent}`}>{title}</h2>
      </div>
      {subtitle && <p className="text-zinc-600 text-xs mt-0.5 ml-7">{subtitle}</p>}
    </div>
  );
}

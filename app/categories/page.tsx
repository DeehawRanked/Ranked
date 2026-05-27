'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { CATEGORIES, Category, CATEGORY_GRADIENT, Post } from '@/lib/types';
import CategoryIcon from '@/components/CategoryIcon';
import PostCard from '@/components/PostCard';
import { getRankedPosts, getJustDroppedPosts } from '@/lib/ranking';
import { fetchPostsByCategory } from '@/lib/db';

export default function CategoriesPage() {
  const { state } = useStore();
  const [selected, setSelected] = useState<Category | null>(null);
  const [tab, setTab] = useState<'ranked' | 'recent'>('ranked');

  const [serverPosts, setServerPosts] = useState<Post[]>([]);
  const [serverHasMore, setServerHasMore] = useState(false);
  const [serverPage, setServerPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const isMockUser = !state.currentUser.id || state.currentUser.id === 'user_1';

  // Local fallbacks for mock user
  const ranked = useMemo(() => getRankedPosts(state.posts), [state.posts]);
  const recentAll = useMemo(
    () => getJustDroppedPosts(state.posts, state.simulatedHoursOffset),
    [state.posts, state.simulatedHoursOffset],
  );
  const filteredLocal = useMemo(
    () => (selected ? ranked.filter((p) => p.category === selected) : []),
    [ranked, selected],
  );
  const recentFilteredLocal = useMemo(
    () => (selected ? recentAll.filter((p) => p.category === selected) : []),
    [recentAll, selected],
  );

  const fetchCategory = useCallback(async (
    cat: Category,
    t: 'ranked' | 'recent',
    page: number,
    append = false,
  ) => {
    if (isMockUser) return;
    if (append) setLoadingMore(true); else setLoading(true);
    const orderBy = t === 'ranked' ? 'likes' : 'recent';
    const { posts, hasMore } = await fetchPostsByCategory(cat, page, orderBy);
    if (append) {
      setServerPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...posts.filter((p) => !ids.has(p.id))];
      });
    } else {
      setServerPosts(posts);
    }
    setServerHasMore(hasMore);
    setServerPage(page);
    if (append) setLoadingMore(false); else setLoading(false);
  }, [isMockUser]);

  // Reset and fetch when category or tab changes
  useEffect(() => {
    if (!selected || isMockUser) return;
    setServerPosts([]);
    setServerHasMore(false);
    setServerPage(0);
    fetchCategory(selected, tab, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, tab]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of ranked) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return counts;
  }, [ranked]);

  const recentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of recentAll) counts[p.category] = (counts[p.category] ?? 0) + 1;
    return counts;
  }, [recentAll]);

  function handleSelectCategory(cat: Category) {
    if (selected === cat) {
      setSelected(null);
    } else {
      setSelected(cat);
      setTab('ranked');
    }
  }

  const activeList = isMockUser
    ? (tab === 'ranked' ? filteredLocal : recentFilteredLocal)
    : serverPosts;

  const totalActive = isMockUser ? ranked.length : null;

  return (
    <div className="px-4 py-6">
      <h1 className="text-white font-black text-2xl mb-1">Categories</h1>
      <p className="text-zinc-500 text-sm mb-6">
        {totalActive !== null
          ? `${totalActive} active posts across ${CATEGORIES.length} categories`
          : `${CATEGORIES.length} categories`}
      </p>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat] ?? 0;
          const newCount = recentCounts[cat] ?? 0;
          const active = selected === cat;
          return (
            <button
              key={cat}
              onClick={() => handleSelectCategory(cat)}
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                active
                  ? 'border-white bg-white/5'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_GRADIENT[cat]} opacity-30`} />
              <div className="relative">
                <div className="mb-2 text-white"><CategoryIcon category={cat} size={28} /></div>
                <div className="text-white font-bold text-sm">{cat}</div>
                <div className="flex items-center gap-2 mt-1">
                  {isMockUser && <span className="text-zinc-400 text-xs">{count} active</span>}
                  {isMockUser && newCount > 0 && (
                    <span className="text-sky-400 text-xs font-bold">+{newCount} new</span>
                  )}
                  {!isMockUser && <span className="text-zinc-400 text-xs">Browse posts</span>}
                  {active && <span className="ml-auto text-white text-xs">✓</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Posts for selected category */}
      {selected && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CategoryIcon category={selected} size={20} className="text-white" />
            <h2 className="text-white font-black text-lg">{selected}</h2>
          </div>

          {/* Tab toggle */}
          <div className="flex gap-2 mb-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
            <button
              onClick={() => setTab('ranked')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                tab === 'ranked' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              📊 Top Ranked
              {isMockUser && (
                <span className="ml-1.5 text-zinc-500 font-normal">{filteredLocal.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab('recent')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                tab === 'recent' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🆕 Just Dropped
              {isMockUser && (
                <span className="ml-1.5 text-zinc-500 font-normal">{recentFilteredLocal.length}</span>
              )}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
            </div>
          ) : activeList.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <div className="flex justify-center mb-3 text-zinc-600"><CategoryIcon category={selected} size={40} /></div>
              <p className="text-zinc-500 text-sm">
                {tab === 'recent'
                  ? `No posts in ${selected} in the last 24 hours.`
                  : `No active posts in ${selected} yet.`}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {activeList.map((post, idx) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    rank={tab === 'ranked' ? idx + 1 : undefined}
                    showRank={tab === 'ranked'}
                  />
                ))}
              </div>

              {serverHasMore && !isMockUser && (
                <button
                  onClick={async () => {
                    setLoadingMore(true);
                    await fetchCategory(selected, tab, serverPage + 1, true);
                    setLoadingMore(false);
                  }}
                  disabled={loadingMore}
                  className="w-full mt-4 py-3 text-sm font-bold text-zinc-400 border border-zinc-800 rounded-2xl hover:border-zinc-600 hover:text-white transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          )}
        </section>
      )}

      {!selected && (
        <div className="text-center py-8 text-zinc-600 text-sm">
          Tap a category to see its rankings
        </div>
      )}
    </div>
  );
}

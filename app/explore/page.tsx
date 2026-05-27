'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { CATEGORIES, Category, CATEGORY_GRADIENT, HallOfFameEntry, Comment } from '@/lib/types';
import PostCard from '@/components/PostCard';
import CategoryIcon from '@/components/CategoryIcon';
import { getRankedPosts, getJustDroppedPosts } from '@/lib/ranking';

type TopTab = 'browse' | 'hof';
type PostTab = 'ranked' | 'recent';

export default function ExplorePage() {
  const { state, followUser, unfollowUser } = useStore();
  const { posts, hallOfFame, currentUser, simulatedHoursOffset } = state;

  const [query, setQuery] = useState('');
  const [topTab, setTopTab] = useState<TopTab>('browse');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [postTab, setPostTab] = useState<PostTab>('ranked');
  const [selectedEntry, setSelectedEntry] = useState<HallOfFameEntry | null>(null);

  // ── Derived data ──────────────────────────────────────────────────────────

  const ranked = useMemo(() => getRankedPosts(posts), [posts]);

  const recentAll = useMemo(
    () => getJustDroppedPosts(posts, simulatedHoursOffset),
    [posts, simulatedHoursOffset],
  );

  const filtered = useMemo(
    () => (selectedCategory ? ranked.filter((p) => p.category === selectedCategory) : []),
    [ranked, selectedCategory],
  );

  const recentFiltered = useMemo(
    () => (selectedCategory ? recentAll.filter((p) => p.category === selectedCategory) : []),
    [recentAll, selectedCategory],
  );

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

  // Build unique user list from posts for search
  const allUsers = useMemo(() => {
    const map = new Map<string, { userId: string; username: string; postCount: number; activePosts: number; totalLikes: number }>();
    for (const p of posts) {
      const existing = map.get(p.userId);
      if (existing) {
        existing.postCount += 1;
        if (p.status === 'active') existing.activePosts += 1;
        existing.totalLikes += p.likes;
      } else {
        map.set(p.userId, {
          userId: p.userId,
          username: p.username,
          postCount: 1,
          activePosts: p.status === 'active' ? 1 : 0,
          totalLikes: p.likes,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalLikes - a.totalLikes);
  }, [posts]);

  const userResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allUsers.filter(
      (u) => u.username.toLowerCase().includes(q) && u.userId !== currentUser.id,
    );
  }, [query, allUsers, currentUser.id]);

  // HoF data
  const overallWinners = useMemo(
    () => hallOfFame.filter((e) => e.isOverallWinner).sort((a, b) => b.season.localeCompare(a.season)),
    [hallOfFame],
  );
  const grouped = useMemo(() => {
    const map: Record<string, typeof hallOfFame> = {};
    for (const e of hallOfFame) {
      if (!map[e.season]) map[e.season] = [];
      map[e.season].push(e);
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [hallOfFame]);

  // HoF detail — try to find original post for live comments
  const hofOriginalPost = selectedEntry
    ? posts.find((p) => p.id === selectedEntry.postId) ?? null
    : null;
  const hofComments: Comment[] = hofOriginalPost?.comments ?? selectedEntry?.comments ?? [];

  const activeList = postTab === 'ranked' ? filtered : recentFiltered;
  const isSearching = query.trim().length > 0;

  // ── Category drill-down ───────────────────────────────────────────────────

  if (selectedCategory) {
    return (
      <div className="pb-6">
        <div className="sticky top-14 z-40 bg-black border-b border-zinc-900 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-zinc-400 hover:text-white transition-colors text-lg"
          >
            ←
          </button>
          <CategoryIcon category={selectedCategory} size={20} />
          <h2 className="text-white font-black text-lg">{selectedCategory}</h2>
          <span className="text-zinc-600 text-xs ml-auto">{activeList.length} posts</span>
        </div>

        <div className="px-4 pt-4">
          <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-4">
            <button
              onClick={() => setPostTab('ranked')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${postTab === 'ranked' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              📊 Top Ranked <span className="ml-1 text-zinc-500 font-normal">{filtered.length}</span>
            </button>
            <button
              onClick={() => setPostTab('recent')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${postTab === 'recent' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              🆕 Just Dropped <span className="ml-1 text-zinc-500 font-normal">{recentFiltered.length}</span>
            </button>
          </div>

          {activeList.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center mt-4">
              <div className="flex justify-center mb-3 text-zinc-600"><CategoryIcon category={selectedCategory} size={40} /></div>
              <p className="text-zinc-500 text-sm">
                {postTab === 'recent' ? `No posts in ${selectedCategory} in the last 24 hours.` : `No active posts in ${selectedCategory} yet.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeList.map((post, idx) => (
                <PostCard key={post.id} post={post} rank={postTab === 'ranked' ? idx + 1 : undefined} showRank={postTab === 'ranked'} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main Explore view ─────────────────────────────────────────────────────

  return (
    <>
      <div className="px-4 py-6 space-y-5">
        <h1 className="text-white font-black text-2xl">Explore</h1>

        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-9 pr-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Search results ── */}
        {isSearching && (
          <div>
            {userResults.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                <p className="text-zinc-500 text-sm">No users found for "{query}"</p>
                <p className="text-zinc-700 text-xs mt-1">Try a different username.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-zinc-600 font-semibold uppercase tracking-wider mb-3">
                  {userResults.length} user{userResults.length !== 1 ? 's' : ''} found
                </p>
                {userResults.map((u) => {
                  const isFollowing = (currentUser.followingIds ?? []).includes(u.userId);
                  return (
                    <div key={u.userId} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shrink-0 border border-red-500/20">
                        <span className="text-sm font-black text-white">{u.username[0].toUpperCase()}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">@{u.username}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {u.activePosts} active · {u.totalLikes.toLocaleString()} likes
                        </p>
                      </div>

                      {/* Follow button */}
                      <button
                        onClick={() => isFollowing ? unfollowUser(u.userId) : followUser(u.userId)}
                        className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          isFollowing
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-red-800 hover:text-red-400'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Browse / HoF tabs (hidden while searching) ── */}
        {!isSearching && (
          <>
            <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
              <button
                onClick={() => setTopTab('browse')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${topTab === 'browse' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                📂 Browse
              </button>
              <button
                onClick={() => setTopTab('hof')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${topTab === 'hof' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                👑 Hall of Fame
              </button>
            </div>

            {/* Browse tab */}
            {topTab === 'browse' && (
              <div>
                <p className="text-zinc-500 text-sm mb-4">
                  {ranked.length} active posts across {CATEGORIES.length} categories
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => {
                    const count = categoryCounts[cat] ?? 0;
                    const newCount = recentCounts[cat] ?? 0;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setPostTab('ranked'); }}
                        className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 p-4 text-left transition-all active:scale-[0.98]"
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_GRADIENT[cat]} opacity-30`} />
                        <div className="relative">
                          <div className="mb-2 text-white"><CategoryIcon category={cat} size={28} /></div>
                          <div className="text-white font-bold text-sm">{cat}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-zinc-400 text-xs">{count} active</span>
                            {newCount > 0 && <span className="text-sky-400 text-xs font-bold">+{newCount} new</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hall of Fame tab */}
            {topTab === 'hof' && (
              <div>
                <p className="text-zinc-500 text-sm mb-6">The best posts from every season — immortalized.</p>

                {hallOfFame.length === 0 && (
                  <div className="text-center py-16">
                    <span className="text-5xl block mb-4">👑</span>
                    <p className="text-zinc-500 text-sm">No inductees yet.</p>
                    <p className="text-zinc-700 text-xs mt-1">End a season to crown champions.</p>
                  </div>
                )}

                {overallWinners.length > 0 && (
                  <section className="mb-8">
                    <p className="text-red-500 font-black text-xs uppercase tracking-widest mb-3">Overall Champions</p>
                    <div className="space-y-4">
                      {overallWinners.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => setSelectedEntry(entry)}
                          className="w-full text-left relative overflow-hidden bg-zinc-900 border border-red-500/30 rounded-2xl active:scale-[0.99] transition-transform"
                        >
                          <div className="absolute top-3 left-3 z-10">
                            <div className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                              <span>👑</span> Overall Winner
                            </div>
                          </div>
                          {entry.imageUrl ? (
                            <img src={entry.imageUrl} alt={entry.caption} className="w-full h-52 object-cover" />
                          ) : (
                            <div className={`w-full h-52 bg-gradient-to-br ${CATEGORY_GRADIENT[entry.category]} flex items-center justify-center`}>
                              <CategoryIcon category={entry.category} size={48} className="opacity-30 text-white" />
                            </div>
                          )}
                          <div className="p-4">
                            <p className="text-white font-bold text-sm">{entry.caption}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-zinc-500 text-xs">@{entry.username}</span>
                              <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full"><CategoryIcon category={entry.category} size={11} className="inline-block mr-1" />{entry.category}</span>
                              <span className="text-xs text-red-500/70">{entry.winningMonth}</span>
                            </div>
                            <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-800">
                              <div className="text-center">
                                <div className="text-white font-black text-base">{entry.likes.toLocaleString()}</div>
                                <div className="text-zinc-600 text-xs">likes</div>
                              </div>
                              <div className="text-center">
                                <div className="text-white font-black text-base">{entry.commentsCount}</div>
                                <div className="text-zinc-600 text-xs">comments</div>
                              </div>
                              <div className="text-center">
                                <div className="text-red-500 font-black text-base">#{entry.peakRank}</div>
                                <div className="text-zinc-600 text-xs">peak rank</div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {grouped.map(([season, entries]) => {
                  const [year, month] = season.split('-').map(Number);
                  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <section key={season} className="mb-8">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-px flex-1 bg-zinc-800" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-3">{monthName}</span>
                        <div className="h-px flex-1 bg-zinc-800" />
                      </div>
                      <div className="space-y-3">
                        {entries.map((entry) => (
                          <button
                            key={entry.id}
                            onClick={() => setSelectedEntry(entry)}
                            className={`w-full text-left flex gap-3 bg-zinc-900 border rounded-2xl overflow-hidden active:scale-[0.99] transition-transform ${entry.isOverallWinner ? 'border-red-500/20' : 'border-zinc-800'}`}
                          >
                            <div className="w-20 shrink-0">
                              {entry.imageUrl ? (
                                <img src={entry.imageUrl} alt={entry.caption} className="w-full h-full object-cover" style={{ minHeight: 80 }} />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENT[entry.category]} flex items-center justify-center`} style={{ minHeight: 80 }}>
                                  <CategoryIcon category={entry.category} size={20} className="opacity-50 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 py-3 pr-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                {entry.isOverallWinner && <span className="text-xs">👑</span>}
                                <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1"><CategoryIcon category={entry.category} size={11} />{entry.category}</span>
                              </div>
                              <p className="text-white text-sm font-semibold leading-tight line-clamp-2">{entry.caption}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-zinc-600 text-xs">@{entry.username}</span>
                                <span className="text-xs text-zinc-700">❤️ {entry.likes.toLocaleString()}</span>
                                <span className="text-red-500/70 text-xs font-bold">#{entry.peakRank}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* HoF detail sheet */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setSelectedEntry(null)}>
          <div
            className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[90vh] overflow-y-auto max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>
            <div className="relative">
              {selectedEntry.images && selectedEntry.images.length > 1 ? (
                <div className="flex overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                  {selectedEntry.images.map((src, i) => (
                    <img key={i} src={src} alt={selectedEntry.caption} className="w-full shrink-0 h-64 object-cover snap-center" />
                  ))}
                </div>
              ) : selectedEntry.imageUrl ? (
                <img src={selectedEntry.imageUrl} alt={selectedEntry.caption} className="w-full h-64 object-cover" />
              ) : (
                <div className={`w-full h-64 bg-gradient-to-br ${CATEGORY_GRADIENT[selectedEntry.category]} flex items-center justify-center`}>
                  <CategoryIcon category={selectedEntry.category} size={64} className="opacity-30 text-white" />
                </div>
              )}
              {selectedEntry.isOverallWinner && (
                <div className="absolute top-3 left-3">
                  <div className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <span>👑</span> Overall Winner
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 pt-4 pb-8">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full"><CategoryIcon category={selectedEntry.category} size={11} className="inline-block mr-1" />{selectedEntry.category}</span>
                <span className="text-xs text-zinc-500">@{selectedEntry.username}</span>
                <span className="text-xs text-red-500/70">{selectedEntry.winningMonth}</span>
              </div>
              <p className="text-white font-bold text-base mb-4">{selectedEntry.caption}</p>
              <div className="flex gap-6 pb-4 border-b border-zinc-800 mb-4">
                <div>
                  <div className="text-white font-black text-lg">{selectedEntry.likes.toLocaleString()}</div>
                  <div className="text-zinc-600 text-xs">likes</div>
                </div>
                <div>
                  <div className="text-white font-black text-lg">{selectedEntry.commentsCount}</div>
                  <div className="text-zinc-600 text-xs">comments</div>
                </div>
                <div>
                  <div className="text-red-500 font-black text-lg">#{selectedEntry.peakRank}</div>
                  <div className="text-zinc-600 text-xs">peak rank</div>
                </div>
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Comments</p>
              {hofComments.length === 0 ? (
                <p className="text-zinc-700 text-xs italic">No comments available.</p>
              ) : (
                <div className="space-y-3">
                  {hofComments.filter((c) => !c.parentId).map((c) => {
                    const replies = hofComments.filter((r) => r.parentId === c.id);
                    return (
                      <div key={c.id}>
                        <div className="flex gap-2">
                          <span className="text-xs font-bold text-zinc-400">@{c.username} </span>
                          <span className="text-xs text-zinc-300">{c.text}</span>
                        </div>
                        {replies.map((r) => (
                          <div key={r.id} className="flex gap-2 mt-1.5 ml-4 pl-3 border-l border-zinc-800">
                            <span className="text-xs font-bold text-zinc-500">@{r.username} </span>
                            <span className="text-xs text-zinc-400">{r.text}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

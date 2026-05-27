'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Post, SocialLinks, CATEGORY_GRADIENT } from '@/lib/types';
import PostCard from '@/components/PostCard';
import CategoryIcon from '@/components/CategoryIcon';

const ACHIEVEMENT_ICONS: Record<string, string> = {
  'Former #1 Overall': '🥇',
  '7-Day Survivor': '🛡️',
  'Category Champion': '🏆',
  'Upset Win': '⚡',
  'Top 10 Finish': '🎯',
};

const SOCIAL_CONFIG = [
  { key: 'instagram' as const, label: 'Instagram', icon: '📸', prefix: 'instagram.com/' },
  { key: 'tiktok' as const, label: 'TikTok', icon: '🎵', prefix: 'tiktok.com/@' },
  { key: 'youtube' as const, label: 'YouTube', icon: '▶️', prefix: 'youtube.com/@' },
  { key: 'website' as const, label: 'Website', icon: '🌐', prefix: '' },
];

type Tab = 'active' | 'past' | 'achievements';

export default function ProfilePage() {
  const { state, updateProfile, updateAvatar } = useStore();
  const { currentUser, posts } = state;
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('active');
  const [editing, setEditing] = useState(false);
  const [statSheet, setStatSheet] = useState<null | 'best-rank' | 'monthly-wins' | 'followers' | 'following'>(null);
  const [editBio, setEditBio] = useState(currentUser.bio);
  const [editSocials, setEditSocials] = useState<SocialLinks>(
    currentUser.socialLinks ?? {},
  );

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const myPosts = useMemo(() => posts.filter((p) => p.userId === currentUser.id), [posts, currentUser.id]);
  const activePosts = useMemo(() => myPosts.filter((p) => p.status === 'active'), [myPosts]);
  const pastPosts = useMemo(
    () => myPosts.filter((p) => p.status === 'archived' || p.status === 'inactive'),
    [myPosts],
  );
  const totalLikes = useMemo(() => myPosts.reduce((sum, p) => sum + p.likes, 0), [myPosts]);
  const bestCategoryRank = useMemo(() => {
    let best: { rank: number; post: Post } | null = null;
    for (const myPost of myPosts.filter((p) => p.status === 'active')) {
      const catPosts = posts
        .filter((p) => p.category === myPost.category && p.status === 'active')
        .sort((a, b) => b.score - a.score);
      const rank = catPosts.findIndex((p) => p.id === myPost.id) + 1;
      if (rank > 0 && (!best || rank < best.rank)) best = { rank, post: myPost };
    }
    // Fall back to peak rank from past posts if no active posts
    if (!best) {
      const fallback = [...myPosts].sort((a, b) => (a.peakRank ?? 999) - (b.peakRank ?? 999))[0];
      if (fallback?.peakRank) best = { rank: fallback.peakRank, post: fallback };
    }
    return best;
  }, [myPosts, posts]);
  const myHofEntries = useMemo(
    () => state.hallOfFame.filter((e) => e.userId === currentUser.id),
    [state.hallOfFame, currentUser.id],
  );

  const followingUsers = useMemo(() => {
    const ids = currentUser.followingIds ?? [];
    const seen = new Set<string>();
    const result: { id: string; username: string; avatarUrl?: string }[] = [];
    for (const p of posts) {
      if (ids.includes(p.userId) && !seen.has(p.userId)) {
        seen.add(p.userId);
        result.push({ id: p.userId, username: p.username });
      }
    }
    return result;
  }, [currentUser.followingIds, posts]);

  const hasSocials = SOCIAL_CONFIG.some((s) => currentUser.socialLinks?.[s.key]);

  function saveProfile() {
    updateProfile(editBio.trim(), editSocials);
    setEditing(false);
  }

  function cancelEdit() {
    setEditBio(currentUser.bio);
    setEditSocials(currentUser.socialLinks ?? {});
    setEditing(false);
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: activePosts.length },
    { key: 'past', label: 'Past Seasons', count: pastPosts.length },
    { key: 'achievements', label: 'Achievements', count: currentUser.achievements.length },
  ];

  return (
    <>
    <div className="pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-zinc-950 to-black px-4 pt-6 pb-5 border-b border-zinc-900">
        {/* Disabled banner */}
        {currentUser.accountDisabled && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 flex items-start gap-3 mb-4">
            <span className="text-lg">🔕</span>
            <div>
              <p className="text-yellow-400 text-sm font-bold">Account Temporarily Disabled</p>
              <p className="text-zinc-500 text-xs mt-0.5">Your posts are hidden from rankings. <Link href="/settings" className="text-yellow-400 underline">Re-enable in Settings.</Link></p>
            </div>
          </div>
        )}

        {/* Avatar + edit button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-4">
            {/* Avatar — tap to change */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="relative w-16 h-16 rounded-2xl shrink-0 overflow-hidden border border-red-500/20 group"
            >
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">
                    {currentUser.username[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs font-bold">📷</span>
              </div>
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-black text-xl leading-tight">
                @{currentUser.username}
              </h1>
              {!editing && (
                <p className="text-zinc-400 text-sm mt-0.5 leading-snug">{currentUser.bio}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={() => setEditing((v) => !v)}
              className="shrink-0 text-xs font-bold text-zinc-400 border border-zinc-800 bg-zinc-900 px-3 py-2 rounded-xl hover:border-zinc-600 hover:text-white transition-colors"
            >
              {editing ? '✕' : '✏️ Edit'}
            </button>
            <Link
              href="/settings"
              className="shrink-0 text-xs font-bold text-zinc-400 border border-zinc-800 bg-zinc-900 px-3 py-2 rounded-xl hover:border-zinc-600 hover:text-white transition-colors"
            >
              ⚙️ Settings
            </Link>
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className="mb-4 space-y-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                Bio
              </label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Tell the competition who you are..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
              />
              <div className="text-right text-zinc-700 text-xs mt-0.5">{editBio.length}/160</div>
            </div>

            {SOCIAL_CONFIG.map((s) => (
              <div key={s.key}>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                  {s.icon} {s.label}
                </label>
                <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden focus-within:border-zinc-500 transition-colors">
                  {s.prefix && (
                    <span className="text-zinc-600 text-xs pl-3 pr-1 shrink-0">{s.prefix}</span>
                  )}
                  <input
                    value={editSocials[s.key] ?? ''}
                    onChange={(e) =>
                      setEditSocials((prev) => ({ ...prev, [s.key]: e.target.value }))
                    }
                    placeholder={s.key === 'website' ? 'https://...' : 'username'}
                    className="flex-1 bg-transparent px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none"
                  />
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <button
                onClick={saveProfile}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
              >
                Save Profile
              </button>
              <button
                onClick={cancelEdit}
                className="px-4 bg-zinc-800 text-zinc-300 font-bold text-sm py-2.5 rounded-xl hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Social links — shown when not editing */}
        {!editing && hasSocials && (
          <div className="flex flex-wrap gap-2 mb-4">
            {SOCIAL_CONFIG.map((s) => {
              const val = currentUser.socialLinks?.[s.key];
              if (!val) return null;
              const url =
                s.key === 'website'
                  ? val.startsWith('http') ? val : `https://${val}`
                  : `https://${s.prefix}${val}`;
              return (
                <a
                  key={s.key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full hover:border-zinc-600 hover:text-white transition-colors"
                >
                  <span>{s.icon}</span>
                  <span>{s.key === 'website' ? 'Website' : `@${val}`}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <button
            onClick={() => setStatSheet('followers')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-center hover:border-zinc-600 transition-colors"
          >
            <div className="text-white font-black text-sm leading-none">{currentUser.followers.toLocaleString()}</div>
            <div className="text-zinc-600 text-xs mt-0.5 leading-tight">Followers</div>
          </button>
          <button
            onClick={() => setStatSheet('following')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-center hover:border-zinc-600 transition-colors"
          >
            <div className="text-white font-black text-sm leading-none">{currentUser.following.toLocaleString()}</div>
            <div className="text-zinc-600 text-xs mt-0.5 leading-tight">Following</div>
          </button>
          {[
            { label: 'Likes', value: totalLikes.toLocaleString() },
            { label: '🔥 Streak', value: currentUser.currentStreak ? `${currentUser.currentStreak}w` : '—' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-center"
            >
              <div className="text-white font-black text-sm leading-none">{stat.value}</div>
              <div className="text-zinc-600 text-xs mt-0.5 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Competition stats */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => bestCategoryRank && setStatSheet('best-rank')}
            className={`bg-zinc-900 border rounded-xl p-2.5 text-center transition-colors ${bestCategoryRank ? 'border-zinc-800 hover:border-zinc-600 active:bg-zinc-800' : 'border-zinc-800 opacity-50'}`}
          >
            <div className="text-red-500 font-black text-lg leading-none flex items-center justify-center gap-1">
              {bestCategoryRank ? (
                <><span>#{bestCategoryRank.rank}</span><CategoryIcon category={bestCategoryRank.post.category} size={16} /></>
              ) : '—'}
            </div>
            <div className="text-zinc-600 text-xs mt-0.5">Best Rank</div>
          </button>

          <button
            onClick={() => currentUser.monthlyWins > 0 && setStatSheet('monthly-wins')}
            className={`bg-zinc-900 border rounded-xl p-2.5 text-center transition-colors ${currentUser.monthlyWins > 0 ? 'border-zinc-800 hover:border-zinc-600 active:bg-zinc-800' : 'border-zinc-800 opacity-50'}`}
          >
            <div className="text-red-500 font-black text-lg leading-none">{currentUser.monthlyWins}</div>
            <div className="text-zinc-600 text-xs mt-0.5">Monthly Wins</div>
          </button>

          <button
            onClick={() => setTab('active')}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 active:bg-zinc-800 rounded-xl p-2.5 text-center transition-colors"
          >
            <div className="text-red-500 font-black text-lg leading-none">{activePosts.length}</div>
            <div className="text-zinc-600 text-xs mt-0.5">Active Posts</div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 px-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 py-3 px-2 text-sm font-semibold border-b-2 transition-colors mr-4 ${
              tab === t.key
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
            <span
              className={`text-xs rounded-full px-1.5 py-0.5 ${
                tab === t.key ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-4">
        {tab === 'active' && (
          <>
            {activePosts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <span className="text-4xl block mb-3">📸</span>
                <p className="text-zinc-500 text-sm">No active posts this season.</p>
                <a
                  href="/upload"
                  className="inline-block mt-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Post Now
                </a>
              </div>
            ) : (
              <PostGrid posts={activePosts} />
            )}
          </>
        )}

        {tab === 'past' && (
          <>
            {pastPosts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <span className="text-4xl block mb-3">📂</span>
                <p className="text-zinc-500 text-sm">No past season posts yet.</p>
              </div>
            ) : (
              <PostGrid posts={pastPosts} />
            )}
          </>
        )}

        {tab === 'achievements' && (
          <>
            {currentUser.achievements.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">🏆</span>
                <p className="text-zinc-500 text-sm">No achievements yet — start competing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentUser.achievements.map((ach, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-2xl p-4"
                  >
                    <div className="text-3xl shrink-0">{ACHIEVEMENT_ICONS[ach.type] ?? '🎖️'}</div>
                    <div>
                      <div className="text-white font-bold text-sm">{ach.type}</div>
                      {ach.details && (
                        <div className="text-zinc-500 text-xs mt-0.5">{ach.details}</div>
                      )}
                      <div className="text-zinc-700 text-xs mt-0.5">
                        {new Date(ach.earnedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>

      {/* Followers sheet */}
      {statSheet === 'followers' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setStatSheet(null)}>
          <div className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[70vh] overflow-y-auto max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-zinc-700" /></div>
            <div className="px-4 pt-3 pb-8">
              <p className="text-white font-black text-base mb-4">Followers <span className="text-zinc-500 font-normal text-sm">({currentUser.followers.toLocaleString()})</span></p>
              <div className="text-center py-10">
                <span className="text-4xl block mb-3">👥</span>
                <p className="text-zinc-400 text-sm font-semibold">Follower list coming soon</p>
                <p className="text-zinc-600 text-xs mt-1">Full follower details will be available once the live backend launches.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Following sheet */}
      {statSheet === 'following' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setStatSheet(null)}>
          <div className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[70vh] overflow-y-auto max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-zinc-700" /></div>
            <div className="px-4 pt-3 pb-8">
              <p className="text-white font-black text-base mb-4">Following <span className="text-zinc-500 font-normal text-sm">({currentUser.following.toLocaleString()})</span></p>
              {followingUsers.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl block mb-3">👤</span>
                  <p className="text-zinc-400 text-sm font-semibold">Not following anyone yet</p>
                  <p className="text-zinc-600 text-xs mt-1">Tap a username in the feed to visit their profile and follow them.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {followingUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setStatSheet(null); router.push(`/user/${u.username}`); }}
                      className="w-full flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl px-4 py-3 text-left transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shrink-0">
                        <span className="text-white font-black text-sm">{u.username[0].toUpperCase()}</span>
                      </div>
                      <span className="text-white text-sm font-semibold">@{u.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Best Rank sheet */}
      {statSheet === 'best-rank' && bestCategoryRank && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setStatSheet(null)}>
          <div className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[85vh] overflow-y-auto max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-zinc-700" /></div>
            <div className="px-4 pt-2 pb-3">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Best Rank in {bestCategoryRank.post.category}</p>
              <p className="text-zinc-600 text-xs">#{bestCategoryRank.rank} among all {bestCategoryRank.post.category} posts</p>
            </div>
            <div className="px-4 pb-8">
              <PostCard post={bestCategoryRank.post} showRank={!!bestCategoryRank.post.currentRank} rank={bestCategoryRank.post.currentRank} />
            </div>
          </div>
        </div>
      )}

      {/* Monthly Wins sheet */}
      {statSheet === 'monthly-wins' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setStatSheet(null)}>
          <div className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[85vh] overflow-y-auto max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-zinc-700" /></div>
            <div className="px-4 pt-2 pb-8">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Monthly Wins</p>
              <div className="space-y-3">
                {myHofEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-zinc-800">
                      {entry.imageUrl
                        ? <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-2xl">🏆</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{entry.caption}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{entry.winningMonth}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-red-500 text-xs font-bold">#{entry.peakRank} Overall</span>
                        {entry.isOverallWinner && <span className="text-yellow-400 text-xs font-bold">🏆 Winner</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

</>
  );
}

// ─── Post Grid ────────────────────────────────────────────────────────────────

function PostGrid({ posts }: { posts: Post[] }) {
  const [selected, setSelected] = useState<Post | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { state, deletePost, editPostCaption } = useStore();
  const { currentUser } = state;

  function handleSelect(post: Post) {
    setSelected(post);
    setCaptionText(post.caption);
    setEditingCaption(false);
    setConfirmDelete(false);
  }

  function handleSaveCaption() {
    if (!selected || !captionText.trim()) return;
    editPostCaption(selected.id, captionText.trim());
    setSelected({ ...selected, caption: captionText.trim() });
    setEditingCaption(false);
  }

  function handleDelete() {
    if (!selected) return;
    deletePost(selected.id);
    setSelected(null);
    setConfirmDelete(false);
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => handleSelect(post)}
            className="relative aspect-square overflow-hidden bg-zinc-900 focus:outline-none"
          >
            {post.imageUrl ? (
              <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENT[post.category]} flex items-center justify-center`}>
                <CategoryIcon category={post.category} size={28} className="opacity-40 text-white" />
              </div>
            )}
            {/* Score overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-end justify-between">
              <span className="text-white text-xs font-black leading-none">
                {post.score > 999 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
              </span>
              {post.status === 'active' && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              )}
            </div>
            {post.currentRank && post.status === 'active' && (
              <div className="absolute top-1.5 left-1.5 bg-black/70 rounded-md px-1 py-0.5">
                <span className="text-white text-xs font-black">#{post.currentRank}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Legal */}
      <div className="px-4 pt-6 pb-2">
        <div className="border-t border-zinc-900 pt-5 flex items-center justify-center gap-4">
          <Link href="/terms" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
            Terms of Service
          </Link>
          <span className="text-zinc-800 text-xs">·</span>
          <Link href="/privacy" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
            Privacy Policy
          </Link>
        </div>
        <p className="text-center text-zinc-800 text-xs mt-2">RANKED © 2026</p>
      </div>

      {/* Detail sheet */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-end"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>
            <div className="px-4 pb-8 pt-2">
              <PostCard post={selected} showRank={!!selected.currentRank} rank={selected.currentRank} />

              {selected.userId === currentUser.id && (
                <div className="border-t border-zinc-800 pt-4 mt-2 space-y-3">
                  {/* Edit caption */}
                  {editingCaption ? (
                    <div>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Edit Caption</p>
                      <textarea
                        value={captionText}
                        onChange={(e) => setCaptionText(e.target.value)}
                        maxLength={200}
                        rows={3}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                      />
                      <div className="text-right text-zinc-700 text-xs mb-2">{captionText.length}/200</div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveCaption}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
                        >
                          Save Caption
                        </button>
                        <button
                          onClick={() => setEditingCaption(false)}
                          className="px-4 bg-zinc-800 text-zinc-300 font-bold text-sm py-2.5 rounded-xl hover:bg-zinc-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingCaption(true)}
                      className="w-full flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl px-4 py-3 text-left transition-colors"
                    >
                      <span>✏️</span>
                      <span className="text-white text-sm font-semibold">Edit Caption</span>
                    </button>
                  )}

                  {/* Delete */}
                  {confirmDelete ? (
                    <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4">
                      <p className="text-zinc-300 text-sm text-center mb-3">Delete this post? This cannot be undone.</p>
                      <button
                        onClick={handleDelete}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-sm py-3 rounded-xl transition-colors mb-2"
                      >
                        Yes, Delete Post
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="w-full py-2 text-zinc-500 text-sm font-semibold hover:text-zinc-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center gap-3 bg-zinc-900 border border-red-900/30 hover:border-red-700 rounded-xl px-4 py-3 text-left transition-colors"
                    >
                      <span>🗑️</span>
                      <span className="text-red-500 text-sm font-semibold">Delete Post</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

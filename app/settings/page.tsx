'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { signOut, deleteAccount } from '@/lib/auth';
import PostCard from '@/components/PostCard';
import { Post } from '@/lib/types';

export default function SettingsPage() {
  const { state, toggleAccountDisabled } = useStore();
  const { currentUser, posts } = state;
  const router = useRouter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activityTab, setActivityTab] = useState<'likes' | 'comments' | 'reports'>('likes');

  // Activity data
  const likedPosts = useMemo(
    () => posts.filter((p) => p.likedBy.includes(currentUser.id)),
    [posts, currentUser.id],
  );

  const commentedPosts = useMemo(
    () =>
      posts.filter((p) => p.comments.some((c) => c.userId === currentUser.id)),
    [posts, currentUser.id],
  );

  const reportedPosts = useMemo(
    () => posts.filter((p) => p.reports?.some((r) => r.userId === currentUser.id)),
    [posts, currentUser.id],
  );

  async function handleSignOut() {
    await signOut();
    router.replace('/auth');
  }

  async function handleDeleteAccount() {
    await deleteAccount(currentUser.id);
    router.replace('/auth');
  }

  function handleToggleDisable() {
    toggleAccountDisabled();
    setShowDisableModal(false);
  }

  const activityList =
    activityTab === 'likes' ? likedPosts
    : activityTab === 'comments' ? commentedPosts
    : reportedPosts;

  return (
    <>
      <div className="pb-8">
        {/* Header */}
        <div className="sticky top-14 z-40 bg-black border-b border-zinc-900 px-4 h-12 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition-colors text-lg">←</button>
          <h1 className="text-white font-black text-base">Settings</h1>
        </div>

        <div className="px-4 pt-6 space-y-8">

          {/* ── Account disabled banner ── */}
          {currentUser.accountDisabled && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 flex items-start gap-3">
              <span className="text-lg">🔕</span>
              <div>
                <p className="text-yellow-400 text-sm font-bold">Account Temporarily Disabled</p>
                <p className="text-zinc-500 text-xs mt-0.5">Your posts are hidden from rankings. Re-enable to return to competition.</p>
              </div>
            </div>
          )}

          {/* ── Account section ── */}
          <section>
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-3">Account</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">

              <Link href="/profile" className="flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors">
                <span className="text-lg">✏️</span>
                <span className="text-white text-sm font-semibold flex-1">Edit Profile</span>
                <span className="text-zinc-600 text-sm">→</span>
              </Link>

              <button
                onClick={() => setShowDisableModal(true)}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors text-left"
              >
                <span className="text-lg">🔕</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-semibold">
                    {currentUser.accountDisabled ? 'Re-enable Account' : 'Temporarily Disable Account'}
                  </p>
                  <p className="text-zinc-600 text-xs mt-0.5">
                    {currentUser.accountDisabled
                      ? 'Restore your posts to the rankings'
                      : 'Hide your posts from rankings without deleting'}
                  </p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors ${currentUser.accountDisabled ? 'bg-yellow-500' : 'bg-zinc-700'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform shadow ${currentUser.accountDisabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </div>
              </button>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors text-left"
              >
                <span className="text-lg">🚪</span>
                <span className="text-white text-sm font-semibold flex-1">Sign Out</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors text-left"
              >
                <span className="text-lg">🗑️</span>
                <span className="text-red-500 text-sm font-semibold flex-1">Delete Account</span>
              </button>
            </div>
          </section>

          {/* ── Activity section ── */}
          <section>
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-3">Activity</p>

            {/* Tab toggle */}
            <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-4">
              {([
                { key: 'likes', label: '❤️ Liked', count: likedPosts.length },
                { key: 'comments', label: '💬 Commented', count: commentedPosts.length },
                { key: 'reports', label: '🚩 Reported', count: reportedPosts.length },
              ] as const).map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setActivityTab(key)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-colors ${
                    activityTab === key ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {label}
                  <span className="ml-1 font-normal text-zinc-600">{count}</span>
                </button>
              ))}
            </div>

            {activityList.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                <p className="text-zinc-600 text-sm">
                  {activityTab === 'likes' && 'No liked posts yet.'}
                  {activityTab === 'comments' && "You haven't commented on any posts yet."}
                  {activityTab === 'reports' && "You haven't reported any posts."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activityList.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="w-full flex items-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-3 text-left transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                      {post.imageUrl
                        ? <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xl">🖼️</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{post.caption}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">@{post.username}</p>
                      {activityTab === 'comments' && (
                        <p className="text-zinc-600 text-xs mt-0.5 truncate italic">
                          "{post.comments.find((c) => c.userId === currentUser.id)?.text}"
                        </p>
                      )}
                    </div>
                    <span className="text-zinc-700 text-sm shrink-0">→</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── Legal ── */}
          <section>
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-3">Legal</p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <Link href="/terms" className="flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors">
                <span className="text-lg">📄</span>
                <span className="text-white text-sm font-semibold flex-1">Terms of Service</span>
                <span className="text-zinc-600 text-sm">→</span>
              </Link>
              <Link href="/privacy" className="flex items-center gap-3 px-4 py-4 hover:bg-zinc-800 transition-colors">
                <span className="text-lg">🔒</span>
                <span className="text-white text-sm font-semibold flex-1">Privacy Policy</span>
                <span className="text-zinc-600 text-sm">→</span>
              </Link>
            </div>
          </section>

          <p className="text-center text-zinc-800 text-xs pb-2">RANKED © 2026</p>
        </div>
      </div>

      {/* ── Disable confirmation modal ── */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setShowDisableModal(false)}>
          <div className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-zinc-700" /></div>
            <div className="px-4 pb-10 pt-3">
              <div className="text-3xl mb-3">{currentUser.accountDisabled ? '✅' : '🔕'}</div>
              <h3 className="text-white font-black text-lg mb-2">
                {currentUser.accountDisabled ? 'Re-enable Account?' : 'Temporarily Disable Account?'}
              </h3>
              <p className="text-zinc-400 text-sm mb-6">
                {currentUser.accountDisabled
                  ? 'Your posts will be restored to the rankings and your account will be fully active again.'
                  : 'Your posts will be hidden from all rankings until you re-enable your account. Your data is preserved and you can return any time.'}
              </p>
              <button
                onClick={handleToggleDisable}
                className={`w-full font-black text-sm py-4 rounded-2xl transition-colors mb-3 ${
                  currentUser.accountDisabled
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-yellow-500 hover:bg-yellow-400 text-black'
                }`}
              >
                {currentUser.accountDisabled ? 'Yes, Re-enable My Account' : 'Yes, Disable My Account'}
              </button>
              <button onClick={() => setShowDisableModal(false)} className="w-full py-3 text-zinc-500 text-sm font-semibold hover:text-zinc-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-zinc-700" /></div>
            <div className="px-4 pb-10 pt-3">
              <div className="text-3xl mb-3">⚠️</div>
              <h3 className="text-white font-black text-lg mb-2">Delete Account?</h3>
              <p className="text-zinc-400 text-sm mb-2">
                This will permanently delete your account, all your posts, likes, and comments. This cannot be undone.
              </p>
              <p className="text-zinc-600 text-xs mb-6">Your ranking history and Hall of Fame entries will also be removed.</p>
              <button onClick={handleDeleteAccount} className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-sm py-4 rounded-2xl transition-colors mb-3">
                Yes, Delete My Account
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 text-zinc-500 text-sm font-semibold hover:text-zinc-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Activity post detail sheet ── */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setSelectedPost(null)}>
          <div className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[85vh] overflow-y-auto max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-zinc-700" /></div>
            <div className="px-4 pb-8 pt-2">
              <PostCard post={selectedPost} showRank={!!selectedPost.currentRank} rank={selectedPost.currentRank} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

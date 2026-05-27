'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { CATEGORY_GRADIENT } from '@/lib/types';
import CategoryIcon from '@/components/CategoryIcon';
import PostCard from '@/components/PostCard';
import { useState } from 'react';
import { Post } from '@/lib/types';

export default function UserProfileClient() {
  const { username } = useParams<{ username: string }>();
  const { state, followUser, unfollowUser } = useStore();
  const { posts, currentUser } = state;
  const router = useRouter();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  if (username === currentUser.username) {
    router.replace('/profile');
    return null;
  }

  const userPosts = useMemo(
    () => posts.filter((p) => p.username === username),
    [posts, username],
  );

  const userId = userPosts[0]?.userId;
  const isFollowing = userId ? (currentUser.followingIds ?? []).includes(userId) : false;

  const activePosts = userPosts.filter((p) => p.status === 'active');
  const totalLikes = userPosts.reduce((sum, p) => sum + p.likes, 0);
  const bestRank = [...userPosts].sort((a, b) => (a.peakRank ?? 999) - (b.peakRank ?? 999))[0];

  if (userPosts.length === 0) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-zinc-500 text-sm">No posts found for @{username}</p>
        <button onClick={() => router.back()} className="mt-4 text-zinc-600 text-sm hover:text-zinc-400">← Go back</button>
      </div>
    );
  }

  return (
    <>
      <div className="pb-6">
        <div className="sticky top-14 z-40 bg-black border-b border-zinc-900 px-4 h-12 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition-colors text-lg">←</button>
          <h1 className="text-white font-black text-base">@{username}</h1>
        </div>

        <div className="bg-gradient-to-b from-zinc-950 to-black px-4 pt-6 pb-5 border-b border-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center border border-red-500/20">
              <span className="text-2xl font-black text-white">{username[0].toUpperCase()}</span>
            </div>
            {userId && (
              <button
                onClick={() => isFollowing ? unfollowUser(userId) : followUser(userId)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${
                  isFollowing
                    ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-red-800 hover:text-red-400'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <h2 className="text-white font-black text-xl mb-4">@{username}</h2>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Likes', value: totalLikes.toLocaleString() },
              { label: 'Active Posts', value: activePosts.length },
              { label: 'Best Rank', value: bestRank?.peakRank ? <span className="flex items-center justify-center gap-1">#{bestRank.peakRank}<CategoryIcon category={bestRank.category} size={14} /></span> : '—' },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-center">
                <div className="text-red-500 font-black text-lg leading-none">{s.value}</div>
                <div className="text-zinc-600 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {userPosts.map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square overflow-hidden bg-zinc-900 focus:outline-none"
            >
              {post.imageUrl ? (
                <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${CATEGORY_GRADIENT[post.category]} flex items-center justify-center`}>
                  <CategoryIcon category={post.category} size={28} className="opacity-40 text-white" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-1.5 left-1.5">
                <span className="text-white text-xs font-black">
                  {post.score > 999 ? `${(post.score / 1000).toFixed(1)}k` : post.score}
                </span>
              </div>
              {post.currentRank && post.status === 'active' && (
                <div className="absolute top-1.5 left-1.5 bg-black/70 rounded-md px-1 py-0.5">
                  <span className="text-white text-xs font-black">#{post.currentRank}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

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

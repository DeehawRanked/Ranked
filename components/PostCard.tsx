'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Post, PostTrend, ReportReason, DAILY_REPORT_LIMIT, BoostTier, BOOST_TIERS } from '@/lib/types';
import { CATEGORY_GRADIENT } from '@/lib/types';
import { useStore } from '@/lib/store';
import CategoryIcon from './CategoryIcon';
import { getHoursRemaining, getPostTrend, getRankMovement, formatTimeAgo } from '@/lib/ranking';
import { purchaseBoost } from '@/lib/iap';

interface Props {
  post: Post;
  rank?: number;
  showRank?: boolean;
  compact?: boolean;
  isSponsored?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'text-green-400 border-green-400/30 bg-green-400/10',
  inactive: 'text-zinc-500 border-zinc-700 bg-zinc-800/50',
  archived: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  hall_of_fame: 'text-red-500 border-amber-400/30 bg-amber-400/10',
  under_review: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
  hall_of_fame: 'Hall of Fame',
  under_review: 'Under Review',
};

const REPORT_OPTIONS: { reason: ReportReason; label: string; icon: string; desc: string }[] = [
  { reason: 'nudity',       label: 'Nudity',        icon: '🔞', desc: 'Explicit or sexual content' },
  { reason: 'ai_generated', label: 'AI Generated',  icon: '🤖', desc: 'Fake or AI-created image' },
  { reason: 'racism',       label: 'Racism',        icon: '⛔', desc: 'Hateful or discriminatory content' },
];

const TREND_CONFIG: Record<
  PostTrend,
  { label: string; icon: string; style: string } | null
> = {
  trending:       { label: 'Trending',      icon: '🔥', style: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
  rising:         { label: 'Rising',        icon: '↑',  style: 'text-green-400 bg-green-400/10 border-green-400/30' },
  falling:        { label: 'Falling',       icon: '↓',  style: 'text-red-400 bg-red-400/10 border-red-400/30' },
  new_challenger: { label: 'New',           icon: '⚡', style: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
  stable:         null,
};

export default function PostCard({ post, rank, showRank = false, compact = false, isSponsored = false }: Props) {
  const { likePost, addComment, reportPost, boostPost, recordView, sharePost, state } = useStore();
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; username: string } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [purchasing, setPurchasing] = useState<BoostTier | null>(null);
  const [reported, setReported] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const imgScrollRef = useRef<HTMLDivElement>(null);
  const viewTracked = useRef(false);

  const allImages = post.images?.length ? post.images : post.imageUrl ? [post.imageUrl] : [];

  function handleImgScroll() {
    const el = imgScrollRef.current;
    if (!el) return;
    setActiveImg(Math.round(el.scrollLeft / el.clientWidth));
  }

  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      recordView(post.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alreadyReported = post.reports?.some((r) => r.userId === state.currentUser.id) ?? false;
  const likedPost = post.likedBy.includes(state.currentUser.id);
  const today = new Date().toISOString().slice(0, 10);
  const reportsToday = state.posts
    .flatMap((p) => p.reports ?? [])
    .filter((r) => r.userId === state.currentUser.id && r.reportedAt.slice(0, 10) === today).length;
  const dailyLimitReached = reportsToday >= DAILY_REPORT_LIMIT;
  const canReport = !alreadyReported && !reported && !likedPost && !dailyLimitReached;

  function handleReport(reason: ReportReason) {
    reportPost(post.id, reason);
    setReported(true);
    setShowReportModal(false);
  }

  const liked = post.likedBy.includes(state.currentUser.id);
  const hoursLeft = getHoursRemaining(post, state.simulatedHoursOffset);
  const urgency = hoursLeft < 12 && post.status === 'active';
  const trend = post.status === 'active' ? getPostTrend(post, state.simulatedHoursOffset) : null;
  const trendCfg = trend ? TREND_CONFIG[trend] : null;
  const rankMove = getRankMovement(post);
  const timeAgo = formatTimeAgo(post.createdAt, state.simulatedHoursOffset);

  async function handleShare() {
    const url = `https://ranked.app/post/${post.id}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: post.caption, text: `Check out this post on Ranked: "${post.caption}"`, url });
        sharePost(post.id);
      } catch {
        // user dismissed — no-op
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        sharePost(post.id);
      } catch { /* ignore */ }
    }
  }

  function handleComment(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim(), replyingTo?.commentId);
    setCommentText('');
    setReplyingTo(null);
  }

  const rankColors = ['text-red-500', 'text-zinc-300', 'text-amber-700'];
  const isOwnPost = post.userId === state.currentUser.id;
  const hasActiveBoost = (post.boost?.impressionsRemaining ?? 0) > 0;

  return (
    <>
    <div
      className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all ${
        urgency
          ? 'border-red-500/40'
          : trend === 'trending'
          ? 'border-orange-500/30'
          : 'border-zinc-800'
      } ${compact ? '' : 'hover:border-zinc-600'}`}
    >
      {/* Image area */}
      <div className="relative overflow-hidden">
        {allImages.length > 0 ? (
          <div
            ref={imgScrollRef}
            onScroll={handleImgScroll}
            className="flex overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
          >
            {allImages.map((src, i) => (
              <div
                key={i}
                className="min-w-full snap-center snap-always shrink-0 overflow-hidden"
                style={{ height: compact ? '320px' : '480px' }}
              >
                <img
                  src={src}
                  alt={post.caption}
                  className="w-full h-full"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`w-full bg-gradient-to-br ${CATEGORY_GRADIENT[post.category]} flex items-center justify-center ${compact ? 'h-48' : 'h-64'}`}
          >
            <CategoryIcon category={post.category} size={56} className="opacity-40 text-white" />
          </div>
        )}

        {/* Carousel dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {allImages.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${i === activeImg ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Rank badge + movement */}
        {showRank && rank !== undefined && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <div className="bg-black/80 backdrop-blur-sm border border-zinc-700 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <span className={`text-lg font-black ${rankColors[rank - 1] ?? 'text-white'}`}>
                #{rank}
              </span>
            </div>
            {rankMove !== 0 && (
              <div
                className={`bg-black/80 backdrop-blur-sm border rounded-xl px-2 py-1.5 flex items-center gap-0.5 text-xs font-bold ${
                  rankMove > 0
                    ? 'border-green-500/40 text-green-400'
                    : 'border-red-500/40 text-red-400'
                }`}
              >
                <span>{rankMove > 0 ? '↑' : '↓'}</span>
                <span>{Math.abs(rankMove)}</span>
              </div>
            )}
          </div>
        )}

        {/* Trend badge */}
        {trendCfg && (
          <div className="absolute top-3 right-3">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${trendCfg.style}`}
            >
              <span>{trendCfg.icon}</span>
              <span>{trendCfg.label}</span>
            </span>
          </div>
        )}

        {/* Status badge — only show when no trend badge */}
        {!trendCfg && (
          <div className="absolute top-3 right-3">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full border ${STATUS_STYLES[post.status]}`}
            >
              {STATUS_LABEL[post.status]}
            </span>
          </div>
        )}

        {/* Sponsored label */}
        {isSponsored && (
          <div className="absolute bottom-6 left-3">
            <span className="text-xs font-bold px-2 py-1 rounded-full border border-zinc-600/60 bg-black/70 text-zinc-400">
              Sponsored
            </span>
          </div>
        )}

        {/* 72h survival bar */}
        {post.status === 'active' && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1 bg-black/60">
              <div
                className={`h-full transition-all ${urgency ? 'bg-red-500' : trend === 'trending' ? 'bg-orange-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, (hoursLeft / 72) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm leading-snug">{post.caption}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <button
                onClick={() => router.push(`/user/${post.username}`)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                @{post.username}
              </button>
              <span className="text-xs font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                <CategoryIcon category={post.category} size={11} className="inline-block mr-1" />{post.category}
              </span>
              <span className="text-xs text-zinc-600" suppressHydrationWarning>{timeAgo}</span>
            </div>
          </div>

          {/* Score + status */}
          <div className="text-right shrink-0">
            <div className="text-red-500 font-black text-lg leading-none">
              {post.score.toLocaleString()}
            </div>
            <div className="text-zinc-600 text-xs mt-0.5">score</div>
            {trendCfg && (
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-full border mt-1 inline-block ${STATUS_STYLES[post.status]}`}
              >
                {STATUS_LABEL[post.status]}
              </span>
            )}
            {hasActiveBoost && (
              <div className="text-xs font-bold text-violet-400 mt-1">
                {BOOST_TIERS[post.boost!.tier].icon} Boosted
              </div>
            )}
          </div>
        </div>

        {/* 72h countdown — only visible to post owner on posts with 0 likes */}
        {isOwnPost && post.status === 'active' && post.likes === 0 && (
          <div
            suppressHydrationWarning
            className={`text-xs mb-3 flex items-center gap-1.5 ${urgency ? 'text-red-400' : 'text-zinc-600'}`}
          >
            <span>{urgency ? '⚠️' : '⏱'}</span>
            <span suppressHydrationWarning>
              {hoursLeft < 1
                ? 'Less than 1 hour until inactive'
                : urgency
                ? `${Math.floor(hoursLeft)}h left — danger zone`
                : `${Math.floor(hoursLeft)}h window remaining`}
            </span>
          </div>
        )}

        {/* New-user encouragement — own post, first 24h, no engagement yet */}
        {isOwnPost && post.status === 'active' && post.likes === 0 && post.comments.length === 0 && (() => {
          const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000;
          return ageHours < 24;
        })() && (
          <div className="mb-3 flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 rounded-xl px-3 py-2">
            <span className="text-sm">🚀</span>
            <span className="text-zinc-400 text-xs">Your post is live — share it to get your first likes and start climbing.</span>
          </div>
        )}

        {/* Under review overlay */}
        {post.status === 'under_review' && (
          <div className="mb-3 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2">
            <span className="text-xs">🔍</span>
            <span className="text-yellow-500 text-xs font-semibold">Under review — removed from rankings pending moderation.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => likePost(post.id)}
            disabled={post.status !== 'active'}
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
              liked
                ? 'text-red-400'
                : post.status === 'active'
                ? 'text-zinc-400 hover:text-red-400'
                : 'text-zinc-700 cursor-not-allowed'
            }`}
          >
            <span>{liked ? '❤️' : '🤍'}</span>
            <span>{post.likes.toLocaleString()}</span>
          </button>

          <button
            onClick={() => setShowComments((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <span>💬</span>
            <span>{post.comments.length}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-white transition-colors"
          >
            <span>🔁</span>
            <span>{post.shares}</span>
          </button>

          <div className="flex items-center gap-1 text-sm text-zinc-600">
            <span>👁</span>
            <span>{(post.views ?? 0).toLocaleString()}</span>
          </div>

          {/* Rank movement summary */}
          {!showRank && rankMove !== 0 && (
            <span
              className={`ml-auto text-xs font-bold ${rankMove > 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {rankMove > 0 ? `↑ +${rankMove}` : `↓ ${rankMove}`} ranks today
            </span>
          )}

          {/* Boost button — own active posts only, dev mode only until user base is large enough */}
          {isOwnPost && post.status === 'active' && !hasActiveBoost && state.devMode && (
            <button
              onClick={() => setShowBoostModal(true)}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-zinc-600 hover:text-violet-400 transition-colors"
            >
              <span>🚀</span>
              <span>Boost</span>
            </button>
          )}

          {/* Report button */}
          {(!isOwnPost || hasActiveBoost) && (
            <button
              onClick={() => canReport && setShowReportModal(true)}
              className={`ml-auto flex items-center gap-1 text-xs font-semibold transition-colors ${
                canReport ? 'text-zinc-600 hover:text-yellow-500' : 'text-zinc-700 cursor-default'
              }`}
            >
              <span>🚩</span>
              <span>
                {alreadyReported || reported ? 'Reported' : dailyLimitReached ? 'Limit reached' : 'Report'}
              </span>
            </button>
          )}
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="mt-4 border-t border-zinc-800 pt-4 space-y-3">
            {post.comments.length === 0 && (
              <p className="text-xs text-zinc-600 italic">No comments yet.</p>
            )}
            {post.comments.filter(c => !c.parentId).map((c) => {
              const replies = post.comments.filter(r => r.parentId === c.id);
              return (
                <div key={c.id}>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <span className="text-xs font-bold text-zinc-400">@{c.username} </span>
                      <span className="text-xs text-zinc-300">{c.text}</span>
                    </div>
                    {post.status === 'active' && (
                      <button
                        onClick={() => setReplyingTo(replyingTo?.commentId === c.id ? null : { commentId: c.id, username: c.username })}
                        className="text-xs text-zinc-600 hover:text-zinc-400 shrink-0 transition-colors"
                      >
                        Reply
                      </button>
                    )}
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
            {post.status === 'active' && (
              <form onSubmit={handleComment} className="flex flex-col gap-2 mt-2">
                {replyingTo && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>Replying to @{replyingTo.username}</span>
                    <button type="button" onClick={() => setReplyingTo(null)} className="text-zinc-600 hover:text-zinc-400">✕</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyingTo ? `Reply to @${replyingTo.username}...` : 'Add a comment...'}
                    maxLength={200}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                  <button type="submit" className="bg-white text-black text-xs font-bold px-3 py-2 rounded-xl hover:bg-zinc-200 transition-colors">
                    Post
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>

    {showReportModal && (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-end"
        onClick={() => setShowReportModal(false)}
      >
        <div
          className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-w-lg mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-700" />
          </div>
          <div className="px-4 pb-8 pt-3">
            <h3 className="text-white font-black text-base mb-1">Report Post</h3>
            <p className="text-zinc-500 text-xs mb-4">
              Reports are reviewed collectively — a post must receive multiple reports before any action is taken.
            </p>

            {likedPost && (
              <div className="mb-4 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-400">
                You liked this post — you can't report content you've engaged with positively.
              </div>
            )}
            {dailyLimitReached && (
              <div className="mb-4 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-400">
                You've reached your {DAILY_REPORT_LIMIT} report limit for today. Resets at midnight.
              </div>
            )}

            <div className="space-y-2">
              {REPORT_OPTIONS.map(({ reason, label, icon, desc }) => (
                <button
                  key={reason}
                  onClick={() => canReport && handleReport(reason)}
                  disabled={!canReport}
                  className={`w-full flex items-center gap-3 border rounded-2xl px-4 py-3.5 transition-colors text-left ${canReport ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-600' : 'bg-zinc-950 border-zinc-800 opacity-40 cursor-not-allowed'}`}
                >
                  <span className="text-xl shrink-0">{icon}</span>
                  <div>
                    <div className="text-white text-sm font-bold">{label}</div>
                    <div className="text-zinc-500 text-xs">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReportModal(false)}
              className="w-full mt-3 py-3 text-zinc-500 text-sm font-semibold hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {showBoostModal && (
      <div
        className="fixed inset-0 z-50 bg-black/80 flex items-end"
        onClick={() => setShowBoostModal(false)}
      >
        <div
          className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-w-lg mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-700" />
          </div>
          <div className="px-4 pb-8 pt-3">
            <h3 className="text-white font-black text-base mb-1">Boost Post</h3>
            <p className="text-zinc-500 text-xs mb-4">
              Buy impressions to get your post shown to more users. Rankings stay organic — boosts only affect discovery.
            </p>
            <div className="space-y-2">
              {(Object.entries(BOOST_TIERS) as [BoostTier, typeof BOOST_TIERS[BoostTier]][]).map(([tier, cfg]) => (
                <button
                  key={tier}
                  disabled={purchasing !== null}
                  onClick={async () => {
                    setPurchasing(tier);
                    try {
                      const ok = await purchaseBoost(tier);
                      if (ok) { boostPost(post.id, tier); setShowBoostModal(false); }
                    } finally {
                      setPurchasing(null);
                    }
                  }}
                  className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/40 rounded-2xl px-4 py-3.5 transition-colors text-left"
                >
                  <span className="text-2xl shrink-0">{cfg.icon}</span>
                  <div className="flex-1">
                    <div className="text-white text-sm font-bold">{cfg.label}</div>
                    <div className="text-zinc-500 text-xs">{cfg.impressions.toLocaleString()} impressions</div>
                  </div>
                  <div className="text-violet-400 font-black text-sm">
                    {purchasing === tier ? '…' : `$${cfg.price.toFixed(2)}`}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBoostModal(false)}
              className="w-full mt-3 py-3 text-zinc-500 text-sm font-semibold hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

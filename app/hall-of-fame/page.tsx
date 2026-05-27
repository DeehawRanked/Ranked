'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { CATEGORY_GRADIENT, HallOfFameEntry, Comment } from '@/lib/types';
import CategoryIcon from '@/components/CategoryIcon';

export default function HallOfFamePage() {
  const { state } = useStore();
  const { hallOfFame } = state;
  const [selected, setSelected] = useState<HallOfFameEntry | null>(null);

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

  // Try to find the original post for full comment data
  const originalPost = selected
    ? state.posts.find((p) => p.id === selected.postId) ?? null
    : null;
  const comments: Comment[] = originalPost?.comments ?? selected?.comments ?? [];

  return (
    <>
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">👑</span>
          <h1 className="text-white font-black text-2xl">Hall of Fame</h1>
        </div>
        <p className="text-zinc-500 text-sm mb-6">
          The best posts from every season — immortalized.
        </p>

        {hallOfFame.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">👑</span>
            <p className="text-zinc-500 text-sm">No inductees yet.</p>
            <p className="text-zinc-700 text-xs mt-1">End a season to crown champions.</p>
          </div>
        )}

        {/* Overall champions highlight */}
        {overallWinners.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-red-500 font-black text-xs uppercase tracking-widest">
                Overall Champions
              </span>
            </div>
            <div className="space-y-4">
              {overallWinners.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => setSelected(entry)}
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-bold text-sm">{entry.caption}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-zinc-500 text-xs">@{entry.username}</span>
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                            <CategoryIcon category={entry.category} size={11} className="inline-block mr-1" />{entry.category}
                          </span>
                          <span className="text-xs text-red-500/70">{entry.winningMonth}</span>
                        </div>
                      </div>
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

        {/* All seasons grouped */}
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
                    onClick={() => setSelected(entry)}
                    className={`w-full text-left flex gap-3 bg-zinc-900 border rounded-2xl overflow-hidden active:scale-[0.99] transition-transform ${
                      entry.isOverallWinner ? 'border-red-500/20' : 'border-zinc-800'
                    }`}
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

      {/* Detail sheet */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onClick={() => setSelected(null)}>
          <div
            className="w-full bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[90vh] overflow-y-auto max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>

            {/* Image / carousel */}
            <div className="relative">
              {selected.images && selected.images.length > 1 ? (
                <div className="flex overflow-x-auto snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
                  {selected.images.map((src, i) => (
                    <img key={i} src={src} alt={selected.caption} className="w-full shrink-0 h-64 object-cover snap-center" />
                  ))}
                </div>
              ) : selected.imageUrl ? (
                <img src={selected.imageUrl} alt={selected.caption} className="w-full h-64 object-cover" />
              ) : (
                <div className={`w-full h-64 bg-gradient-to-br ${CATEGORY_GRADIENT[selected.category]} flex items-center justify-center`}>
                  <CategoryIcon category={selected.category} size={64} className="opacity-30 text-white" />
                </div>
              )}
              {selected.isOverallWinner && (
                <div className="absolute top-3 left-3">
                  <div className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <span>👑</span> Overall Winner
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 pt-4 pb-8">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                  <CategoryIcon category={selected.category} size={11} className="inline-block mr-1" />{selected.category}
                </span>
                <span className="text-xs text-zinc-500">@{selected.username}</span>
                <span className="text-xs text-red-500/70">{selected.winningMonth}</span>
              </div>
              <p className="text-white font-bold text-base mb-4">{selected.caption}</p>

              {/* Stats */}
              <div className="flex gap-6 pb-4 border-b border-zinc-800 mb-4">
                <div>
                  <div className="text-white font-black text-lg">{selected.likes.toLocaleString()}</div>
                  <div className="text-zinc-600 text-xs">likes</div>
                </div>
                <div>
                  <div className="text-white font-black text-lg">{selected.commentsCount}</div>
                  <div className="text-zinc-600 text-xs">comments</div>
                </div>
                <div>
                  <div className="text-red-500 font-black text-lg">#{selected.peakRank}</div>
                  <div className="text-zinc-600 text-xs">peak rank</div>
                </div>
              </div>

              {/* Comments */}
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Comments</p>
              {comments.length === 0 ? (
                <p className="text-zinc-700 text-xs italic">No comments available.</p>
              ) : (
                <div className="space-y-3">
                  {comments.filter((c) => !c.parentId).map((c) => {
                    const replies = comments.filter((r) => r.parentId === c.id);
                    return (
                      <div key={c.id}>
                        <div className="flex gap-2">
                          <div>
                            <span className="text-xs font-bold text-zinc-400">@{c.username} </span>
                            <span className="text-xs text-zinc-300">{c.text}</span>
                          </div>
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

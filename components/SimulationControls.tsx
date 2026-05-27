'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';

export default function SimulationControls() {
  const { simulate72h, endSeason, resetState, state } = useStore();
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const activePosts = state.posts.filter((p) => p.status === 'active').length;

  return (
    <div className="bg-zinc-950 border border-red-900/40 rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-red-500 text-xs">⚙</span>
        <span className="text-xs font-bold text-red-500/70 uppercase tracking-widest">
          Dev Controls
        </span>
        <span className="text-xs text-zinc-700 ml-auto font-mono">
          +{state.simulatedHoursOffset}h
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={simulate72h}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
        >
          ⏩ Simulate 72h
        </button>

        {!showConfirmEnd ? (
          <button
            onClick={() => setShowConfirmEnd(true)}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 hover:border-red-700/40 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            🏁 End Season
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">Top {Math.min(3, activePosts)} → HoF?</span>
            <button
              onClick={() => { endSeason(); setShowConfirmEnd(false); }}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setShowConfirmEnd(false)}
              className="bg-zinc-800 text-zinc-300 text-xs font-bold px-3 py-2 rounded-xl"
            >
              No
            </button>
          </div>
        )}

        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/50 text-zinc-500 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            🔄 Reset All
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">Wipe everything?</span>
            <button
              onClick={() => { resetState(); setShowConfirmReset(false); }}
              className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              className="bg-zinc-800 text-zinc-300 text-xs font-bold px-3 py-2 rounded-xl"
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Category } from '@/lib/types';
import { POST_LIMITS, getUploadStatus, formatCooldown } from '@/lib/limits';

interface Props {
  selectedCategory: Category | '';
  filename?: string;
}

export default function UploadLimits({ selectedCategory, filename = '' }: Props) {
  const { state } = useStore();
  const { posts, uploadHistory, currentUser, season } = state;

  const status = useMemo(
    () =>
      getUploadStatus(posts, uploadHistory, currentUser.id, selectedCategory, season, filename),
    [posts, uploadHistory, currentUser.id, selectedCategory, season, filename],
  );

  const dailyPct = (status.dailyUsed / POST_LIMITS.UPLOADS_PER_DAY) * 100;
  const monthlyPct = (status.monthlyActiveUsed / POST_LIMITS.ACTIVE_TOTAL_MONTHLY) * 100;
  const categoryPct = selectedCategory
    ? (status.categoryUsed / POST_LIMITS.ACTIVE_PER_CATEGORY) * 100
    : 0;

  function barColor(pct: number) {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 67) return 'bg-amber-500';
    return 'bg-green-500';
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Post Limits
        </span>
        {!status.canUpload && (
          <span className="ml-auto text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
            Blocked
          </span>
        )}
      </div>

      {/* Blocked reason banner */}
      {!status.canUpload && status.blockedReason && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-3">
          <p className="text-red-300 text-xs leading-relaxed">{status.blockedReason}</p>
          {status.cooldownUntil && (
            <p className="text-red-400 text-xs font-bold mt-1">
              Resets in {formatCooldown(status.cooldownUntil)}
            </p>
          )}
        </div>
      )}

      {/* Daily uploads */}
      <LimitBar
        label="Daily Uploads"
        used={status.dailyUsed}
        max={POST_LIMITS.UPLOADS_PER_DAY}
        pct={dailyPct}
        barColor={barColor(dailyPct)}
        suffix="today"
      />

      {/* Monthly active total */}
      <LimitBar
        label="Active Posts (Monthly)"
        used={status.monthlyActiveUsed}
        max={POST_LIMITS.ACTIVE_TOTAL_MONTHLY}
        pct={monthlyPct}
        barColor={barColor(monthlyPct)}
        suffix="active this season"
      />

      {/* Category slots — only show when category is selected */}
      {selectedCategory && (
        <LimitBar
          label={`${selectedCategory} Slots`}
          used={status.categoryUsed}
          max={POST_LIMITS.ACTIVE_PER_CATEGORY}
          pct={categoryPct}
          barColor={barColor(categoryPct)}
          suffix={`active in ${selectedCategory}`}
          highlight={categoryPct >= 100}
        />
      )}

      {/* Duplicate warning */}
      {status.isDuplicate && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3">
          <p className="text-amber-300 text-xs">
            ⚠️ This filename was already posted in{' '}
            <strong>{selectedCategory}</strong> this season. Re-posting the same image
            is not allowed.
          </p>
        </div>
      )}

      {/* All clear */}
      {status.canUpload && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span>
            {status.dailyRemaining} upload{status.dailyRemaining !== 1 ? 's' : ''} left today
            {selectedCategory
              ? ` · ${status.categoryRemaining}/${POST_LIMITS.ACTIVE_PER_CATEGORY} ${selectedCategory} slots open`
              : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function LimitBar({
  label,
  used,
  max,
  pct,
  barColor,
  suffix,
  highlight = false,
}: {
  label: string;
  used: number;
  max: number;
  pct: number;
  barColor: string;
  suffix: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-xs font-semibold ${highlight ? 'text-red-400' : 'text-zinc-400'}`}>
          {label}
        </span>
        <span
          className={`text-xs font-bold tabular-nums ${
            pct >= 100 ? 'text-red-400' : pct >= 67 ? 'text-amber-400' : 'text-zinc-300'
          }`}
        >
          {used}/{max}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="text-zinc-700 text-xs mt-1">{suffix}</p>
    </div>
  );
}

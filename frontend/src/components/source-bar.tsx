// SourceBar — Grepr signature visualization
// Stacked proportional bar showing how a topic / category is distributed
// across multiple subreddits. Built from vibes-v2 section-4.
'use client';

import { cn } from '@/lib/utils';
import { getSourceBarColor } from '@/lib/design-tokens';

export type SourceSlice = {
  source: string;   // raw subreddit name (no "r/" prefix)
  count: number;
  pct: number;      // 0-100
};

export interface SourceBarProps {
  slices: SourceSlice[];
  label?: string;
  className?: string;
}

export function SourceBar({ slices, label = 'Discuté dans', className }: SourceBarProps) {
  if (!slices || slices.length === 0) return null;
  const total = slices.reduce((s, x) => s + x.count, 0);

  return (
    <div className={cn('flex flex-col gap-2 max-w-2xl', className)}>
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-[9px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
          {total} mentions · {slices.length} {slices.length > 1 ? 'subs' : 'sub'}
        </span>
      </div>

      {/* Stacked proportional bar */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/10">
        {slices.map((slice) => (
          <div
            key={slice.source}
            className={cn('h-full', getSourceBarColor(slice.source))}
            style={{ width: `${slice.pct}%` }}
            title={`r/${slice.source}: ${slice.count} (${slice.pct}%)`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
        {slices.map((slice) => (
          <div key={slice.source} className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', getSourceBarColor(slice.source))} />
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
              r/{slice.source}
            </span>
            <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-slate-500">
              {slice.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

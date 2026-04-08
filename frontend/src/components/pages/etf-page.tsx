'use client';

import { useState, useMemo, useCallback } from 'react';
import { Post } from '@/types/post';
import { ETFInsight, getETFInsights, ETF_DATABASE } from '@/lib/etf-data';
import { ETFDetailDialog } from '@/components/dashboard/etf-detail-dialog';
import {
  Check,
  Copy,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';

interface ETFPageProps {
  posts: Post[];
}

type EligibilityFilter = 'all' | 'PEA' | 'CTO';
type SortKey = 'rank' | 'ticker' | 'name' | 'mentions' | 'sentiment' | 'ter' | 'eligible';
type SortDir = 'asc' | 'desc';

const SENTIMENT_ORDER = { positive: 0, neutral: 1, mixed: 2 } as const;

function sentimentDot(sentiment: ETFInsight['sentiment']) {
  switch (sentiment) {
    case 'positive':
      return <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />;
    case 'neutral':
      return <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />;
    case 'mixed':
      return <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />;
  }
}

function sentimentTextColor(sentiment: ETFInsight['sentiment']) {
  switch (sentiment) {
    case 'positive': return 'text-emerald-600 dark:text-emerald-400';
    case 'neutral': return 'text-blue-500 dark:text-blue-400';
    case 'mixed': return 'text-orange-500 dark:text-orange-400';
  }
}

function terColor(ter: string) {
  const val = parseFloat(ter);
  if (val <= 0.20) return 'text-emerald-600 dark:text-emerald-400';
  if (val <= 0.35) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

function SortHeader({
  label,
  columnKey,
  activeKey,
  activeDir,
  onSort,
  align = 'left',
  className,
}: {
  label: string;
  columnKey: SortKey;
  activeKey: SortKey;
  activeDir: SortDir;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  const isActive = activeKey === columnKey;
  const alignClass =
    align === 'right' ? 'justify-end text-right' :
    align === 'center' ? 'justify-center text-center' : 'text-left';
  return (
    <th className={cn('py-3 px-4 group', className)}>
      <button
        onClick={() => onSort(columnKey)}
        className={cn(
          'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors w-full',
          alignClass,
          isActive
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
        )}
      >
        {label}
        <div className="flex flex-col -space-y-1">
          <ChevronUp
            className={cn(
              'h-2.5 w-2.5',
              isActive && activeDir === 'asc' ? 'opacity-100' : 'opacity-30 group-hover:opacity-50'
            )}
          />
          <ChevronDown
            className={cn(
              'h-2.5 w-2.5',
              isActive && activeDir === 'desc' ? 'opacity-100' : 'opacity-30 group-hover:opacity-50'
            )}
          />
        </div>
      </button>
    </th>
  );
}

export function ETFPage({ posts }: ETFPageProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<EligibilityFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('mentions');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [copiedISIN, setCopiedISIN] = useState<string | null>(null);
  const [selectedETF, setSelectedETF] = useState<ETFInsight | null>(null);

  const insights = useMemo(() => getETFInsights(posts), [posts]);

  const allETFs = useMemo(() => {
    const insightMap = new Map(insights.map(i => [i.ticker, i]));
    const merged: ETFInsight[] = [];

    for (const etf of ETF_DATABASE) {
      const existing = insightMap.get(etf.ticker);
      if (existing) {
        merged.push(existing);
      } else {
        merged.push({
          ...etf,
          mentions: 0,
          avgScore: 0,
          posts: [],
          sentiment: 'neutral',
        });
      }
    }
    return merged;
  }, [insights]);

  const filtered = useMemo(() => {
    if (filter === 'all') return allETFs;
    if (filter === 'PEA') return allETFs.filter(e => e.eligible === 'PEA' || e.eligible === 'Both');
    return allETFs.filter(e => e.eligible === 'CTO' || e.eligible === 'Both');
  }, [allETFs, filter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'rank':
        case 'mentions':
          cmp = a.mentions - b.mentions;
          break;
        case 'ticker':
          cmp = a.ticker.localeCompare(b.ticker);
          break;
        case 'name':
          cmp = a.provider.localeCompare(b.provider);
          break;
        case 'sentiment':
          cmp = SENTIMENT_ORDER[a.sentiment] - SENTIMENT_ORDER[b.sentiment];
          break;
        case 'ter':
          cmp = parseFloat(a.ter) - parseFloat(b.ter);
          break;
        case 'eligible':
          cmp = a.eligible.localeCompare(b.eligible);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'ticker' || key === 'name' || key === 'eligible' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const copyISIN = useCallback((e: React.MouseEvent, isin: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(isin).then(() => {
      setCopiedISIN(isin);
      setTimeout(() => setCopiedISIN(null), 1500);
    }).catch(() => {});
  }, []);

  const totalMentions = useMemo(() => allETFs.reduce((sum, e) => sum + e.mentions, 0), [allETFs]);
  const positiveCount = useMemo(
    () => allETFs.filter(e => e.sentiment === 'positive').length,
    [allETFs]
  );

  const sentimentLabel = (sentiment: ETFInsight['sentiment']) => {
    switch (sentiment) {
      case 'positive': return t('etf.sentiment_positive');
      case 'neutral': return t('etf.sentiment_neutral');
      case 'mixed': return t('etf.sentiment_mixed');
    }
  };

  const filters: { label: string; value: EligibilityFilter }[] = [
    { label: t('etf.filter_all'), value: 'all' },
    { label: 'PEA', value: 'PEA' },
    { label: 'CTO', value: 'CTO' },
  ];

  return (
    <div className="bg-[var(--cockpit-bg)] font-sans text-stone-900 dark:text-stone-100 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-10">
        {/* Header */}
        <div className="pt-2 pb-4 border-b border-[var(--warm-border)]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-[10px] font-bold tracking-[0.2em] text-stone-500 dark:text-stone-400 uppercase">
                  {t('etf.ranking')}
                </h2>
                <div className="h-px w-12 bg-indigo-600/40" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 mb-3">
                {t('etf.title')}
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-xl mb-4">
                {t('etf.subtitle')}
              </p>
              <div className="flex gap-1">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded transition-all',
                      filter === f.value
                        ? 'bg-stone-900 text-white shadow-sm dark:bg-stone-100 dark:text-stone-900'
                        : 'text-stone-500 hover:bg-[var(--warm-hover)] hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500 font-bold">
                  {t('etf.tracked')}
                </span>
                <span className="font-mono text-lg font-semibold tabular-nums text-stone-800 dark:text-stone-200">
                  {allETFs.length}
                </span>
              </div>
              <div className="h-8 w-px bg-[var(--warm-border)]" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500 font-bold">
                  {t('etf.mentions')}
                </span>
                <span className="font-mono text-lg font-semibold tabular-nums text-stone-800 dark:text-stone-200">
                  {totalMentions}
                </span>
              </div>
              <div className="h-8 w-px bg-[var(--warm-border)]" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500 font-bold">
                  {t('etf.positive_sentiment')}
                </span>
                <span className="font-mono text-lg font-semibold tabular-nums text-stone-800 dark:text-stone-200">
                  {positiveCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table — paper sheet */}
        <div className="mt-6 border border-[var(--warm-border)] bg-[var(--paper-bg)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--warm-border)] bg-[var(--warm-divider)]/60">
                  <SortHeader label={t('etf.col_rank')} columnKey="rank" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} className="w-12 pl-6" />
                  <SortHeader label={t('etf.col_ticker')} columnKey="ticker" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                  <SortHeader label={t('etf.col_provider')} columnKey="name" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                  <SortHeader label={t('etf.col_mentions')} columnKey="mentions" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="right" />
                  <SortHeader label={t('etf.col_sentiment')} columnKey="sentiment" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="center" />
                  <SortHeader label={t('etf.col_ter')} columnKey="ter" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="center" />
                  <SortHeader label={t('etf.col_eligible')} columnKey="eligible" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="center" />
                  <th className="py-3 px-4 text-left text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 hidden md:table-cell">
                    {t('etf.col_isin')}
                  </th>
                  <th className="py-3 px-4 pr-6 text-center text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 w-10">
                    {t('etf.col_link')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--warm-divider)]">
                {sorted.map((etf, index) => (
                  <tr
                    key={etf.ticker}
                    onClick={() => setSelectedETF(etf)}
                    className="group hover:bg-[var(--warm-hover)] transition-colors cursor-pointer"
                  >
                    {/* Rank */}
                    <td className="py-2.5 px-6 font-mono text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                      {(index + 1).toString().padStart(2, '0')}
                    </td>

                    {/* Ticker */}
                    <td className="py-2.5 px-4">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold transition-all tracking-tight',
                          'bg-[var(--ticker-pill)] text-stone-700 dark:text-stone-200 group-hover:bg-indigo-600 group-hover:text-white'
                        )}
                      >
                        {etf.ticker}
                      </span>
                    </td>

                    {/* Provider / Name */}
                    <td className="py-2.5 px-4">
                      <div className="text-sm font-medium text-stone-700 dark:text-stone-300 line-clamp-1 transition-colors group-hover:text-stone-900 dark:group-hover:text-stone-100 group-hover:font-semibold max-w-[260px]">
                        {etf.provider}
                      </div>
                      <div className="text-[11px] text-stone-400 dark:text-stone-500 line-clamp-1 max-w-[260px]">
                        {etf.name}
                      </div>
                    </td>

                    {/* Mentions */}
                    <td className="py-2.5 px-4 text-right">
                      <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                        {etf.mentions.toLocaleString()}
                      </span>
                    </td>

                    {/* Sentiment */}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-[11px] font-medium',
                          sentimentTextColor(etf.sentiment)
                        )}
                      >
                        {sentimentDot(etf.sentiment)}
                        {sentimentLabel(etf.sentiment)}
                      </span>
                    </td>

                    {/* TER */}
                    <td className="py-2.5 px-4 text-center">
                      <span className={cn('font-mono text-[11px] font-bold tabular-nums', terColor(etf.ter))}>
                        {etf.ter}
                      </span>
                    </td>

                    {/* Eligible */}
                    <td className="py-2.5 px-4 text-center">
                      {etf.eligible === 'PEA' || etf.eligible === 'Both' ? (
                        <div className="flex justify-center">
                          <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 p-0.5 rounded">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-stone-300 dark:text-stone-600 text-[10px]">—</span>
                      )}
                    </td>

                    {/* ISIN */}
                    <td className="py-2.5 px-4 hidden md:table-cell">
                      <div className="inline-flex items-center gap-1.5">
                        <code className="font-mono text-[11px] text-stone-500 dark:text-stone-400 tracking-tight">
                          {etf.isin}
                        </code>
                        <button
                          onClick={(e) => copyISIN(e, etf.isin)}
                          className="p-1 rounded hover:bg-[var(--warm-divider)] transition-colors"
                          title={t('etf.copy_isin')}
                        >
                          {copiedISIN === etf.isin ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* justETF link */}
                    <td className="py-2.5 px-4 pr-6 text-center">
                      <a
                        href={`https://www.justetf.com/fr/find-etf.html?query=${encodeURIComponent(etf.isin)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex p-1 rounded hover:bg-[var(--warm-divider)] transition-colors"
                        title={t('etf.view_justetf')}
                      >
                        <ExternalLink className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sorted.length === 0 && (
            <div className="text-center py-16 text-stone-400 dark:text-stone-500 text-sm">
              {t('etf.no_results')}
            </div>
          )}

          {/* Footer / legend */}
          <div className="px-6 py-3 border-t border-[var(--warm-border)] bg-[var(--warm-divider)]/60 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 opacity-60">
                <Filter className="h-3 w-3 text-stone-500 dark:text-stone-400" />
                <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 tracking-wide uppercase">
                  Légende
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  {t('etf.sentiment_positive')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  {t('etf.sentiment_neutral')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  {t('etf.sentiment_mixed')}
                </span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase">
              {t('etf.legend_click')}
            </div>
          </div>
        </div>
      </div>

      {/* Detail dialog */}
      <ETFDetailDialog
        etf={selectedETF}
        open={!!selectedETF}
        onClose={() => setSelectedETF(null)}
        onPostClick={() => {}}
      />
    </div>
  );
}

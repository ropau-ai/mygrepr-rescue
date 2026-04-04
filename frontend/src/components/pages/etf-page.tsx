'use client';

import { useState, useMemo, useCallback } from 'react';
import { Post } from '@/types/post';
import { ETFInsight, getETFInsights, ETF_DATABASE } from '@/lib/etf-data';
import { ETFDetailDialog } from '@/components/dashboard/etf-detail-dialog';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
  ExternalLink,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

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
      return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />;
    case 'neutral':
      return <span className="inline-block w-2 h-2 rounded-full bg-blue-400" />;
    case 'mixed':
      return <span className="inline-block w-2 h-2 rounded-full bg-orange-500" />;
  }
}

function sentimentLabel(sentiment: ETFInsight['sentiment']) {
  switch (sentiment) {
    case 'positive': return 'Positif';
    case 'neutral': return 'Neutre';
    case 'mixed': return 'Divisé';
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

export function ETFPage({ posts }: ETFPageProps) {
  const [filter, setFilter] = useState<EligibilityFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('mentions');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [copiedISIN, setCopiedISIN] = useState<string | null>(null);
  const [selectedETF, setSelectedETF] = useState<ETFInsight | null>(null);

  const insights = useMemo(() => getETFInsights(posts), [posts]);

  // Merge ETF_DATABASE entries that have zero mentions
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
  const topSentiment = useMemo(() => {
    const positiveCount = allETFs.filter(e => e.sentiment === 'positive').length;
    const total = allETFs.filter(e => e.mentions > 0).length;
    if (total === 0) return '—';
    return `${positiveCount}/${total}`;
  }, [allETFs]);

  const filters: { label: string; value: EligibilityFilter }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'PEA', value: 'PEA' },
    { label: 'CTO', value: 'CTO' },
  ];

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600" />;
    }
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
      : <ChevronDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Classement ETF
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            ETF les plus mentionnés par la communauté Reddit francophone
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
              ETF suivis
            </div>
            <div className="text-lg font-medium text-slate-900 dark:text-slate-100 tabular-nums">
              {allETFs.length}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
              Mentions
            </div>
            <div className="text-lg font-medium text-slate-900 dark:text-slate-100 tabular-nums">
              {totalMentions}
            </div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">
              Sentiment positif
            </div>
            <div className="text-lg font-medium text-slate-900 dark:text-slate-100 tabular-nums">
              {topSentiment}
            </div>
          </div>
        </div>
      </div>

      {/* Section divider + filter chips */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Classement
        </span>
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        <div className="flex items-center gap-2">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-all ${
                filter === f.value
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                  : 'text-slate-500 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {([
                { key: 'rank' as SortKey, label: '#', align: 'text-left', width: 'w-10' },
                { key: 'ticker' as SortKey, label: 'Ticker', align: 'text-left', width: '' },
                { key: 'name' as SortKey, label: 'Fournisseur', align: 'text-left', width: '' },
                { key: 'mentions' as SortKey, label: 'Mentions', align: 'text-center', width: '' },
                { key: 'sentiment' as SortKey, label: 'Sentiment', align: 'text-center', width: '' },
                { key: 'ter' as SortKey, label: 'TER', align: 'text-center', width: '' },
                { key: 'eligible' as SortKey, label: 'Eligible', align: 'text-center', width: '' },
              ]).map(col => (
                <th
                  key={col.key}
                  className={`pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 cursor-pointer select-none ${col.align} ${col.width}`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon column={col.key} />
                  </span>
                </th>
              ))}
              <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-left">
                ISIN
              </th>
              <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center w-10">
                Lien
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((etf, index) => (
              <tr
                key={etf.ticker}
                onClick={() => setSelectedETF(etf)}
                className="border-b border-slate-100 dark:border-slate-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer"
              >
                {/* Rank */}
                <td className="py-3 pr-4">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                    {index + 1}
                  </span>
                </td>

                {/* Ticker */}
                <td className="py-3 pr-4">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {etf.ticker}
                  </span>
                </td>

                {/* Provider / Name */}
                <td className="py-3 pr-4">
                  <div className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                    {etf.provider}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                    {etf.name}
                  </div>
                </td>

                {/* Mentions */}
                <td className="py-3 pr-4 text-center">
                  <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {etf.mentions}
                  </span>
                </td>

                {/* Sentiment */}
                <td className="py-3 pr-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${sentimentTextColor(etf.sentiment)}`}>
                    {sentimentDot(etf.sentiment)}
                    {sentimentLabel(etf.sentiment)}
                  </span>
                </td>

                {/* TER */}
                <td className="py-3 pr-4 text-center">
                  <span className={`font-mono text-[11px] font-bold ${terColor(etf.ter)}`}>
                    {etf.ter}
                  </span>
                </td>

                {/* Eligible */}
                <td className="py-3 pr-4 text-center">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${
                    etf.eligible === 'PEA'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300'
                      : 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-800 dark:text-violet-300'
                  }`}>
                    {etf.eligible}
                  </span>
                </td>

                {/* ISIN */}
                <td className="py-3 pr-4">
                  <div className="inline-flex items-center gap-1.5">
                    <code className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {etf.isin}
                    </code>
                    <button
                      onClick={(e) => copyISIN(e, etf.isin)}
                      className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Copier ISIN"
                    >
                      {copiedISIN === etf.isin ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      )}
                    </button>
                  </div>
                </td>

                {/* justETF link */}
                <td className="py-3 text-center">
                  <a
                    href={`https://www.justetf.com/fr/find-etf.html?query=${etf.isin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Voir sur justETF"
                  >
                    <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
          Aucun ETF trouvé pour ce filtre.
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-emerald-500" /> Positif
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus className="w-3 h-3 text-blue-400" /> Neutre
        </span>
        <span className="inline-flex items-center gap-1.5">
          <TrendingDown className="w-3 h-3 text-orange-500" /> Divisé
        </span>
        <span className="ml-auto">Cliquer sur une ligne pour voir les détails</span>
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

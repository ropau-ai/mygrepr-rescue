'use client';

import { useState, useMemo, useEffect } from 'react';
import { getDataFreshness, getPostFreshness, getPostLanguage, getPostQualityScore, cn } from '@/lib/utils';
import { Post } from '@/types/post';
import { getETFInsights } from '@/lib/etf-data';
import { Check, TrendingUp, TrendingDown } from 'lucide-react';
import { getLastVisit, updateLastVisit, isNewSinceLastVisit } from '@/lib/last-visit';
import Link from 'next/link';
import { getSourceColor } from '@/lib/design-tokens';
import { SourceBar, type SourceSlice } from '@/components/source-bar';
import { useLanguage } from '@/components/language-provider';

interface DashboardPageProps {
  posts: Post[];
}

function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <div className="h-px w-12 bg-indigo-600/40" />
    </div>
  );
}

export function DashboardPage({ posts }: DashboardPageProps) {
  const { locale, t } = useLanguage();
  const [lastVisit] = useState(() => getLastVisit());

  useEffect(() => {
    const timer = setTimeout(() => updateLastVisit(), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Locale-scoped post pool: FR locale → only FR subreddits, EN → only EN subs.
  // Single source of truth that powers every memo on this page.
  const localizedPosts = useMemo(
    () => posts.filter(p => getPostLanguage(p.subreddit) === locale),
    [posts, locale]
  );

  const freshness = useMemo(() => getDataFreshness(localizedPosts, locale), [localizedPosts, locale]);

  const newPostCount = useMemo(() => {
    if (!lastVisit) return 0;
    return localizedPosts.filter(p => isNewSinceLastVisit(lastVisit, p.CreatedAt, p.created_utc)).length;
  }, [localizedPosts, lastVisit]);

  const etfInsights = useMemo(() => getETFInsights(localizedPosts), [localizedPosts]);

  const subredditCount = useMemo(() => {
    return new Set(localizedPosts.map(p => p.subreddit)).size;
  }, [localizedPosts]);

  // Hero/wire ranking by composite quality score (social + consensus + density + freshness)
  // instead of raw upvote count — surfaces "worth reading" not just "most voted".
  // Top 6 = rotation pool (5) + 1 buffer so sidebar always has 5 cards.
  const trending = useMemo(() => {
    return [...localizedPosts]
      .sort((a, b) => getPostQualityScore(b) - getPostQualityScore(a))
      .slice(0, 6);
  }, [localizedPosts]);

  const topETFs = useMemo(() => etfInsights.slice(0, 5), [etfInsights]);

  // Hero rotation: cycle through top 5 quality posts via localStorage idx counter.
  // Anti-staleness for visitors who reload within the same scrape window (6h-6h).
  // SSR renders pool[0]; client hydrates then swaps via post-mount state update.
  const rotationPool = useMemo(() => trending.slice(0, 5), [trending]);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    if (rotationPool.length === 0) return;
    const stored = parseInt(localStorage.getItem('grepr-hero-idx') ?? '-1', 10);
    const next = (Number.isFinite(stored) && stored >= 0 ? stored + 1 : 0) % rotationPool.length;
    localStorage.setItem('grepr-hero-idx', String(next));
    // One-shot mount sync of external state (localStorage) into React — not a cascading render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeroIdx(next);
  }, [rotationPool.length]);

  const featured = rotationPool[heroIdx] ?? rotationPool[0];

  // Sidebar: top 6 minus current hero = always 5 cards from highest-quality pool.
  const sidebarPosts = useMemo(() => {
    if (!featured) return trending.slice(0, 5);
    return trending.filter((p) => p.reddit_id !== featured.reddit_id).slice(0, 5);
  }, [trending, featured]);

  // SourceBar slices: distribution of the hero post's category across subreddits
  const heroSourceSlices = useMemo<SourceSlice[]>(() => {
    if (!featured) return [];
    const sameCategory = posts.filter(p => p.category && p.category === featured.category);
    if (sameCategory.length === 0) return [];
    const counts = new Map<string, number>();
    for (const p of sameCategory) {
      const key = p.subreddit;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    const total = sameCategory.length;
    return Array.from(counts.entries())
      .map(([source, count]) => ({
        source,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [featured, posts]);

  const today = new Date().toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const lastUpdateTime = useMemo(() => {
    if (posts.length === 0) return '—';
    const mostRecent = posts.reduce((latest, p) => {
      const t = p.CreatedAt || p.created_utc;
      if (!t) return latest;
      const d = new Date(typeof t === 'number' ? t * 1000 : t);
      return d > latest ? d : latest;
    }, new Date(0));
    if (mostRecent.getTime() === 0) return '—';
    return mostRecent.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [posts, locale]);

  return (
    <div className="font-sans text-stone-900 dark:text-stone-100 selection:bg-indigo-100">
      {/* ═══ EDITORIAL TOP HALF ═══ */}
      <section className="bg-[var(--editorial-bg)]">
        {/* Condensed masthead */}
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-8 border-b border-[var(--editorial-border)]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-[0.9] mb-3 text-stone-900 dark:text-stone-100">
                Grepr
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-stone-900 dark:text-stone-100 capitalize">
                  {today}
                </span>
                <div className="h-px w-6 bg-indigo-600/40" />
                <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase text-[var(--editorial-muted)] dark:text-stone-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  {t('dashboard.live')}
                </span>
                {newPostCount > 0 && (
                  <>
                    <div className="h-px w-6 bg-indigo-600/40" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
                      +{newPostCount} {newPostCount > 1 ? t('dashboard.new_many') : t('dashboard.new_one')}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400">
                  {t('dashboard.posts')}
                </p>
                <p className="text-lg font-medium text-stone-900 dark:text-stone-100 tabular-nums font-mono">
                  {posts.length}
                </p>
              </div>
              <div className="w-px h-8 bg-[var(--editorial-border)]" />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400">
                  {t('dashboard.subreddits')}
                </p>
                <p className="text-lg font-medium text-stone-900 dark:text-stone-100 tabular-nums font-mono">
                  {subredditCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero featured post */}
        {featured && (
          <div className="max-w-6xl mx-auto px-6 py-10 border-b border-[var(--editorial-border)]">
            <Eyebrow label={t('dashboard.featured')} />
            <Link
              href={`/posts/${featured.reddit_id}`}
              className="group flex flex-col md:flex-row gap-6 md:gap-8"
            >
              <div
                className={cn(
                  'shrink-0 flex items-center justify-center w-full md:w-40 h-8 md:h-auto md:max-h-14 text-[10px] font-bold uppercase tracking-wide rounded-sm',
                  getSourceColor(featured.subreddit)
                )}
              >
                r/{featured.subreddit}
              </div>
              <div className="flex flex-col gap-3 flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  {featured.category && (
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm leading-none shrink-0 tracking-wide uppercase">
                      {featured.category}
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-stone-400 dark:text-stone-500 tabular-nums font-mono">
                    {featured.score} · {featured.num_comments || 0} · {getPostFreshness(featured.created_utc, featured.created_a, locale).label}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight transition-colors group-hover:text-indigo-900 dark:group-hover:text-indigo-300">
                  {featured.title}
                </h2>
                {featured.summary && (
                  <p className="text-base text-stone-600 dark:text-stone-400 line-clamp-2 max-w-2xl">
                    {featured.summary}
                  </p>
                )}
                {heroSourceSlices.length > 1 && (
                  <div className="pt-4">
                    <SourceBar slices={heroSourceSlices} label={t('dashboard.discussed_in')} />
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Wire strip: latest posts */}
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow label={t('dashboard.latest_posts')} />
            <Link
              href="/posts"
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors mb-4"
            >
              {t('dashboard.see_all')} →
            </Link>
          </div>
          <div className="divide-y divide-[var(--warm-divider)] border-t border-[var(--warm-divider)]">
            {sidebarPosts.map((post) => {
              const pf = getPostFreshness(post.created_utc, post.created_a, locale);
              return (
                <Link
                  key={post.reddit_id}
                  href={`/posts/${post.reddit_id}`}
                  className="group flex items-center justify-between py-4 px-2 -mx-2 transition-all duration-200 hover:bg-[var(--warm-hover)]"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div
                      className={cn(
                        'hidden sm:flex shrink-0 w-32 justify-center items-center py-1 text-[10px] font-bold uppercase tracking-wide rounded-sm',
                        getSourceColor(post.subreddit)
                      )}
                    >
                      r/{post.subreddit}
                    </div>
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-3 min-w-0">
                        {post.category && (
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm leading-none shrink-0 tracking-wide uppercase">
                            {post.category}
                          </span>
                        )}
                        <h3 className="text-base md:text-[17px] font-bold text-stone-900 dark:text-stone-100 leading-tight transition-colors group-hover:text-indigo-900 dark:group-hover:text-indigo-300 truncate">
                          {post.title}
                        </h3>
                      </div>
                      {post.summary && (
                        <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-1 group-hover:text-stone-600 dark:group-hover:text-stone-300 max-w-xl">
                          {post.summary}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] font-medium text-stone-400 dark:text-stone-500 tabular-nums font-mono whitespace-nowrap shrink-0 pl-4">
                    {post.score} · {post.num_comments || 0} · {pf.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ SHARP SEAM ═══ */}
      <div className="w-full h-px bg-indigo-600/40" />

      {/* ═══ COCKPIT BOTTOM HALF ═══ */}
      <section className="bg-[var(--cockpit-bg)]">
        {/* Eyebrow + stats strip */}
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8 border-b border-[var(--warm-border)]">
          <Eyebrow label={t('dashboard.section_data')} />
          <div className="flex items-stretch gap-6 divide-x divide-[var(--warm-border)]">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                {t('dashboard.total_posts')}
              </span>
              <span className="text-xl font-bold tracking-tight font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                {posts.length.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col pl-6">
              <span className="text-[9px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                {t('dashboard.active_sources')}
              </span>
              <span className="text-xl font-bold tracking-tight font-mono text-stone-900 dark:text-stone-100 tabular-nums">
                {subredditCount}
              </span>
            </div>
            <div className="flex flex-col pl-6">
              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                {t('dashboard.last_update')}
              </span>
              <span className="text-xl font-bold tracking-tight font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                {lastUpdateTime}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-stone-400 dark:text-stone-500">
            {freshness.label}
          </p>
        </div>

        {/* ETF snapshot — top 5 */}
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between mb-4">
            <Eyebrow label={t('dashboard.top_etfs')} />
            <Link
              href="/etf"
              className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors mb-4"
            >
              {t('dashboard.see_full_ranking')} →
            </Link>
          </div>

          <div className="overflow-x-auto bg-[var(--paper-bg)] border border-[var(--warm-border)] rounded-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--warm-border)] bg-[var(--warm-divider)]/60">
                  <th className="py-3 px-6 w-12 text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">#</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('etf.col_ticker')}</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">{t('etf.col_provider')}</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">PEA</th>
                  <th className="py-3 px-4 pr-6 text-right text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {t('etf.col_mentions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--warm-divider)]">
                {topETFs.map((etf, index) => {
                  const isPea = etf.eligible === 'PEA' || etf.eligible === 'Both';
                  const isUp = etf.sentiment === 'positive';
                  return (
                    <tr
                      key={etf.ticker}
                      className="group hover:bg-[var(--warm-hover)] transition-colors cursor-default"
                    >
                      <td className="py-2.5 px-6 font-mono text-xs text-stone-400 dark:text-stone-500 tabular-nums">
                        {(index + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold tracking-tight bg-[var(--ticker-pill)] text-stone-700 dark:text-stone-200 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {etf.ticker}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-300 line-clamp-1 transition-colors group-hover:font-semibold group-hover:text-stone-900 dark:group-hover:text-stone-100">
                          {etf.provider}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {isPea ? (
                          <div className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 p-0.5 rounded inline-flex">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        ) : (
                          <span className="text-stone-300 dark:text-stone-600 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100 tabular-nums">
                            {etf.mentions.toLocaleString()}
                          </span>
                          {isUp ? (
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5 text-stone-400 dark:text-stone-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

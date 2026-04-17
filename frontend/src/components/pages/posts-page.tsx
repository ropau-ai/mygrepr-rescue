'use client';

import { useState, useMemo, useEffect } from 'react';
import { cn, getPostLanguage, getPostQualityScore, getConfidenceScore, filterByTimePeriod, formatDistanceToNow, type TimePeriod } from '@/lib/utils';
import { Post, CATEGORIES, CONSENSUS_COLORS } from '@/types/post';
import { Search, ArrowUpRight, X, TrendingUp } from 'lucide-react';
import { getLastVisit, updateLastVisit } from '@/lib/last-visit';
import { getSourceColor } from '@/lib/design-tokens';
import Link from 'next/link';
import { useLanguage } from '@/components/language-provider';
import { SparkleMark } from '@/components/debate/ropau-sigil';

interface PostsPageProps {
  posts: Post[];
}

type SortBy = 'quality' | 'score' | 'date' | 'confidence';
type Language = 'all' | 'fr' | 'en';

const POSTS_PER_PAGE = 50;

function getPostDate(post: Post): Date | null {
  if (post.created_utc) return new Date(post.created_utc * 1000);
  if (post.created_a) return new Date(post.created_a + 'Z');
  return null;
}

// Reusable eyebrow lockup — matches design-system.md pattern
function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="h-px w-12 bg-indigo-600/40" />
    </div>
  );
}

export function PostsPage({ posts }: PostsPageProps) {
  const { locale, t } = useLanguage();

  const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
    { value: 'all', label: t('posts.all') },
    { value: 'week', label: t('posts.7days') },
    { value: 'month', label: t('posts.30days') },
    { value: 'quarter', label: t('posts.90days') },
  ];

  const SORT_OPTIONS: { value: SortBy; label: string }[] = [
    { value: 'quality', label: t('posts.sort_quality') },
    { value: 'score', label: t('posts.sort_score') },
    { value: 'date', label: t('posts.sort_date') },
    { value: 'confidence', label: t('posts.sort_confidence') },
  ];

  const LANG_OPTIONS: { value: Language; label: string }[] = [
    { value: 'all', label: t('posts.lang_all') },
    { value: 'fr', label: t('posts.lang_fr') },
    { value: 'en', label: t('posts.lang_en') },
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([]);
  // Default lang filter follows the nav locale (FR locale → FR feed, EN → EN feed).
  // User can still flip to 'all' or the opposite language manually.
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(locale);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all');
  const [sortBy, setSortBy] = useState<SortBy>('quality');
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  // Re-sync the language filter when the user toggles the nav locale.
  // We only override if the current filter still matches the previous locale,
  // so manual choices (e.g. 'all') are preserved.
  const [prevLocale, setPrevLocale] = useState<Language>(locale);
  if (prevLocale !== locale) {
    if (selectedLanguage === prevLocale) setSelectedLanguage(locale);
    setPrevLocale(locale);
  }

  useEffect(() => {
    getLastVisit();
    const timer = setTimeout(() => updateLastVisit(), 3000);
    return () => clearTimeout(timer);
  }, []);

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return CATEGORIES.map((cat) => ({ category: cat, count: counts[cat] || 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  const subredditStats = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.subreddit) counts[p.subreddit] = (counts[p.subreddit] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([subreddit, count]) => ({ subreddit, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !searchQuery ||
          p.title?.toLowerCase().includes(q) ||
          p.summary?.toLowerCase().includes(q);
        const matchesCategory =
          selectedCategories.length === 0 || selectedCategories.includes(p.category || '');
        const matchesSubreddit =
          selectedSubreddits.length === 0 || selectedSubreddits.includes(p.subreddit || '');
        const matchesLanguage =
          selectedLanguage === 'all' || getPostLanguage(p.subreddit) === selectedLanguage;
        const matchesTime = filterByTimePeriod(p.created_utc, selectedTimePeriod, p.created_a);
        return matchesSearch && matchesCategory && matchesSubreddit && matchesLanguage && matchesTime;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'quality':
            return getPostQualityScore(b) - getPostQualityScore(a);
          case 'confidence':
            return getConfidenceScore(b, locale).score - getConfidenceScore(a, locale).score;
          case 'date': {
            const dateA = a.created_utc || (a.created_a ? new Date(a.created_a + 'Z').getTime() / 1000 : 0);
            const dateB = b.created_utc || (b.created_a ? new Date(b.created_a + 'Z').getTime() / 1000 : 0);
            return dateB - dateA;
          }
          default:
            return (b.score || 0) - (a.score || 0);
        }
      });
  }, [posts, searchQuery, selectedCategories, selectedSubreddits, selectedLanguage, selectedTimePeriod, sortBy, locale]);

  const filterKey = `${searchQuery}|${selectedCategories}|${selectedSubreddits}|${selectedLanguage}|${selectedTimePeriod}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(POSTS_PER_PAGE);
  }

  const visiblePosts = useMemo(() => filteredPosts.slice(0, visibleCount), [filteredPosts, visibleCount]);
  const hasMore = visibleCount < filteredPosts.length;

  const toggleCategory = (cat: string) =>
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  const toggleSubreddit = (sub: string) =>
    setSelectedSubreddits((prev) => (prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]));

  const hasFilters =
    selectedCategories.length > 0 ||
    selectedSubreddits.length > 0 ||
    selectedLanguage !== 'all' ||
    selectedTimePeriod !== 'all' ||
    searchQuery !== '';

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubreddits([]);
    setSelectedLanguage('all');
    setSelectedTimePeriod('all');
    setSearchQuery('');
  };

  return (
    <main className="min-h-screen bg-[var(--editorial-bg)] text-foreground selection:bg-indigo-100 dark:selection:bg-indigo-900/40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="flex gap-8">

          {/* Sidebar — warm editorial system */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-20 space-y-7">

              {/* Period */}
              <div>
                <Eyebrow label={t('posts.period')} />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {PERIOD_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedTimePeriod(value)}
                      className={cn(
                        'px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wide border-b-2 transition-all cursor-pointer',
                        selectedTimePeriod === value
                          ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                          : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-[var(--warm-border)]'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <Eyebrow label={t('posts.language')} />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {LANG_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedLanguage(value)}
                      className={cn(
                        'px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wide border-b-2 transition-all cursor-pointer',
                        selectedLanguage === value
                          ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                          : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-[var(--warm-border)]'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <Eyebrow label={t('posts.categories')} />
                <div className="mt-3 space-y-px max-h-[280px] overflow-y-auto">
                  {categoryStats.map(({ category, count }) => {
                    const checked = selectedCategories.includes(category);
                    return (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1 rounded-sm text-xs transition-colors',
                          checked
                            ? 'bg-[var(--warm-hover)] text-foreground font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-[var(--warm-hover)]'
                        )}
                      >
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          checked ? 'bg-indigo-600' : 'bg-[var(--warm-border)]'
                        )} />
                        <span className="flex-1 text-left">{category}</span>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sources */}
              <div>
                <Eyebrow label={t('posts.sources')} />
                <div className="mt-3 space-y-px max-h-[240px] overflow-y-auto">
                  {subredditStats.map(({ subreddit, count }) => {
                    const checked = selectedSubreddits.includes(subreddit);
                    return (
                      <button
                        key={subreddit}
                        onClick={() => toggleSubreddit(subreddit)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1 rounded-sm text-xs transition-colors',
                          checked
                            ? 'bg-[var(--warm-hover)] text-foreground font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-[var(--warm-hover)]'
                        )}
                      >
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          checked ? 'bg-indigo-600' : 'bg-[var(--warm-border)]'
                        )} />
                        <span className="flex-1 text-left">r/{subreddit}</span>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  {t('posts.clear_filters')}
                </button>
              )}
            </div>
          </aside>

          {/* Main wire feed */}
          <div className="flex-1 min-w-0">

            {/* Search bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t('posts.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-sm border border-[var(--warm-border)] text-sm bg-[var(--paper-bg)] text-foreground placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile filter trigger */}
            <MobileFilters
              categoryStats={categoryStats}
              subredditStats={subredditStats}
              selectedCategories={selectedCategories}
              selectedSubreddits={selectedSubreddits}
              selectedLanguage={selectedLanguage}
              selectedTimePeriod={selectedTimePeriod}
              toggleCategory={toggleCategory}
              toggleSubreddit={toggleSubreddit}
              setSelectedLanguage={setSelectedLanguage}
              setSelectedTimePeriod={setSelectedTimePeriod}
              clearFilters={clearFilters}
              hasFilters={hasFilters}
              periodOptions={PERIOD_OPTIONS}
              langOptions={LANG_OPTIONS}
              t={t}
            />

            {/* Sort + count strip */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--warm-border)]">
              <div className="flex items-center gap-1">
                {SORT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    className={cn(
                      'px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer border-b-2',
                      sortBy === value
                        ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
                        : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                {filteredPosts.length} posts
              </span>
            </div>

            {/* Active filter chips */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                  >
                    {cat}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            {/* Wire feed — flat list */}
            <div className="divide-y divide-[var(--warm-divider)]">
              {visiblePosts.length > 0 ? visiblePosts.map((post) => {
                const postDate = getPostDate(post);
                const timeLabel = postDate ? formatDistanceToNow(postDate, locale) : '';
                const sourceClass = getSourceColor(post.subreddit);
                const confidence = sortBy === 'confidence' ? getConfidenceScore(post, locale) : null;

                return (
                  <div
                    key={post.Id}
                    className="group relative flex items-center justify-between py-4 px-2 -mx-2 transition-all duration-200 hover:bg-[var(--warm-hover)]"
                  >
                    <Link
                      href={`/posts/${post.reddit_id}`}
                      className="flex items-center min-w-0 flex-1 gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={cn(
                          'hidden sm:flex shrink-0 w-32 justify-center items-center py-1 text-[10px] font-bold uppercase tracking-wide rounded-sm',
                          sourceClass
                        )}>
                          r/{post.subreddit}
                        </div>
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <div className="flex items-center gap-3 min-w-0">
                            {post.category && (
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-sm leading-none shrink-0 tracking-wide uppercase">
                                {post.category}
                              </span>
                            )}
                            {post.consensus && CONSENSUS_COLORS[post.consensus.toLowerCase()] && (
                              <span
                                title={`Consensus: ${CONSENSUS_COLORS[post.consensus.toLowerCase()].label}`}
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full shrink-0',
                                  CONSENSUS_COLORS[post.consensus.toLowerCase()].bg
                                )}
                              />
                            )}
                            <h2 className="text-base md:text-[17px] font-bold text-foreground leading-tight transition-colors group-hover:text-indigo-900 dark:group-hover:text-indigo-300 truncate">
                              {post.title}
                            </h2>
                          </div>
                          {post.summary && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 group-hover:text-slate-600 dark:group-hover:text-slate-300 max-w-2xl">
                              {post.summary}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 pl-4">
                        <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap">
                          {post.score || 0} · {post.num_comments || 0}{timeLabel ? ` · ${timeLabel}` : ''}
                        </div>
                        {confidence && (
                          <div className={cn('text-[10px] font-mono font-bold tabular-nums mt-0.5', confidence.color)}>
                            {confidence.score}%
                          </div>
                        )}
                      </div>

                      <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-all ml-4">
                        <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                      </div>
                    </Link>

                    <Link
                      href={`/debate/${post.reddit_id}`}
                      aria-label={`Lancer le débat IA sur : ${post.title}`}
                      className={cn(
                        'shrink-0 ml-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm',
                        'text-[10px] font-bold uppercase tracking-[0.12em]',
                        'border border-[color:var(--ropau-crimson)]/30',
                        'text-[color:var(--ropau-crimson)] dark:text-[#FF6B85]',
                        'bg-[color:var(--ropau-crimson)]/0 hover:bg-[color:var(--ropau-crimson)]/10',
                        'md:opacity-0 md:group-hover:opacity-100 transition-all'
                      )}
                    >
                      <SparkleMark size={10} />
                      Débat
                    </Link>
                  </div>
                );
              }) : (
                <div className="py-20 text-center">
                  <TrendingUp className="w-10 h-10 text-[var(--warm-border)] mx-auto mb-4" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">{t('posts.no_results')}</p>
                  {hasFilters && (
                    <button onClick={clearFilters} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                      {t('posts.clear_filters')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
                  className="px-5 py-2.5 rounded-sm border border-[var(--warm-border)] bg-[var(--paper-bg)] text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-600 transition-colors"
                >
                  {t('posts.load_more', { count: filteredPosts.length - visibleCount })}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function MobileFilters({
  categoryStats,
  subredditStats,
  selectedCategories,
  selectedSubreddits,
  selectedLanguage,
  selectedTimePeriod,
  toggleCategory,
  toggleSubreddit,
  setSelectedLanguage,
  setSelectedTimePeriod,
  clearFilters,
  hasFilters,
  periodOptions,
  langOptions,
  t,
}: {
  categoryStats: { category: string; count: number }[];
  subredditStats: { subreddit: string; count: number }[];
  selectedCategories: string[];
  selectedSubreddits: string[];
  selectedLanguage: Language;
  selectedTimePeriod: TimePeriod;
  toggleCategory: (cat: string) => void;
  toggleSubreddit: (sub: string) => void;
  setSelectedLanguage: (lang: Language) => void;
  setSelectedTimePeriod: (period: TimePeriod) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  periodOptions: { value: TimePeriod; label: string }[];
  langOptions: { value: Language; label: string }[];
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-sm border text-[10px] font-bold uppercase tracking-[0.15em] transition-colors w-full justify-center',
          open
            ? 'bg-indigo-600 text-white border-indigo-600'
            : 'text-slate-600 dark:text-slate-300 border-[var(--warm-border)] bg-[var(--paper-bg)] hover:border-indigo-600'
        )}
      >
        {t('posts.filters')}
        {hasFilters && (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        )}
      </button>

      {open && (
        <div className="mt-3 p-4 rounded-sm border border-[var(--warm-border)] bg-[var(--paper-bg)] space-y-5">
          {/* Period */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t('posts.period')}</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {periodOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedTimePeriod(value)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-bold uppercase rounded-sm border transition-all',
                    selectedTimePeriod === value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-slate-500 border-[var(--warm-border)]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t('posts.language')}</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {langOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedLanguage(value)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-bold uppercase rounded-sm border transition-all',
                    selectedLanguage === value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-slate-500 border-[var(--warm-border)]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t('posts.categories')}</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {categoryStats.map(({ category, count }) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-bold uppercase rounded-sm border transition-all',
                    selectedCategories.includes(category)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-slate-500 border-[var(--warm-border)]'
                  )}
                >
                  {category} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t('posts.sources')}</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {subredditStats.map(({ subreddit, count }) => (
                <button
                  key={subreddit}
                  onClick={() => toggleSubreddit(subreddit)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-bold uppercase rounded-sm border transition-all',
                    selectedSubreddits.includes(subreddit)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'text-slate-500 border-[var(--warm-border)]'
                  )}
                >
                  r/{subreddit} ({count})
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--warm-divider)]">
            {hasFilters && (
              <button onClick={clearFilters} className="text-[10px] font-bold uppercase tracking-wide text-rose-500 hover:text-rose-600">
                {t('posts.clear_all')}
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="ml-auto px-4 py-1.5 rounded-sm bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide"
            >
              {t('posts.apply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

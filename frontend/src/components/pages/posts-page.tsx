'use client';

import { useState, useMemo, useEffect } from 'react';
import { cn, getPostLanguage, getConfidenceScore, filterByTimePeriod, formatDistanceToNow, type TimePeriod } from '@/lib/utils';
import { Post, CATEGORIES } from '@/types/post';
import { Search, MessageSquare, ChevronUp, Clock, X } from 'lucide-react';
import { getLastVisit, updateLastVisit } from '@/lib/last-visit';
import Link from 'next/link';

interface PostsPageProps {
  posts: Post[];
}

type SortBy = 'score' | 'date' | 'confidence';
type Language = 'all' | 'fr' | 'en';

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'all', label: 'Tout' },
  { value: 'week', label: '7 jours' },
  { value: 'month', label: '30 jours' },
  { value: 'quarter', label: '90 jours' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'score', label: 'Plus votés' },
  { value: 'date', label: 'Plus récents' },
  { value: 'confidence', label: 'Fiabilité' },
];

const LANG_OPTIONS: { value: Language; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
];

const POSTS_PER_PAGE = 50;

export function PostsPage({ posts }: PostsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('all');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all');
  const [sortBy, setSortBy] = useState<SortBy>('score');
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

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
          case 'confidence':
            return getConfidenceScore(b).score - getConfidenceScore(a).score;
          case 'date': {
            const dateA = a.created_utc || (a.created_a ? new Date(a.created_a + 'Z').getTime() / 1000 : 0);
            const dateB = b.created_utc || (b.created_a ? new Date(b.created_a + 'Z').getTime() / 1000 : 0);
            return dateB - dateA;
          }
          default:
            return (b.score || 0) - (a.score || 0);
        }
      });
  }, [posts, searchQuery, selectedCategories, selectedSubreddits, selectedLanguage, selectedTimePeriod, sortBy]);

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
    <main className="min-h-screen bg-[#fcfcfc] dark:bg-[#0f0f14]">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-8">

              {/* Period */}
              <div>
                <SectionLabel>Période</SectionLabel>
                <div className="space-y-1 mt-3">
                  {PERIOD_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedTimePeriod(value)}
                      className={cn(
                        'block w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors',
                        selectedTimePeriod === value
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <SectionLabel>Langue</SectionLabel>
                <div className="space-y-1 mt-3">
                  {LANG_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedLanguage(value)}
                      className={cn(
                        'block w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors',
                        selectedLanguage === value
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <SectionLabel>Catégories</SectionLabel>
                <div className="space-y-0.5 mt-3 max-h-[320px] overflow-y-auto">
                  {categoryStats.map(({ category, count }) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className={cn(
                        'flex-1',
                        selectedCategories.includes(category) ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-400'
                      )}>
                        {category}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                        {count}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sources */}
              <div>
                <SectionLabel>Sources</SectionLabel>
                <div className="space-y-0.5 mt-3 max-h-[240px] overflow-y-auto">
                  {subredditStats.map(({ subreddit, count }) => (
                    <label
                      key={subreddit}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSubreddits.includes(subreddit)}
                        onChange={() => toggleSubreddit(subreddit)}
                        className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className={cn(
                        'flex-1',
                        selectedSubreddits.includes(subreddit) ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-400'
                      )}>
                        r/{subreddit}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                        {count}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Effacer les filtres
                </button>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Search bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Rechercher dans les titres et résumés..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm bg-white dark:bg-[#1a1a22] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort + count bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                {SORT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setSortBy(value)}
                    className={cn(
                      'px-4 py-1.5 text-sm font-medium rounded-full border transition-all',
                      sortBy === value
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                        : 'text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 tabular-nums">
                {filteredPosts.length} posts
              </span>
            </div>

            {/* Mobile filters (collapsed) */}
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
            />

            {/* Section divider */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Fil
              </span>
              <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
            </div>

            {/* Active filter chips (quick category pills) */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                  >
                    {cat}
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            {/* Dense rows */}
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {visiblePosts.map((post, idx) => {
                const postDate = getPostDate(post);
                const timeLabel = postDate ? formatDistanceToNow(postDate) : '';
                const confidence = getConfidenceScore(post);

                return (
                  <Link
                    key={post.Id}
                    href={`/posts/${post.reddit_id}`}
                    className="group flex items-start gap-3 px-3 py-2.5 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors"
                  >
                    {/* Rank */}
                    <span className="font-mono text-[11px] text-slate-300 dark:text-slate-600 w-6 pt-0.5 text-right shrink-0 tabular-nums">
                      {idx + 1}
                    </span>

                    {/* Votes */}
                    <span className="flex flex-col items-center w-8 shrink-0 pt-0.5">
                      <ChevronUp className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                        {post.score || 0}
                      </span>
                    </span>

                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-900 dark:group-hover:text-indigo-300 tracking-tight line-clamp-1">
                        {post.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          r/{post.subreddit}
                        </span>
                        {post.category && (
                          <span className="font-mono text-[9px] uppercase bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 px-1.5 py-px rounded-[2px]">
                            {post.category}
                          </span>
                        )}
                        {post.consensus && (
                          <span className={cn(
                            'text-[10px] font-medium',
                            post.consensus.toLowerCase() === 'fort' && 'text-emerald-600 dark:text-emerald-400',
                            post.consensus.toLowerCase() === 'moyen' && 'text-amber-600 dark:text-amber-400',
                            post.consensus.toLowerCase() === 'faible' && 'text-orange-600 dark:text-orange-400',
                            (post.consensus.toLowerCase() === 'divise' || post.consensus.toLowerCase() === 'divisé') && 'text-red-600 dark:text-red-400',
                          )}>
                            {post.consensus}
                          </span>
                        )}
                        {sortBy === 'confidence' && (
                          <span className={cn('text-[10px] font-mono font-bold tabular-nums', confidence.color)}>
                            {confidence.score}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time + comments */}
                    <div className="flex items-center gap-3 shrink-0 pt-0.5">
                      {(post.num_comments ?? 0) > 0 && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <MessageSquare className="w-3 h-3" />
                          <span className="font-mono tabular-nums">{post.num_comments}</span>
                        </span>
                      )}
                      {timeLabel && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                          <Clock className="w-3 h-3" />
                          {timeLabel}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-sm text-slate-400 dark:text-slate-500">Aucun post trouvé.</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                    Effacer les filtres
                  </button>
                )}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
                  className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                  Voir plus ({filteredPosts.length - visibleCount} restants)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {children}
      </span>
      <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
    </div>
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
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-4">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors w-full justify-center',
          open
            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
            : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
        )}
      >
        Filtres
        {hasFilters && (
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
        )}
      </button>

      {open && (
        <div className="mt-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a22] space-y-5">
          {/* Period */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Période</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PERIOD_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedTimePeriod(value)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full border transition-all',
                    selectedTimePeriod === value
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 border-slate-200 dark:border-white/10 dark:text-slate-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Langue</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {LANG_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedLanguage(value)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full border transition-all',
                    selectedLanguage === value
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 border-slate-200 dark:border-white/10 dark:text-slate-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Catégories</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {categoryStats.map(({ category, count }) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full border transition-all',
                    selectedCategories.includes(category)
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 border-slate-200 dark:border-white/10 dark:text-slate-400'
                  )}
                >
                  {category} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Sources</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {subredditStats.map(({ subreddit, count }) => (
                <button
                  key={subreddit}
                  onClick={() => toggleSubreddit(subreddit)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-full border transition-all',
                    selectedSubreddits.includes(subreddit)
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                      : 'text-slate-500 border-slate-200 dark:border-white/10 dark:text-slate-400'
                  )}
                >
                  r/{subreddit} ({count})
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600">
                Tout effacer
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="ml-auto px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

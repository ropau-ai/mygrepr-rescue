'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { cn, getPostLanguage, getDataFreshness, getPostFreshness, getConfidenceScore, filterByTimePeriod, type TimePeriod, formatDistanceToNow } from '@/lib/utils';
import { Post, CATEGORIES } from '@/types/post';
import { Search, X, MessageSquare, ArrowUp, Filter, LayoutGrid, List, Clock, Sparkles } from 'lucide-react';
import { getLastVisit, updateLastVisit, isNewSinceLastVisit, getReadPosts } from '@/lib/last-visit';
import Link from 'next/link';

interface PostsPageProps {
  posts: Post[];
}

export function PostsPage({ posts }: PostsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'fr' | 'en'>('fr');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all');
  const [sortBy, setSortBy] = useState<'score' | 'confidence' | 'date'>('score');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(30);
  const [readPosts, setReadPosts] = useState<Set<string>>(new Set());

  const POSTS_PER_PAGE = 30;

  const lastVisit = useRef<number | null>(null);
  const [lastVisitLabel, setLastVisitLabel] = useState<string>('');

  useEffect(() => {
    const lv = getLastVisit();
    lastVisit.current = lv;
    if (lv) setLastVisitLabel(formatDistanceToNow(new Date(lv)));
    setReadPosts(getReadPosts());
    const timer = setTimeout(() => updateLastVisit(), 3000);
    return () => clearTimeout(timer);
  }, []);

  const newPostCount = useMemo(() => {
    if (!lastVisit.current) return 0;
    return posts.filter(p => isNewSinceLastVisit(lastVisit.current, p.CreatedAt, p.created_utc)).length;
  }, [posts]);

  const freshness = useMemo(() => getDataFreshness(posts), [posts]);

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => { if (p.category) counts[p.category] = (counts[p.category] || 0) + 1; });
    return CATEGORIES.map((cat) => ({ category: cat, count: counts[cat] || 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  const subredditStats = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => { if (p.subreddit) counts[p.subreddit] = (counts[p.subreddit] || 0) + 1; });
    return Object.entries(counts).map(([subreddit, count]) => ({ subreddit, count })).sort((a, b) => b.count - a.count);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchesSearch = !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.summary?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category || '');
      const matchesSubreddit = selectedSubreddits.length === 0 || selectedSubreddits.includes(p.subreddit || '');
      const matchesLanguage = selectedLanguage === 'all' || getPostLanguage(p.subreddit) === selectedLanguage;
      const matchesTime = filterByTimePeriod(p.created_utc, selectedTimePeriod, p.created_a);
      return matchesSearch && matchesCategory && matchesSubreddit && matchesLanguage && matchesTime;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'confidence': return getConfidenceScore(b).score - getConfidenceScore(a).score;
        case 'date': {
          const dateA = a.created_utc || (a.created_a ? new Date(a.created_a + 'Z').getTime() / 1000 : 0);
          const dateB = b.created_utc || (b.created_a ? new Date(b.created_a + 'Z').getTime() / 1000 : 0);
          return dateB - dateA;
        }
        default: return (b.score || 0) - (a.score || 0);
      }
    });
  }, [posts, searchQuery, selectedCategories, selectedSubreddits, selectedLanguage, selectedTimePeriod, sortBy]);

  useEffect(() => { setVisibleCount(POSTS_PER_PAGE); }, [searchQuery, selectedCategories, selectedSubreddits, selectedLanguage, selectedTimePeriod]);

  const visiblePosts = useMemo(() => filteredPosts.slice(0, visibleCount), [filteredPosts, visibleCount]);
  const hasMore = visibleCount < filteredPosts.length;

  const toggleCategory = (cat: string) => setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  const toggleSubreddit = (sub: string) => setSelectedSubreddits((prev) => prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]);
  const clearFilters = () => { setSelectedCategories([]); setSelectedSubreddits([]); setSelectedLanguage('all'); setSelectedTimePeriod('all'); setSearchQuery(''); };
  const hasFilters = selectedCategories.length > 0 || selectedSubreddits.length > 0 || selectedLanguage !== 'all' || selectedTimePeriod !== 'all' || searchQuery;

  return (
    <main className="min-h-screen bg-background pt-6 pb-16">
      <div className="max-w-[1440px] mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
            Deep Dives
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse and explore financial advice from Reddit communities
          </p>
          <div className={cn('flex items-center gap-2 mt-2 text-xs', freshness.hoursAgo < 24 ? 'text-green-500' : 'text-muted-foreground')}>
            <Clock className="w-3 h-3" />
            <span>{freshness.label}</span>
          </div>
        </div>

        {/* New posts banner */}
        {newPostCount > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-border bg-card/40 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium">
              {newPostCount} new post{newPostCount > 1 ? 's' : ''} since your last visit
            </p>
            {lastVisitLabel && <p className="text-xs text-muted-foreground">({lastVisitLabel})</p>}
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-card/40 border-border placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn('flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm bg-card/40 border-border text-muted-foreground', showFilters && 'border-foreground text-foreground')}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasFilters && <span className="px-1.5 py-0.5 rounded-full bg-foreground text-background text-xs">{selectedCategories.length + selectedSubreddits.length + (searchQuery ? 1 : 0)}</span>}
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-500 bg-red-50 dark:bg-red-500/10">
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button onClick={() => setViewMode('grid')} className={cn('p-2.5', viewMode === 'grid' ? 'bg-foreground text-background' : 'bg-card/40 text-muted-foreground')}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={cn('p-2.5', viewMode === 'list' ? 'bg-foreground text-background' : 'bg-card/40 text-muted-foreground')}>
                <List className="w-4 h-4" />
              </button>
            </div>
            <div className="flex rounded-lg overflow-hidden border border-border">
              {(['all', 'fr', 'en'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedLanguage(key)}
                  className={cn('px-3 py-2 text-xs font-medium', selectedLanguage === key ? 'bg-foreground text-background' : 'bg-card/40 text-muted-foreground')}
                >
                  {key === 'all' ? 'All' : key.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex rounded-lg overflow-hidden border border-border">
              {([
                { value: 'all' as TimePeriod, label: 'All' },
                { value: 'week' as TimePeriod, label: '7d' },
                { value: 'month' as TimePeriod, label: '30d' },
                { value: 'quarter' as TimePeriod, label: '3m' },
              ]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedTimePeriod(value)}
                  className={cn('px-3 py-2 text-xs font-medium', selectedTimePeriod === value ? 'bg-foreground text-background' : 'bg-card/40 text-muted-foreground')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-6 rounded-xl border bg-card/40 border-border mb-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 text-muted-foreground">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {categoryStats.map(({ category, count }) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all',
                        selectedCategories.includes(category)
                          ? 'bg-foreground/10 text-foreground border border-foreground/20'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      )}
                    >
                      {category}
                      <span className="text-xs opacity-60">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 text-muted-foreground">Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {subredditStats.map(({ subreddit, count }) => (
                    <button
                      key={subreddit}
                      onClick={() => toggleSubreddit(subreddit)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all',
                        selectedSubreddits.includes(subreddit)
                          ? 'bg-foreground/10 text-foreground border border-foreground/20'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                      )}
                    >
                      r/{subreddit}
                      <span className="text-xs opacity-60">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sort + Results count */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            {([
              { value: 'score' as const, label: 'Upvotes' },
              { value: 'confidence' as const, label: 'Reliability' },
              { value: 'date' as const, label: 'Date' },
            ]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setSortBy(value)}
                className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', sortBy === value ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-accent')}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{filteredPosts.length} results</p>
        </div>

        {/* Posts Grid/List */}
        <div className={cn(viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3')}>
          {visiblePosts.map((post) => {
            const isNew = isNewSinceLastVisit(lastVisit.current, post.CreatedAt, post.created_utc);
            const isRead = readPosts.has(post.reddit_id);
            const postFreshness = getPostFreshness(post.created_utc, post.created_a);

            if (viewMode === 'list') {
              return (
                <Link key={post.Id} href={`/posts/${post.reddit_id}`}>
                  <div className={cn(
                    'rounded-xl border cursor-pointer transition-all bg-card/40 hover:shadow-md p-4 flex items-center gap-4 relative overflow-hidden',
                    isNew && !isRead ? 'border-green-500/40' : 'border-border',
                    isRead && 'opacity-70'
                  )}>
                    {isNew && !isRead && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-green-500 rounded-l-xl" />}
                    <div className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{post.category}</div>
                    <h3 className="font-medium text-sm truncate flex-1">{post.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />{post.score}</span>
                      <span>r/{post.subreddit}</span>
                      <span>{postFreshness.label}</span>
                    </div>
                  </div>
                </Link>
              );
            }

            return (
              <Link key={post.Id} href={`/posts/${post.reddit_id}`}>
                <div className={cn(
                  'rounded-xl border cursor-pointer transition-all bg-card/40 hover:shadow-md hover:-translate-y-0.5 p-4 relative overflow-hidden',
                  isNew && !isRead ? 'border-green-500/40' : 'border-border',
                  isRead && 'opacity-70'
                )}>
                  {isNew && !isRead && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-green-500 rounded-l-xl" />}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{post.category}</span>
                      {isNew && !isRead && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-500/20 text-green-600 dark:text-green-400">NEW</span>}
                      <span className="text-[10px] text-muted-foreground">{postFreshness.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">r/{post.subreddit}</span>
                  </div>
                  <h3 className="font-medium text-sm mb-1.5 line-clamp-2" style={{ fontFamily: 'var(--font-serif), serif' }}>{post.title}</h3>
                  {post.summary && <p className="text-xs text-muted-foreground line-clamp-3 mb-2">{post.summary}</p>}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />{post.score}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.num_comments}</span>
                    </div>
                    {(() => {
                      const confidence = getConfidenceScore(post);
                      return <span className={cn('font-medium', confidence.color)}>{confidence.score}%</span>;
                    })()}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
              className="px-6 py-2.5 rounded-lg border text-sm transition-colors bg-card/40 border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
            >
              Show more ({filteredPosts.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

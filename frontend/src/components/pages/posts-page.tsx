'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, getPostLanguage, getDataFreshness, getPostFreshness, getConfidenceScore, filterByTimePeriod, type TimePeriod } from '@/lib/utils';
import { Post, CATEGORIES, CATEGORY_COLORS } from '@/types/post';
import { Search, X, MessageSquare, ArrowUp, Filter, LayoutGrid, List, Clock } from 'lucide-react';
import { PostDetail } from '@/components/dashboard/post-detail';

interface PostsPageProps {
  posts: Post[];
}

export function PostsPage({ posts }: PostsPageProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'fr' | 'en'>('fr');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all');
  const [sortBy, setSortBy] = useState<'score' | 'confidence' | 'date'>('score');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleCount, setVisibleCount] = useState(30);

  const POSTS_PER_PAGE = 30;

  // Data freshness
  const freshness = useMemo(() => getDataFreshness(posts), [posts]);

  // Category stats
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return CATEGORIES.map((cat) => ({ category: cat, count: counts[cat] || 0 }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  // Subreddit stats
  const subredditStats = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.subreddit) {
        counts[p.subreddit] = (counts[p.subreddit] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([subreddit, count]) => ({ subreddit, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  // Filtered posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(p.category || '');

      const matchesSubreddit =
        selectedSubreddits.length === 0 || selectedSubreddits.includes(p.subreddit || '');

      const matchesLanguage =
        selectedLanguage === 'all' || getPostLanguage(p.subreddit) === selectedLanguage;

      const matchesTime = filterByTimePeriod(p.created_utc, selectedTimePeriod, p.created_a);

      return matchesSearch && matchesCategory && matchesSubreddit && matchesLanguage && matchesTime;
    }).sort((a, b) => {
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

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
  }, [searchQuery, selectedCategories, selectedSubreddits, selectedLanguage, selectedTimePeriod]);

  // Progressive loading
  const visiblePosts = useMemo(
    () => filteredPosts.slice(0, visibleCount),
    [filteredPosts, visibleCount]
  );
  const hasMore = visibleCount < filteredPosts.length;

  // Navigation
  const currentIndex = selectedPost
    ? filteredPosts.findIndex((p) => p.Id === selectedPost.Id)
    : -1;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedPost(filteredPosts[currentIndex - 1]);
    }
  }, [currentIndex, filteredPosts]);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredPosts.length - 1) {
      setSelectedPost(filteredPosts[currentIndex + 1]);
    }
  }, [currentIndex, filteredPosts]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleSubreddit = (sub: string) => {
    setSelectedSubreddits((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubreddits([]);
    setSelectedLanguage('all');
    setSelectedTimePeriod('all');
    setSearchQuery('');
  };

  const hasFilters = selectedCategories.length > 0 || selectedSubreddits.length > 0 || selectedLanguage !== 'all' || selectedTimePeriod !== 'all' || searchQuery;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen bg-background pt-20 pb-12 px-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">

          <h1
            className={cn(
              'text-3xl font-bold mb-2 font-sans',
              'text-foreground'
            )}
          >
            Posts
          </h1>
          <p
            className={cn(
              'text-sm font-sans',
              'text-muted-foreground'
            )}
          >
            Parcourez les conseils financiers de Reddit
          </p>
          {/* Freshness indicator */}
          <div className={cn(
            'flex items-center gap-2 mt-2 text-xs',
            freshness.hoursAgo < 24 ? 'text-green-500' : 'text-muted-foreground'
          )}>
            <Clock className="w-3 h-3" />
            <span>{freshness.label}</span>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">

          <div className="relative flex-1">
            <Search
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                'text-muted-foreground'
              )}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border font-sans text-sm bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border font-sans text-sm bg-card border-border text-muted-foreground',
                showFilters && 'border-primary text-primary'
              )}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {hasFilters && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                  {selectedCategories.length + selectedSubreddits.length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </button>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans text-sm text-red-500 bg-red-50 dark:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2.5',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2.5',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {/* Language filter */}
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => setSelectedLanguage('all')}
                className={cn(
                  'px-3 py-2 text-xs font-medium',
                  selectedLanguage === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                Tous
              </button>
              <button
                onClick={() => setSelectedLanguage('fr')}
                className={cn(
                  'px-3 py-2 text-xs font-medium flex items-center gap-1',
                  selectedLanguage === 'fr'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                🇫🇷 FR
              </button>
              <button
                onClick={() => setSelectedLanguage('en')}
                className={cn(
                  'px-3 py-2 text-xs font-medium flex items-center gap-1',
                  selectedLanguage === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                🇬🇧 EN
              </button>
            </div>
            {/* Time period filter */}
            <div className="flex rounded-lg overflow-hidden border border-border">
              {([
                { value: 'all', label: 'Tout' },
                { value: 'week', label: '7j' },
                { value: 'month', label: '30j' },
                { value: 'quarter', label: '3m' },
                { value: 'old', label: 'Ancien' },
              ] as { value: TimePeriod; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedTimePeriod(value)}
                  className={cn(
                    'px-3 py-2 text-xs font-medium',
                    selectedTimePeriod === value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
              <div
                className="p-4 rounded-xl border bg-card border-border"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Categories */}
                  <div>
                    <h4
                      className={cn(
                        'text-xs font-semibold uppercase tracking-wide mb-3 font-sans',
                        'text-muted-foreground'
                      )}
                    >
                      Catégories
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {categoryStats.map(({ category, count }) => {
                        const isSelected = selectedCategories.includes(category);
                        return (
                          <button
                            key={category}
                            onClick={() => toggleCategory(category)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-sans transition-all',
                              isSelected
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-muted text-muted-foreground hover:bg-accent'
                            )}
                          >
                            <div
                              className="w-2 h-2 rounded-full bg-muted-foreground/50"
                            />
                            {category}
                            <span className="text-xs opacity-60">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subreddits */}
                  <div>
                    <h4
                      className={cn(
                        'text-xs font-semibold uppercase tracking-wide mb-3 font-sans',
                        'text-muted-foreground'
                      )}
                    >
                      Sources
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {subredditStats.map(({ subreddit, count }) => {
                        const isSelected = selectedSubreddits.includes(subreddit);
                        return (
                          <button
                            key={subreddit}
                            onClick={() => toggleSubreddit(subreddit)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-sans transition-all',
                              isSelected
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-muted text-muted-foreground hover:bg-accent'
                            )}
                          >
                            r/{subreddit}
                            <span className="text-xs opacity-60">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sort options */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Trier par :</span>
          {([
            { value: 'score', label: 'Upvotes' },
            { value: 'confidence', label: 'Fiabilité' },
            { value: 'date', label: 'Date' },
          ] as { value: typeof sortBy; label: string }[]).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setSortBy(value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                sortBy === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p
          className={cn(
            'text-sm font-sans mb-4',
            'text-muted-foreground'
          )}
        >
          {filteredPosts.length} résultats
        </p>

        {/* Posts Grid/List */}
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-3'
              : 'flex flex-col gap-2'
          )}
        >
          {visiblePosts.map((post) => (
            <div
              key={post.Id}
              onClick={() => setSelectedPost(post)}
              className={cn(
                'rounded-xl border cursor-pointer transition-all bg-card border-border hover:border-primary/30 hover:-translate-y-0.5',
                viewMode === 'grid' ? 'p-3' : 'p-3 flex items-center gap-4'
              )}
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Grid View */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="px-2 py-0.5 rounded text-xs font-sans bg-muted text-muted-foreground"
                      >
                        {post.category}
                      </div>
                      {(() => {
                        const freshness = getPostFreshness(post.created_utc, post.created_a);
                        return (
                          <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium font-sans', freshness.bgColor, freshness.color)}>
                            {freshness.label}
                          </span>
                        );
                      })()}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-sans',
                        'text-muted-foreground'
                      )}
                    >
                      r/{post.subreddit}
                    </span>
                  </div>

                  <h3
                    className={cn(
                      'font-medium text-sm mb-1.5 line-clamp-2 font-sans',
                      'text-foreground'
                    )}
                  >
                    {post.title}
                  </h3>

                  {post.summary && (
                    <p
                      className={cn(
                        'text-xs line-clamp-3 mb-2 font-sans',
                        'text-muted-foreground'
                      )}
                    >
                      {post.summary}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs font-sans">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex items-center gap-1',
                          'text-muted-foreground'
                        )}
                      >
                        <ArrowUp className="w-3 h-3" />
                        {post.score}
                      </span>
                      <span
                        className={cn(
                          'flex items-center gap-1',
                          'text-muted-foreground'
                        )}
                      >
                        <MessageSquare className="w-3 h-3" />
                        {post.num_comments}
                      </span>
                    </div>
                    {(() => {
                      const confidence = getConfidenceScore(post);
                      return (
                        <span className={cn('font-medium', confidence.color)}>
                          {confidence.score}%
                        </span>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <>
                  {/* List View */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="px-2 py-0.5 rounded text-xs font-sans bg-muted text-muted-foreground"
                    >
                      {post.category}
                    </div>
                    {(() => {
                      const freshness = getPostFreshness(post.created_utc, post.created_a);
                      return (
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium font-sans', freshness.bgColor, freshness.color)}>
                          {freshness.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        'font-medium text-sm truncate font-sans',
                        'text-foreground'
                      )}
                    >
                      {post.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-sans shrink-0">
                    <span
                      className={cn(
                        'flex items-center gap-1',
                        'text-muted-foreground'
                      )}
                    >
                      <ArrowUp className="w-3 h-3" />
                      {post.score}
                    </span>
                    {(() => {
                      const confidence = getConfidenceScore(post);
                      return (
                        <span className={cn('font-medium', confidence.color)}>
                          {confidence.score}%
                        </span>
                      );
                    })()}
                    <span
                      className={cn(
                        'text-muted-foreground'
                      )}
                    >
                      r/{post.subreddit}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
              className="px-6 py-2.5 rounded-lg border font-sans text-sm transition-colors bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            >
              Afficher plus ({filteredPosts.length - visibleCount} restants)
            </button>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      <PostDetail
        post={selectedPost}
        open={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex < filteredPosts.length - 1}
        currentIndex={currentIndex}
        totalCount={filteredPosts.length}
      />
    </motion.main>
  );
}

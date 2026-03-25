'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { cn, getPostLanguage, getDataFreshness, getPostFreshness, getConfidenceScore, filterByTimePeriod, type TimePeriod, formatDistanceToNow } from '@/lib/utils';
import { Post, CATEGORIES } from '@/types/post';
import { Search, X, MessageSquare, ArrowUp, SlidersHorizontal, Heart, Bookmark, ExternalLink } from 'lucide-react';
import { getLastVisit, updateLastVisit, isNewSinceLastVisit, getReadPosts } from '@/lib/last-visit';
import Link from 'next/link';

interface PostsPageProps {
  posts: Post[];
}

type Tab = 'new' | 'trending' | 'saved';

const CATEGORY_TAG_COLORS: Record<string, string> = {
  'ETF': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'Immobilier': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  'Crypto': 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'Epargne': 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  'Fiscalite': 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  'Actions': 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  'Strategie': 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  'Milestone': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  'Question': 'bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
  'Retour XP': 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  'Budget': 'bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-400',
  'Retraite': 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  'Credit': 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  'Carriere': 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
  'Actualite': 'bg-zinc-50 text-zinc-600 dark:bg-zinc-500/10 dark:text-zinc-400',
  'Autre': 'bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400',
};

export function PostsPage({ posts }: PostsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'fr' | 'en'>('fr');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all');
  const [sortBy, setSortBy] = useState<'score' | 'confidence' | 'date'>('score');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('new');
  const [visibleCount, setVisibleCount] = useState(20);
  const [readPosts, setReadPosts] = useState<Set<string>>(new Set());

  const POSTS_PER_PAGE = 20;

  const lastVisit = useRef<number | null>(null);

  useEffect(() => {
    const lv = getLastVisit();
    lastVisit.current = lv;
    setReadPosts(getReadPosts());
    const timer = setTimeout(() => updateLastVisit(), 3000);
    return () => clearTimeout(timer);
  }, []);

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
      if (activeTab === 'trending') return (b.score || 0) - (a.score || 0);
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
  }, [posts, searchQuery, selectedCategories, selectedSubreddits, selectedLanguage, selectedTimePeriod, sortBy, activeTab]);

  useEffect(() => { setVisibleCount(POSTS_PER_PAGE); }, [searchQuery, selectedCategories, selectedSubreddits, selectedLanguage, selectedTimePeriod, activeTab]);

  const visiblePosts = useMemo(() => filteredPosts.slice(0, visibleCount), [filteredPosts, visibleCount]);
  const hasMore = visibleCount < filteredPosts.length;

  const toggleCategory = (cat: string) => setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  const toggleSubreddit = (sub: string) => setSelectedSubreddits((prev) => prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]);
  const clearFilters = () => { setSelectedCategories([]); setSelectedSubreddits([]); setSelectedLanguage('all'); setSelectedTimePeriod('all'); setSearchQuery(''); };
  const hasFilters = selectedCategories.length > 0 || selectedSubreddits.length > 0 || selectedLanguage !== 'all' || selectedTimePeriod !== 'all' || searchQuery;

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Hero Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gradient mb-4" style={{ fontFamily: 'var(--font-serif), serif' }}>
            Reddit Finance Intelligence
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Parcourez les meilleurs conseils financiers extraits et analyses par IA
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex items-center gap-6">
            {([
              { key: 'new' as Tab, label: 'Nouveaux' },
              { key: 'trending' as Tab, label: 'Tendances' },
              { key: 'saved' as Tab, label: 'Sauvegardes' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'pb-3 text-sm font-medium transition-colors relative',
                  activeTab === key
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
                {activeTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Filters row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-background border-border placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {(['all', 'fr', 'en'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedLanguage(key)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                  selectedLanguage === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/20'
                )}
              >
                {key === 'all' ? 'Tous' : key.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors',
              showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-foreground/20'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
          </button>

          {hasFilters && (
            <button onClick={clearFilters} className="p-2.5 rounded-lg text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Trier :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            >
              <option value="score">Plus votes</option>
              <option value="date">Plus recents</option>
              <option value="confidence">Fiabilite</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-6 rounded-xl border bg-card border-border mb-6 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 text-primary">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {categoryStats.map(({ category, count }) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all',
                        selectedCategories.includes(category)
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-background text-muted-foreground border-border hover:border-foreground/20'
                      )}
                    >
                      {category}
                      <span className="text-xs opacity-60">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 text-primary">Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {subredditStats.map(({ subreddit, count }) => (
                    <button
                      key={subreddit}
                      onClick={() => toggleSubreddit(subreddit)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all',
                        selectedSubreddits.includes(subreddit)
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-background text-muted-foreground border-border hover:border-foreground/20'
                      )}
                    >
                      r/{subreddit}
                      <span className="text-xs opacity-60">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Tout effacer
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Afficher les resultats
              </button>
            </div>
          </div>
        )}

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">{filteredPosts.length} posts</p>

        {/* Posts List - Horizontal cards like ideabrowser */}
        <div className="space-y-4">
          {visiblePosts.map((post) => {
            const isNew = isNewSinceLastVisit(lastVisit.current, post.CreatedAt, post.created_utc);
            const isRead = readPosts.has(post.reddit_id);
            const postFreshness = getPostFreshness(post.created_utc, post.created_a);
            const tagColor = CATEGORY_TAG_COLORS[post.category] || 'bg-gray-50 text-gray-600';

            return (
              <div
                key={post.Id}
                className={cn(
                  'flex border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-all',
                  isNew && !isRead && 'ring-1 ring-primary/30'
                )}
              >
                {/* Content */}
                <Link href={`/posts/${post.reddit_id}`} className="flex-1 p-5 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {isNew && !isRead && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">NOUVEAU</span>
                    )}
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', tagColor)}>
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">r/{post.subreddit}</span>
                    <span className="text-xs text-muted-foreground">{postFreshness.label}</span>
                  </div>

                  <h3 className="text-lg font-bold leading-snug mb-2 text-foreground" style={{ fontFamily: 'var(--font-serif), serif' }}>
                    {post.title}
                  </h3>

                  {post.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                      {post.summary}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ArrowUp className="w-3.5 h-3.5" />{post.score}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{post.num_comments || 0}</span>
                    {post.consensus && (
                      <span className={cn(
                        'font-medium',
                        post.consensus.toLowerCase() === 'fort' && 'text-green-600 dark:text-green-400',
                        post.consensus.toLowerCase() === 'moyen' && 'text-yellow-600 dark:text-yellow-400',
                        post.consensus.toLowerCase() === 'faible' && 'text-orange-600 dark:text-orange-400',
                        (post.consensus.toLowerCase() === 'divise' || post.consensus.toLowerCase() === 'divisé') && 'text-red-600 dark:text-red-400',
                      )}>
                        Consensus {post.consensus}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Side actions - ideabrowser style */}
                <div className="flex flex-col items-center justify-center gap-3 px-4 border-l border-border bg-muted/30">
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors group" title="Interested">
                    <Heart className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted transition-colors group" title="Save">
                    <Bookmark className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors group"
                    title="View on Reddit"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Voir plus ({filteredPosts.length - visibleCount} restants)
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { cn, getDataFreshness, getPostFreshness, getPostLanguage, formatDistanceToNow } from '@/lib/utils';
import { Post, CONSENSUS_COLORS } from '@/types/post';
import { getETFInsights } from '@/lib/nocodb';
import { TrendingUp, ChevronRight, Sparkles, ArrowRight, Clock, ArrowUp, MessageSquare, ChevronLeft } from 'lucide-react';
import { ETFComparison } from '@/components/dashboard/etf-comparison';
import { getLastVisit, updateLastVisit, isNewSinceLastVisit, getReadPosts } from '@/lib/last-visit';
import Link from 'next/link';

interface DashboardPageProps {
  posts: Post[];
}

function getPostDate(post: Post): Date | null {
  if (post.created_utc) return new Date(post.created_utc * 1000);
  if (post.created_a) return new Date(post.created_a + 'Z');
  if (post.CreatedAt) return new Date(post.CreatedAt);
  return null;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  'ETF': 'from-emerald-600/80 to-teal-700/80',
  'Immobilier': 'from-amber-600/80 to-orange-700/80',
  'Crypto': 'from-purple-600/80 to-indigo-700/80',
  'Epargne': 'from-blue-600/80 to-cyan-700/80',
  'Fiscalite': 'from-rose-600/80 to-pink-700/80',
  'Actions': 'from-sky-600/80 to-blue-700/80',
  'Strategie': 'from-violet-600/80 to-purple-700/80',
  'Milestone': 'from-yellow-500/80 to-amber-600/80',
  'Question': 'from-slate-500/80 to-gray-600/80',
  'Retour XP': 'from-green-600/80 to-emerald-700/80',
  'Budget': 'from-lime-600/80 to-green-700/80',
  'Retraite': 'from-orange-500/80 to-red-600/80',
  'Credit': 'from-red-600/80 to-rose-700/80',
  'Carriere': 'from-teal-600/80 to-cyan-700/80',
  'Actualite': 'from-zinc-500/80 to-neutral-600/80',
  'Autre': 'from-gray-500/80 to-zinc-600/80',
};

const CATEGORY_ICONS: Record<string, string> = {
  'ETF': 'TrendingUp',
  'Immobilier': 'Home',
  'Crypto': 'Bitcoin',
  'Epargne': 'PiggyBank',
  'Fiscalite': 'Receipt',
  'Actions': 'BarChart3',
  'Strategie': 'Target',
  'Milestone': 'Trophy',
  'Question': 'HelpCircle',
  'Retour XP': 'MessageSquare',
  'Budget': 'Wallet',
  'Retraite': 'Clock',
  'Credit': 'CreditCard',
  'Carriere': 'Briefcase',
  'Actualite': 'Newspaper',
  'Autre': 'FileText',
};

function CategoryBanner({ category }: { category: string }) {
  const gradient = CATEGORY_GRADIENTS[category] || 'from-gray-500/80 to-zinc-600/80';
  return (
    <div className={cn('h-24 rounded-t-lg bg-gradient-to-br flex items-center justify-center relative overflow-hidden', gradient)}>
      <span className="text-white/20 text-6xl font-bold select-none" style={{ fontFamily: 'var(--font-serif), serif' }}>
        {category.charAt(0)}
      </span>
      <div className="absolute bottom-2 left-3">
        <span className="text-white/90 text-[10px] font-medium uppercase tracking-wider">{category}</span>
      </div>
    </div>
  );
}

function ConsensusLabel({ consensus }: { consensus: string | undefined }) {
  if (!consensus) return null;
  const lower = consensus.toLowerCase();
  const info = CONSENSUS_COLORS[lower];
  if (!info) return null;
  const colors: Record<string, string> = {
    'fort': 'text-green-500',
    'moyen': 'text-yellow-500',
    'faible': 'text-orange-500',
    'divisé': 'text-red-500',
    'divise': 'text-red-500',
  };
  return (
    <span className={cn('text-[10px] font-semibold uppercase tracking-wider', colors[lower] || 'text-muted-foreground')}>
      {info.label}
    </span>
  );
}

export function DashboardPage({ posts }: DashboardPageProps) {
  const [langFilter, setLangFilter] = useState<'all' | 'fr' | 'en'>('fr');
  const [topNewsIndex, setTopNewsIndex] = useState(0);

  const lastVisit = useRef<number | null>(null);
  const [lastVisitLabel, setLastVisitLabel] = useState<string>('');

  useEffect(() => {
    const lv = getLastVisit();
    lastVisit.current = lv;
    if (lv) setLastVisitLabel(formatDistanceToNow(new Date(lv)));
    const timer = setTimeout(() => updateLastVisit(), 3000);
    return () => clearTimeout(timer);
  }, []);

  const freshness = useMemo(() => getDataFreshness(posts), [posts]);

  const newPostCount = useMemo(() => {
    if (!lastVisit.current) return 0;
    return posts.filter(p => isNewSinceLastVisit(lastVisit.current, p.CreatedAt, p.created_utc)).length;
  }, [posts]);

  // Split posts: "Today/Recent" (last 7 days) vs "Archive" (older, analyzed)
  const { recentPosts, archivePosts } = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recent: Post[] = [];
    const archive: Post[] = [];

    const filtered = langFilter === 'all'
      ? posts
      : posts.filter(p => getPostLanguage(p.subreddit) === langFilter);

    filtered.forEach(p => {
      const date = getPostDate(p);
      if (date && date.getTime() > sevenDaysAgo) {
        recent.push(p);
      } else {
        archive.push(p);
      }
    });

    return {
      recentPosts: recent.sort((a, b) => (b.score || 0) - (a.score || 0)),
      archivePosts: archive.sort((a, b) => (b.score || 0) - (a.score || 0)),
    };
  }, [posts, langFilter]);

  // Top News: rotate through top posts in pairs
  const topNewsPairs = useMemo(() => {
    const topPosts = recentPosts.length >= 4
      ? recentPosts.filter(p => p.summary).slice(0, 8)
      : archivePosts.filter(p => p.summary).slice(0, 8);
    const pairs: Post[][] = [];
    for (let i = 0; i < topPosts.length; i += 2) {
      pairs.push(topPosts.slice(i, i + 2));
    }
    return pairs;
  }, [recentPosts, archivePosts]);

  // Auto-rotate top news every 8 seconds
  useEffect(() => {
    if (topNewsPairs.length <= 1) return;
    const interval = setInterval(() => {
      setTopNewsIndex(prev => (prev + 1) % topNewsPairs.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [topNewsPairs.length]);

  const currentTopNews = topNewsPairs[topNewsIndex] || [];

  // ETF posts for ranking
  const etfPosts = useMemo(() => {
    if (langFilter === 'all') return posts;
    return posts.filter(p => getPostLanguage(p.subreddit) === langFilter);
  }, [posts, langFilter]);

  const stats = useMemo(() => {
    const etfInsights = getETFInsights(posts);
    const postsWithETF = new Set<string>();
    etfInsights.forEach(etf => etf.posts.forEach(p => postsWithETF.add(p.reddit_id)));
    return { totalPosts: posts.length, etfMentions: postsWithETF.size };
  }, [posts]);

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Dummy handler for ETF comparison clicks
  const handlePostClick = () => {};

  return (
    <main className="min-h-screen bg-background pt-6 pb-16">
      <div className="px-6 py-8 max-w-[1400px] mx-auto w-full">

        {/* New posts banner */}
        {newPostCount > 0 && (
          <div className="mb-5 p-3 rounded-lg border border-border bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-medium">
                {newPostCount} nouveau{newPostCount > 1 ? 'x' : ''} post{newPostCount > 1 ? 's' : ''}
              </p>
              {lastVisitLabel && <span className="text-[11px] text-muted-foreground">({lastVisitLabel})</span>}
            </div>
            <Link href="/posts?sort=date" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Language filter + stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-md border border-border bg-card p-0.5">
              {([
                { key: 'all' as const, label: 'All' },
                { key: 'fr' as const, label: 'FR' },
                { key: 'en' as const, label: 'EN' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setLangFilter(key)}
                  className={cn(
                    'px-3 py-1 rounded text-xs font-medium transition-all',
                    langFilter === key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {freshness.label}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {stats.totalPosts} posts &middot; {stats.etfMentions} ETF mentions
          </span>
        </div>

        {/* ===== TOP NEWS ===== */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>
              Top News
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">{today}</span>
              {topNewsPairs.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTopNewsIndex(prev => prev === 0 ? topNewsPairs.length - 1 : prev - 1)}
                    className="p-1 rounded hover:bg-accent transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <span className="text-[10px] text-muted-foreground">{topNewsIndex + 1}/{topNewsPairs.length}</span>
                  <button
                    onClick={() => setTopNewsIndex(prev => (prev + 1) % topNewsPairs.length)}
                    className="p-1 rounded hover:bg-accent transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Featured 2 cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {currentTopNews.map((post) => {
              const postFreshness = getPostFreshness(post.created_utc, post.created_a);
              return (
                <Link key={post.reddit_id} href={`/posts/${post.reddit_id}`}>
                  <div className="bg-card border border-border rounded-lg overflow-hidden hover:border-foreground/20 transition-all cursor-pointer h-full flex flex-col">
                    <CategoryBanner category={post.category} />
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] text-muted-foreground">r/{post.subreddit}</span>
                        <span className="text-[10px] text-muted-foreground">{postFreshness.label}</span>
                      </div>
                      <h3 className="text-base font-bold leading-snug mb-2 flex-1" style={{ fontFamily: 'var(--font-serif), serif' }}>
                        {post.title}
                      </h3>
                      {post.summary && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{post.summary}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto">
                        <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />{post.score}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.num_comments || 0}</span>
                        <ConsensusLabel consensus={post.consensus} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ===== DAILY / RECENT POSTS ===== */}
        {recentPosts.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
                <Sparkles className="w-4 h-4 text-green-500" />
                Recent ({recentPosts.length})
              </h2>
              <Link href="/posts?sort=date" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentPosts.slice(0, 5).map((post) => {
                const postFreshness = getPostFreshness(post.created_utc, post.created_a);
                return (
                  <Link key={post.reddit_id} href={`/posts/${post.reddit_id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card hover:border-foreground/20 transition-all cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{post.category}</span>
                          <span className="text-[10px] text-muted-foreground">r/{post.subreddit}</span>
                          <ConsensusLabel consensus={post.consensus} />
                        </div>
                        <h3 className="text-sm font-medium truncate">{post.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
                        <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />{post.score}</span>
                        <span>{postFreshness.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== ETF RANKING ===== */}
        <section className="mb-10">
          <ETFComparison posts={etfPosts} onPostClick={handlePostClick} />
        </section>

        {/* ===== ARCHIVE / POPULAR ANALYZED POSTS ===== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>
              Archive &middot; Most Upvoted
            </h2>
            <Link href="/posts" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              Browse all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {archivePosts.slice(0, 6).map((post) => {
              const postFreshness = getPostFreshness(post.created_utc, post.created_a);
              return (
                <Link key={post.reddit_id} href={`/posts/${post.reddit_id}`}>
                  <div className="bg-card border border-border rounded-lg p-4 hover:border-foreground/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{post.category}</span>
                      <span className="text-[10px] text-muted-foreground">{postFreshness.label}</span>
                      <ConsensusLabel consensus={post.consensus} />
                    </div>
                    <h3 className="text-sm font-bold leading-snug mb-1.5 line-clamp-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
                      {post.title}
                    </h3>
                    {post.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.summary}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><ArrowUp className="w-3 h-3" />{post.score}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.num_comments || 0}</span>
                      <span className="ml-auto">r/{post.subreddit}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

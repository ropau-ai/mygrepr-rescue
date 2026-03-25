'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { cn, getDataFreshness, getPostFreshness, getPostLanguage, formatDistanceToNow } from '@/lib/utils';
import { Post, CONSENSUS_COLORS } from '@/types/post';
import { getETFInsights } from '@/lib/nocodb';
import { TrendingUp, ArrowRight, Clock, ArrowUp, MessageSquare, ChevronLeft, ChevronRight, Sparkles, BarChart3, Newspaper } from 'lucide-react';
import { ETFComparison } from '@/components/dashboard/etf-comparison';
import { getLastVisit, updateLastVisit, isNewSinceLastVisit } from '@/lib/last-visit';
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

const CATEGORY_TAG_COLORS: Record<string, string> = {
  'ETF': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'Immobilier': 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  'Crypto': 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'Epargne': 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  'Fiscalite': 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  'Actions': 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  'Strategie': 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
};

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

  useEffect(() => {
    if (topNewsPairs.length <= 1) return;
    const interval = setInterval(() => {
      setTopNewsIndex(prev => (prev + 1) % topNewsPairs.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [topNewsPairs.length]);

  const currentTopNews = topNewsPairs[topNewsIndex] || [];

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

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const handlePostClick = () => {};

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="max-w-[1200px] mx-auto px-6 py-10">

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gradient mb-4" style={{ fontFamily: 'var(--font-serif), serif' }}>
            Insight du Jour
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/posts" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Precedent
            </Link>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {today}
            </span>
            <button
              onClick={() => setTopNewsIndex(prev => (prev + 1) % Math.max(topNewsPairs.length, 1))}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New posts banner */}
        {newPostCount > 0 && (
          <div className="mb-8 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium">
                {newPostCount} nouveau{newPostCount > 1 ? 'x' : ''} post{newPostCount > 1 ? 's' : ''}
              </p>
              {lastVisitLabel && <span className="text-xs text-muted-foreground">({lastVisitLabel})</span>}
            </div>
            <Link href="/posts?sort=date" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              Voir <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Language filter + stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {(['all', 'fr', 'en'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setLangFilter(key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  langFilter === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/20'
                )}
              >
                {key === 'all' ? 'Tous' : key.toUpperCase()}
              </button>
            ))}
            <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
              <Clock className="w-3 h-3" /> {freshness.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {stats.totalPosts} posts &middot; {stats.etfMentions} ETF mentions
          </span>
        </div>

        {/* Top News Featured Cards */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
              <Newspaper className="w-5 h-5 text-primary" />
              Top News
            </h2>
            {topNewsPairs.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTopNewsIndex(prev => prev === 0 ? topNewsPairs.length - 1 : prev - 1)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <span className="text-xs text-muted-foreground">{topNewsIndex + 1}/{topNewsPairs.length}</span>
                <button
                  onClick={() => setTopNewsIndex(prev => (prev + 1) % topNewsPairs.length)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentTopNews.map((post) => {
              const postFreshness = getPostFreshness(post.created_utc, post.created_a);
              const tagColor = CATEGORY_TAG_COLORS[post.category] || 'bg-gray-50 text-gray-600';
              const consensus = post.consensus?.toLowerCase();
              const consensusInfo = consensus ? CONSENSUS_COLORS[consensus] : null;

              return (
                <Link key={post.reddit_id} href={`/posts/${post.reddit_id}`}>
                  <div className="bg-card border border-border rounded-xl p-6 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', tagColor)}>
                        {post.category}
                      </span>
                      <span className="text-xs text-muted-foreground">r/{post.subreddit}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{postFreshness.label}</span>
                    </div>
                    <h3 className="text-lg font-bold leading-snug mb-3 flex-1" style={{ fontFamily: 'var(--font-serif), serif' }}>
                      {post.title}
                    </h3>
                    {post.summary && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{post.summary}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                      <span className="flex items-center gap-1"><ArrowUp className="w-3.5 h-3.5" />{post.score}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{post.num_comments || 0}</span>
                      {consensusInfo && (
                        <span className={cn(
                          'ml-auto font-medium',
                          consensus === 'fort' && 'text-green-600',
                          consensus === 'moyen' && 'text-yellow-600',
                          consensus === 'faible' && 'text-orange-600',
                          (consensus === 'divise' || consensus === 'divisé') && 'text-red-600',
                        )}>
                          {consensusInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Posts */}
        {recentPosts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
                <TrendingUp className="w-5 h-5 text-primary" />
                Recents ({recentPosts.length})
              </h2>
              <Link href="/posts?sort=date" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
                Voir tout <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentPosts.slice(0, 5).map((post) => {
                const postFreshness = getPostFreshness(post.created_utc, post.created_a);
                const tagColor = CATEGORY_TAG_COLORS[post.category] || 'bg-gray-50 text-gray-600';
                return (
                  <Link key={post.reddit_id} href={`/posts/${post.reddit_id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer">
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0', tagColor)}>
                        {post.category}
                      </span>
                      <h3 className="text-sm font-medium truncate flex-1">{post.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
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

        {/* ETF Ranking */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>
              ETF Rankings
            </h2>
          </div>
          <ETFComparison posts={etfPosts} onPostClick={handlePostClick} />
        </section>

        {/* Archive */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif), serif' }}>
              Archive &middot; Plus votes
            </h2>
            <Link href="/posts" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              Parcourir <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {archivePosts.slice(0, 6).map((post) => {
              const postFreshness = getPostFreshness(post.created_utc, post.created_a);
              const tagColor = CATEGORY_TAG_COLORS[post.category] || 'bg-gray-50 text-gray-600';
              return (
                <Link key={post.reddit_id} href={`/posts/${post.reddit_id}`}>
                  <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', tagColor)}>
                        {post.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{postFreshness.label}</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug mb-2 line-clamp-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
                      {post.title}
                    </h3>
                    {post.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{post.summary}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
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

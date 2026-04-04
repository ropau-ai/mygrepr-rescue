'use client';

import { useState, useMemo, useEffect } from 'react';
import { getDataFreshness, getPostFreshness } from '@/lib/utils';
import { Post, CONSENSUS_COLORS } from '@/types/post';
import { getETFInsights } from '@/lib/etf-data';
import { ArrowUp, MessageSquare, ExternalLink, TrendingUp, Database, Radio } from 'lucide-react';
import { getLastVisit, updateLastVisit, isNewSinceLastVisit } from '@/lib/last-visit';
import Link from 'next/link';
import { getCategoryColor } from '@/lib/design-tokens';

interface DashboardPageProps {
  posts: Post[];
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
    </div>
  );
}

export function DashboardPage({ posts }: DashboardPageProps) {
  const [lastVisit] = useState(() => getLastVisit());

  useEffect(() => {
    const timer = setTimeout(() => updateLastVisit(), 3000);
    return () => clearTimeout(timer);
  }, []);

  const freshness = useMemo(() => getDataFreshness(posts), [posts]);

  const newPostCount = useMemo(() => {
    if (!lastVisit) return 0;
    return posts.filter(p => isNewSinceLastVisit(lastVisit, p.CreatedAt, p.created_utc)).length;
  }, [posts, lastVisit]);

  const etfInsights = useMemo(() => getETFInsights(posts), [posts]);
  const etfPostCount = useMemo(() => {
    const ids = new Set<string>();
    etfInsights.forEach(etf => etf.posts.forEach(p => ids.add(p.reddit_id)));
    return ids.size;
  }, [etfInsights]);

  const subredditCount = useMemo(() => {
    return new Set(posts.map(p => p.subreddit)).size;
  }, [posts]);

  const trending = useMemo(() => {
    return [...posts]
      .sort((a, b) => ((b.num_comments || 0) + (b.score || 0)) - ((a.num_comments || 0) + (a.score || 0)))
      .slice(0, 8);
  }, [posts]);

  const topCategories = useMemo(() => {
    const counts: Record<string, Post[]> = {};
    posts.forEach(p => {
      if (!p.category) return;
      if (!counts[p.category]) counts[p.category] = [];
      counts[p.category].push(p);
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 6)
      .map(([category, catPosts]) => ({
        category,
        posts: catPosts
          .sort((a, b) => ((b.num_comments || 0) + (b.score || 0)) - ((a.num_comments || 0) + (a.score || 0)))
          .slice(0, 3),
      }));
  }, [posts]);

  const topETFs = useMemo(() => etfInsights.slice(0, 4), [etfInsights]);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const featured = trending[0];
  const sidebarPosts = trending.slice(1, 6);

  return (
    <main className="min-h-screen bg-[#fcfcfc] dark:bg-[#0f0f14]">
      <div className="max-w-[1200px] mx-auto px-6 py-10">

        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              Grepr
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 capitalize">{today}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Posts</p>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100 tabular-nums">{posts.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">ETFs</p>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100 tabular-nums">{etfPostCount}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Subreddits</p>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100 tabular-nums">{subredditCount}</p>
            </div>
          </div>
        </div>

        {/* Daily Brief */}
        <section className="mb-12">
          <SectionDivider label="Briefing du jour" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Insights left (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {topETFs.length > 0 && (
                <div className="p-6 border border-slate-100 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a22]">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                      ETFs les plus discutes
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {topETFs.map(etf => (
                      <div key={etf.ticker} className="space-y-1">
                        <p className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100">{etf.ticker}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{etf.name}</p>
                        <p className="font-mono text-[11px] font-bold text-emerald-500">{etf.mentions} mention{etf.mentions > 1 ? 's' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 border border-slate-100 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a22]">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Donnees
                  </h3>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                  <span>{freshness.label}</span>
                  {newPostCount > 0 && (
                    <>
                      <span className="text-slate-300 dark:text-white/10">|</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                        +{newPostCount} nouveau{newPostCount > 1 ? 'x' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Alert card right (1 col) */}
            <div className="p-6 border border-slate-100 dark:border-white/10 rounded-xl bg-white dark:bg-[#1a1a22] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Categories actives
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topCategories.slice(0, 6).map(({ category, posts: catPosts }) => (
                    <span
                      key={category}
                      className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300"
                    >
                      {category} ({catPosts.length})
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href="/posts"
                className="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                Explorer tout <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* Category Columns */}
        <section className="mb-12">
          <SectionDivider label="Par categorie" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topCategories.map(({ category, posts: catPosts }) => {
              const tagColor = getCategoryColor(category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm ${tagColor}`}>
                      {category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {catPosts.length} post{catPosts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-1 divide-y divide-slate-100 dark:divide-white/10">
                    {catPosts.map(post => {
                      const pf = getPostFreshness(post.created_utc, post.created_a);
                      return (
                        <Link key={post.reddit_id} href={`/posts/${post.reddit_id}`} className="group block py-3 first:pt-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-relaxed group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">r/{post.subreddit}</span>
                            <span className="font-mono text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                              <ArrowUp className="w-3 h-3" />{post.score}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{pf.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trending Strip */}
        <section className="mb-12">
          <SectionDivider label="Tendances" />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Featured post */}
            {featured && (
              <div className="lg:col-span-3">
                <Link href={`/posts/${featured.reddit_id}`} className="group block">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-sm border bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300">
                      {featured.category}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">r/{featured.subreddit}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase">
                      {getPostFreshness(featured.created_utc, featured.created_a).label}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3">
                    {featured.title}
                  </h3>
                  {featured.summary && (
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl line-clamp-3">
                      {featured.summary}
                    </p>
                  )}
                  <div className="border-t border-slate-100 dark:border-white/10 pt-4 mt-4 flex items-center gap-4">
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" /> {featured.score}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {featured.num_comments || 0}
                    </span>
                    {(() => {
                      const c = featured.consensus?.toLowerCase();
                      const ci = c ? CONSENSUS_COLORS[c] : null;
                      if (!ci) return null;
                      return (
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${ci.bg}`} aria-hidden="true" />
                          {ci.label}
                        </span>
                      );
                    })()}
                    <span className="ml-auto text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                      Lire <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              </div>
            )}

            {/* Sidebar list */}
            <div className="lg:col-span-2 space-y-0">
              {sidebarPosts.map(post => {
                const pf = getPostFreshness(post.created_utc, post.created_a);
                return (
                  <Link key={post.reddit_id} href={`/posts/${post.reddit_id}`} className="group block border-b border-slate-100 dark:border-white/10 pb-6 mb-6 last:border-0 last:mb-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {post.category}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase">
                        {pf.label}
                      </span>
                    </div>
                    <p className="text-sm font-bold leading-relaxed text-slate-900 dark:text-slate-100 group-hover:underline line-clamp-2">
                      {post.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">r/{post.subreddit}</span>
                      <span className="font-mono text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                        <ArrowUp className="w-3 h-3" />{post.score}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <SectionDivider label="Raccourcis" />
          <div className="flex flex-wrap gap-4">
            <Link
              href="/posts"
              className="px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Explorer les posts
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}

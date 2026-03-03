'use client';

import { useMemo } from 'react';
import { cn, getPostLanguage } from '@/lib/utils';
import { Post } from '@/types/post';
import { Zap, TrendingUp, Lightbulb, Users } from 'lucide-react';

interface DailyDigestProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

interface DigestInsight {
  type: 'consensus' | 'trending' | 'advice';
  title: string;
  detail: string;
  posts: Post[];
  category?: string;
}

function getPostDate(post: Post): Date | null {
  if (post.created_utc) return new Date(post.created_utc * 1000);
  if (post.created_a) return new Date(post.created_a + 'Z');
  return null;
}

function computeInsights(digestPosts: Post[]): { insights: DigestInsight[]; topTags: string[] } {
  const insights: DigestInsight[] = [];

  // 1. Strong consensus posts (most reliable advice)
  const consensusPosts = digestPosts
    .filter(p => p.consensus && ['fort', 'moyen'].includes(p.consensus.toLowerCase()) && p.key_advice)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3);

  if (consensusPosts.length > 0) {
    insights.push({
      type: 'consensus',
      title: 'Consensus fort',
      detail: consensusPosts[0].key_advice || '',
      posts: consensusPosts,
      category: consensusPosts[0].category,
    });
  }

  // 2. Trending categories (most active this period)
  const categoryCounts: Record<string, { count: number; posts: Post[] }> = {};
  digestPosts.forEach(p => {
    if (p.category && p.category !== 'Autre') {
      if (!categoryCounts[p.category]) categoryCounts[p.category] = { count: 0, posts: [] };
      categoryCounts[p.category].count++;
      categoryCounts[p.category].posts.push(p);
    }
  });

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 2);

  if (topCategories.length > 0) {
    const [catName, catData] = topCategories[0];
    insights.push({
      type: 'trending',
      title: `${catName} en tendance`,
      detail: `${catData.count} posts cette période`,
      posts: catData.posts.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3),
      category: catName,
    });
  }

  // 3. Top advice (highest scored posts with key_advice)
  const topAdvice = digestPosts
    .filter(p => p.key_advice && p.score && p.score > 20)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3);

  if (topAdvice.length > 0 && topAdvice[0].key_advice !== consensusPosts[0]?.key_advice) {
    insights.push({
      type: 'advice',
      title: 'Conseil populaire',
      detail: topAdvice[0].key_advice || '',
      posts: topAdvice,
      category: topAdvice[0].category,
    });
  }

  // 4. Recurring themes (tags appearing multiple times)
  const tagCounts: Record<string, number> = {};
  digestPosts.forEach(p => {
    if (p.tags) {
      p.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  const topTags = Object.entries(tagCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return { insights, topTags };
}

export function DailyDigest({ posts, onPostClick }: DailyDigestProps) {
  const digest = useMemo(() => {
    // Filter posts from last 7 days
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recentPosts = posts.filter(p => {
      const date = getPostDate(p);
      return date && date.getTime() > sevenDaysAgo;
    });

    // If not enough recent posts, extend to 30 days
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const digestPosts = recentPosts.length >= 5
      ? recentPosts
      : posts.filter(p => {
          const date = getPostDate(p);
          return date && date.getTime() > thirtyDaysAgo;
        });

    if (digestPosts.length === 0) return null;

    // Split by language
    const frPosts = digestPosts.filter(p => getPostLanguage(p.subreddit) === 'fr');
    const enPosts = digestPosts.filter(p => getPostLanguage(p.subreddit) === 'en');

    const frDigest = frPosts.length > 0 ? computeInsights(frPosts) : null;
    const enDigest = enPosts.length > 0 ? computeInsights(enPosts) : null;

    const period = recentPosts.length >= 5 ? '7 derniers jours' : '30 derniers jours';

    return { frDigest, enDigest, period };
  }, [posts]);

  if (!digest || (!digest.frDigest && !digest.enDigest)) return null;

  const insightIcons = {
    consensus: <Users className="w-4 h-4" />,
    trending: <TrendingUp className="w-4 h-4" />,
    advice: <Lightbulb className="w-4 h-4" />,
  };

  const insightColors = {
    consensus: 'text-muted-foreground',
    trending: 'text-muted-foreground',
    advice: 'text-muted-foreground',
  };

  const renderSection = (
    label: string,
    data: { insights: DigestInsight[]; topTags: string[] } | null
  ) => {
    if (!data || data.insights.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {label}
          </span>
        </div>
        <div className="space-y-3">
          {data.insights.map((insight, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => insight.posts[0] && onPostClick(insight.posts[0])}
            >
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5', insightColors[insight.type])}>
                  {insightIcons[insight.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-medium uppercase tracking-wide', insightColors[insight.type])}>
                      {insight.title}
                    </span>
                    {insight.category && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                        {insight.category}
                      </span>
                    )}
                    {insight.posts.length > 1 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{insight.posts.length - 1} posts
                      </span>
                    )}
                  </div>
                  <p className="text-sm line-clamp-2">{insight.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {data.topTags.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Sujets :</span>
            {data.topTags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Zap className="w-5 h-5 text-muted-foreground" />
          Brief du jour
        </h3>
        <span className="text-xs text-muted-foreground">{digest.period}</span>
      </div>

      <div className="space-y-5">
        {renderSection('FR', digest.frDigest)}
        {renderSection('EN', digest.enDigest)}
      </div>
    </div>
  );
}

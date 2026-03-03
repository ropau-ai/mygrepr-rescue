'use client';

import { Post, CATEGORY_COLORS } from '@/types/post';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, MessageSquare, ExternalLink } from 'lucide-react';

interface TopTendancesProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
  compact?: boolean;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}m`;
    return `${Math.floor(diffDays / 365)}a`;
  } catch {
    return '';
  }
}

export function TopTendances({ posts, onPostClick, compact = false }: TopTendancesProps) {
  // Get top posts by score
  const topPosts = [...posts]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, compact ? 5 : 3);

  if (topPosts.length === 0) return null;

  // Compact mode - simple list
  if (compact) {
    return (
      <div className="space-y-2">
        {topPosts.map((post, index) => {
          const dateLabel = formatDate(post.created_a || post.CreatedAt);
          return (
            <button
              key={post.Id}
              onClick={() => onPostClick(post)}
              className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors group flex items-start gap-3"
            >
              <span className="text-lg font-bold text-muted-foreground/40 w-6 shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                  {post.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ArrowUp className="h-3 w-3" />
                    {post.score}
                  </span>
                  <span>•</span>
                  <span>r/{post.subreddit}</span>
                  {dateLabel && (
                    <>
                      <span>•</span>
                      <span>{dateLabel}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Full mode - cards (original)
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Posts populaires</h2>
        <span className="text-xs text-muted-foreground">(par score)</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topPosts.map((post, index) => {
          const dateLabel = formatDate(post.created_a || post.CreatedAt);
          return (
            <button
              key={post.Id}
              onClick={() => onPostClick(post)}
              className="text-left bg-card border border-border rounded-lg p-4 hover:bg-accent/30 hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl font-bold text-muted-foreground/50">
                  #{index + 1}
                </span>
                <Badge
                  className="bg-muted text-muted-foreground text-xs"
                >
                  {post.category}
                </Badge>
              </div>
              <h3 className="font-medium line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-4 w-4" />
                  {post.score}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {post.num_comments || 0}
                </span>
                {dateLabel && (
                  <span className="text-xs">{dateLabel}</span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">r/{post.subreddit}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

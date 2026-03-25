'use client';

import { Post, CONSENSUS_COLORS, parseExtractedData, formatAmount } from '@/types/post';
import { getTagsFromPost } from '@/lib/nocodb';
import { ArrowLeft, ExternalLink, ArrowUp, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import { cn, getPostFreshness } from '@/lib/utils';

interface PostArticleProps {
  post: Post;
  relatedPosts: Post[];
  allPosts: Post[];
}

export function PostArticle({ post, relatedPosts }: PostArticleProps) {
  const tags = getTagsFromPost(post);
  const consensus = post.consensus?.toLowerCase();
  const consensusInfo = consensus ? CONSENSUS_COLORS[consensus] : null;
  const extractedData = parseExtractedData(post);
  const freshness = getPostFreshness(post.created_utc, post.created_a);
  const hasFinancialData = post.patrimoine || post.revenus_annuels || post.age_auteur || post.montant_max;

  return (
    <main className="min-h-screen bg-background pt-6 pb-16">
      <div className="flex max-w-[1200px] mx-auto w-full">
        {/* Article Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto py-8 px-6">
            <Link
              href="/posts"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to posts
            </Link>

            {/* Header */}
            <header className="mb-8">
              <h1
                className="text-2xl md:text-3xl font-bold leading-tight mb-3 tracking-tight"
                style={{ fontFamily: 'var(--font-serif), serif' }}
              >
                {post.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                <span className="text-foreground font-medium">r/{post.subreddit}</span>
                <span>&middot;</span>
                {post.author && (
                  <>
                    <span>u/{post.author}</span>
                    <span>&middot;</span>
                  </>
                )}
                <span>{post.score} upvotes</span>
                <span>&middot;</span>
                <span>{post.num_comments || 0} comments</span>
                <span>&middot;</span>
                <span>{freshness.label}</span>
              </div>
            </header>

            {/* AI Summary */}
            {post.summary && (
              <div className="border-t border-border pt-8 mb-10">
                <h2 className="text-lg font-bold mb-4" style={{ fontFamily: 'var(--font-serif), serif' }}>
                  AI Summary
                </h2>
                <p className="text-sm leading-relaxed text-foreground/90" style={{ fontFamily: 'var(--font-body-serif), serif' }}>
                  {post.summary}
                </p>
              </div>
            )}

            {/* Key Advice */}
            {post.key_advice && (
              <div className="bg-card border border-border rounded-lg p-6 mb-10">
                <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-serif), serif' }}>
                  Key Takeaway
                </h3>
                <p className="text-sm leading-relaxed" style={{ fontFamily: 'var(--font-body-serif), serif' }}>
                  {post.key_advice}
                </p>
              </div>
            )}

            {/* Financial Data */}
            {hasFinancialData && (
              <div className="mb-10">
                <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-serif), serif' }}>
                  Financial Data
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {post.patrimoine && (
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Patrimoine</p>
                      <p className="text-lg font-bold">{formatAmount(post.patrimoine)}</p>
                    </div>
                  )}
                  {post.revenus_annuels && (
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Revenus Annuels</p>
                      <p className="text-lg font-bold">{formatAmount(post.revenus_annuels)}</p>
                    </div>
                  )}
                  {post.age_auteur && (
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Age</p>
                      <p className="text-lg font-bold">{post.age_auteur} ans</p>
                    </div>
                  )}
                  {post.montant_max && (
                    <div className="p-3 rounded-lg border border-border bg-card">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Montant Max</p>
                      <p className="text-lg font-bold">{formatAmount(post.montant_max)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Original Content */}
            {post.selftext && (
              <div className="mb-10">
                <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-serif), serif' }}>
                  Original Post
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80" style={{ fontFamily: 'var(--font-body-serif), serif' }}>
                  {post.selftext}
                </p>
              </div>
            )}

            {/* Top Comment */}
            {post.top_comment && (
              <div className="mb-10">
                <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'var(--font-serif), serif' }}>
                  Top Comment
                  {post.comment_score && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">({post.comment_score} upvotes)</span>
                  )}
                </h3>
                <blockquote className="text-sm leading-relaxed italic border-l-2 border-foreground/20 pl-4 text-foreground/80" style={{ fontFamily: 'var(--font-body-serif), serif' }}>
                  &ldquo;{post.top_comment}&rdquo;
                </blockquote>
              </div>
            )}

            {/* Reddit Link */}
            <div className="border-t border-border pt-6">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors"
              >
                View on Reddit <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 border-l border-border h-[calc(100vh-64px)] overflow-y-auto sticky top-16 p-6 space-y-8 hidden lg:block">
          {/* Stats */}
          <section>
            <h2 className="text-sm font-bold mb-4 border-b border-border pb-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
              Stats
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5"><ArrowUp className="w-3 h-3" /> Upvotes</span>
                <span className="font-bold">{post.score}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> Comments</span>
                <span className="font-bold">{post.num_comments || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> Posted</span>
                <span className="font-bold">{freshness.label}</span>
              </div>
              {consensusInfo && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Consensus</span>
                  <span className="font-bold">{consensusInfo.label}</span>
                </div>
              )}
            </div>
          </section>

          {/* Tags */}
          {tags.length > 0 && (
            <section>
              <h2 className="text-sm font-bold mb-4 border-b border-border pb-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{post.category}</span>
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{tag}</span>
                ))}
              </div>
            </section>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-sm font-bold mb-4 border-b border-border pb-2" style={{ fontFamily: 'var(--font-serif), serif' }}>
                Related
              </h2>
              <div className="space-y-4">
                {relatedPosts.map((related) => (
                  <Link key={related.reddit_id} href={`/posts/${related.reddit_id}`} className="block group">
                    <p className="text-xs leading-relaxed mb-0.5 group-hover:text-foreground transition-colors text-foreground/80">
                      {related.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      r/{related.subreddit} &middot; {related.score} upvotes
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { Post, CONSENSUS_COLORS, formatAmount } from '@/types/post';
import { getTagsFromPost } from '@/lib/nocodb';
import { getCategoryColor } from '@/lib/design-tokens';
import { ArrowLeft, ExternalLink, ArrowUp, MessageSquare, Clock, Share2, Check, Sparkles, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { cn, getPostFreshness } from '@/lib/utils';

interface PostArticleProps {
  post: Post;
  relatedPosts: Post[];
}

export function PostArticle({ post, relatedPosts }: PostArticleProps) {
  const [copied, setCopied] = useState(false);
  const tags = getTagsFromPost(post);
  const consensus = post.consensus?.toLowerCase();
  const consensusInfo = consensus ? CONSENSUS_COLORS[consensus] : null;
  const freshness = getPostFreshness(post.created_utc, post.created_a);
  const hasFinancialData = post.patrimoine || post.revenus_annuels || post.age_auteur || post.montant_max;
  const categoryColor = getCategoryColor(post.category);

  // Only allow reddit.com URLs to prevent open redirect
  const safeUrl = (() => {
    try {
      const parsed = new URL(post.url || '');
      return parsed.hostname.endsWith('reddit.com') ? post.url : null;
    } catch {
      return null;
    }
  })();

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — ignore
    }
  };

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
              Retour aux posts
            </Link>

            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', categoryColor)}>
                  {post.category}
                </span>
                {consensusInfo && (
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-medium cursor-help',
                      consensus === 'fort' && 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
                      consensus === 'moyen' && 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
                      consensus === 'faible' && 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
                      (consensus === 'divise' || consensus === 'divisé') && 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
                    )}
                    title={
                      consensus === 'fort' ? 'La communaute est largement d\'accord sur ce sujet'
                        : consensus === 'moyen' ? 'Opinions globalement alignees avec quelques nuances'
                        : consensus === 'faible' ? 'Peu de commentaires pour etablir un consensus'
                        : 'La communaute est divisee sur ce sujet'
                    }
                  >
                    Consensus {consensusInfo.label}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3 tracking-tight">
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
                <span>{post.score} votes</span>
                <span>&middot;</span>
                <span>{post.num_comments || 0} commentaires</span>
                <span>&middot;</span>
                <span>{freshness.label}</span>
              </div>
            </header>

            {/* AI Summary — styled card */}
            {post.summary && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-primary">Resume IA</h2>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {post.summary}
                </p>
              </div>
            )}

            {/* Key Advice */}
            {post.key_advice && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-6 mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">Conseil cle</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {post.key_advice}
                </p>
              </div>
            )}

            {/* Financial Data */}
            {hasFinancialData && (
              <div className="mb-8">
                <h3 className="text-base font-bold mb-3">Donnees financieres</h3>
                <div className="grid grid-cols-2 gap-3">
                  {post.patrimoine && (
                    <div className="p-4 rounded-xl border border-border bg-card">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Patrimoine</p>
                      <p className="text-xl font-bold">{formatAmount(post.patrimoine)}</p>
                    </div>
                  )}
                  {post.revenus_annuels && (
                    <div className="p-4 rounded-xl border border-border bg-card">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Revenus annuels</p>
                      <p className="text-xl font-bold">{formatAmount(post.revenus_annuels)}</p>
                    </div>
                  )}
                  {post.age_auteur && (
                    <div className="p-4 rounded-xl border border-border bg-card">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Age</p>
                      <p className="text-xl font-bold">{post.age_auteur} ans</p>
                    </div>
                  )}
                  {post.montant_max && (
                    <div className="p-4 rounded-xl border border-border bg-card">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Montant max</p>
                      <p className="text-xl font-bold">{formatAmount(post.montant_max)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Original Content */}
            {post.selftext && (
              <div className="mb-8">
                <h3 className="text-base font-bold mb-3">Contenu original</h3>
                <div className="rounded-xl border border-border bg-card p-6">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                    {post.selftext}
                  </p>
                </div>
              </div>
            )}

            {/* Top Comment */}
            {post.top_comment && (
              <div className="mb-8">
                <h3 className="text-base font-bold mb-3">
                  Meilleur commentaire
                  {post.comment_score && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">({post.comment_score} votes)</span>
                  )}
                </h3>
                <blockquote className="text-sm leading-relaxed italic border-l-2 border-primary/30 pl-4 py-2 text-foreground/80 bg-muted/30 rounded-r-lg pr-4">
                  &ldquo;{post.top_comment}&rdquo;
                </blockquote>
              </div>
            )}

            {/* Actions — Reddit link + Share */}
            <div className="border-t border-border pt-6 flex items-center gap-3">
              {safeUrl && (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  aria-label="Voir sur Reddit"
                >
                  Voir sur Reddit <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Partager le lien"
              >
                {copied ? <><Check className="w-3.5 h-3.5" /> Copie !</> : <><Share2 className="w-3.5 h-3.5" /> Partager</>}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 border-l border-border h-[calc(100vh-64px)] overflow-y-auto sticky top-16 p-6 space-y-8 hidden lg:block">
          {/* Stats */}
          <section>
            <h2 className="text-sm font-bold mb-4 border-b border-border pb-2">Statistiques</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5"><ArrowUp className="w-3 h-3" /> Votes</span>
                <span className="font-bold">{post.score}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> Commentaires</span>
                <span className="font-bold">{post.num_comments || 0}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3 h-3" /> Publie</span>
                <span className="font-bold">{freshness.label}</span>
              </div>
              {post.upvote_ratio && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ratio</span>
                  <span className="font-bold">{Math.round(post.upvote_ratio * 100)}%</span>
                </div>
              )}
            </div>
          </section>

          {/* Tags */}
          {(tags.length > 0 || post.category) && (
            <section>
              <h2 className="text-sm font-bold mb-4 border-b border-border pb-2">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-medium', categoryColor)}>{post.category}</span>
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground">{tag}</span>
                ))}
              </div>
            </section>
          )}

          {/* ETF Detected */}
          {post.etf_detected && post.etf_detected.length > 0 && (
            <section>
              <h2 className="text-sm font-bold mb-4 border-b border-border pb-2">ETFs mentionnes</h2>
              <div className="flex flex-wrap gap-1.5">
                {post.etf_detected.map((etf) => (
                  <Link key={etf} href={`/etf`} className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                    {etf}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <h2 className="text-sm font-bold mb-4 border-b border-border pb-2">Similaires</h2>
              <div className="space-y-4">
                {relatedPosts.map((related) => (
                  <Link key={related.reddit_id} href={`/posts/${related.reddit_id}`} className="block group">
                    <p className="text-xs leading-relaxed mb-0.5 group-hover:text-foreground transition-colors text-foreground/80">
                      {related.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      r/{related.subreddit} &middot; {related.score} votes
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

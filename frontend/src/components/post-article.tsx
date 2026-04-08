'use client';

import { useState } from 'react';
import { Post, CONSENSUS_COLORS, formatAmount } from '@/types/post';
import { getTagsFromPost } from '@/lib/nocodb';
import { getSourceColor } from '@/lib/design-tokens';
import { ArrowLeft, ExternalLink, ArrowUp, MessageSquare, Clock, Share2, Check, Sparkles, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { cn, getPostFreshness } from '@/lib/utils';
import { useLanguage } from '@/components/language-provider';

interface PostArticleProps {
  post: Post;
  relatedPosts: Post[];
}

function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <div className="h-px w-12 bg-indigo-600/40" />
    </div>
  );
}

export function PostArticle({ post, relatedPosts }: PostArticleProps) {
  const { locale, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const tags = getTagsFromPost(post);
  const consensus = post.consensus?.toLowerCase();
  const consensusInfo = consensus ? CONSENSUS_COLORS[consensus] : null;
  const freshness = getPostFreshness(post.created_utc, post.created_a, locale);
  const hasFinancialData = post.patrimoine || post.revenus_annuels || post.age_auteur || post.montant_max;

  // Only allow https://reddit.com or *.reddit.com to prevent open redirect
  const safeUrl = (() => {
    try {
      const parsed = new URL(post.url || '');
      if (parsed.protocol !== 'https:') return null;
      const host = parsed.hostname;
      return host === 'reddit.com' || host.endsWith('.reddit.com') ? post.url : null;
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

  const consensusTooltip = consensus === 'fort' ? t('article.consensus_fort')
    : consensus === 'moyen' ? t('article.consensus_moyen')
    : consensus === 'faible' ? t('article.consensus_faible')
    : t('article.consensus_divise');

  return (
    <main className="min-h-screen bg-[var(--editorial-bg)] font-sans text-stone-900 dark:text-stone-100 selection:bg-indigo-100">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link
          href="/posts"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-3 h-3" />
          {t('article.back')}
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Article column */}
          <article className="flex-1 max-w-3xl">
            {/* Header */}
            <header className="mb-10 pb-8 border-b border-[var(--warm-border)]">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center justify-center px-3 py-1 text-[10px] font-bold uppercase tracking-wide rounded-sm',
                    getSourceColor(post.subreddit)
                  )}
                >
                  r/{post.subreddit}
                </span>
                {post.category && (
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm leading-none tracking-wide uppercase">
                    {post.category}
                  </span>
                )}
                {consensusInfo && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm cursor-help',
                      consensus === 'fort' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
                      consensus === 'moyen' && 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
                      consensus === 'faible' && 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
                      (consensus === 'divise' || consensus === 'divisé') && 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
                    )}
                    title={consensusTooltip}
                  >
                    {t('article.consensus')} {consensusInfo.label}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-stone-900 dark:text-stone-100 mb-4">
                {post.title}
              </h1>

              <div className="flex items-center gap-2 text-[11px] font-medium text-stone-500 dark:text-stone-400 flex-wrap font-mono">
                {post.author && (
                  <>
                    <span className="text-stone-700 dark:text-stone-300">u/{post.author}</span>
                    <span>·</span>
                  </>
                )}
                <span className="tabular-nums">{post.score} {t('article.votes')}</span>
                <span>·</span>
                <span className="tabular-nums">{post.num_comments || 0} {t('article.comments')}</span>
                <span>·</span>
                <span>{freshness.label}</span>
              </div>
            </header>

            {/* AI Summary */}
            {post.summary && (
              <section className="mb-10">
                <Eyebrow label={t('article.ai_summary')} />
                <div className="bg-[var(--paper-bg)] border border-[var(--warm-border)] p-6 rounded-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                      {t('article.ai_summary')}
                    </h2>
                  </div>
                  <p className="text-base leading-relaxed text-stone-700 dark:text-stone-300">
                    {post.summary}
                  </p>
                </div>
              </section>
            )}

            {/* Key Advice */}
            {post.key_advice && (
              <section className="mb-10">
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-6 rounded-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                      {t('article.key_advice')}
                    </h3>
                  </div>
                  <p className="text-base leading-relaxed text-stone-700 dark:text-stone-300">
                    {post.key_advice}
                  </p>
                </div>
              </section>
            )}

            {/* Financial Data */}
            {hasFinancialData && (
              <section className="mb-10">
                <Eyebrow label={t('article.financial_data')} />
                <div className="grid grid-cols-2 gap-3">
                  {post.patrimoine && (
                    <div className="p-4 border border-[var(--warm-border)] bg-[var(--paper-bg)] rounded-sm">
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 font-bold">
                        {t('article.patrimoine')}
                      </p>
                      <p className="text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                        {formatAmount(post.patrimoine)}
                      </p>
                    </div>
                  )}
                  {post.revenus_annuels && (
                    <div className="p-4 border border-[var(--warm-border)] bg-[var(--paper-bg)] rounded-sm">
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 font-bold">
                        {t('article.annual_income')}
                      </p>
                      <p className="text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                        {formatAmount(post.revenus_annuels)}
                      </p>
                    </div>
                  )}
                  {post.age_auteur && (
                    <div className="p-4 border border-[var(--warm-border)] bg-[var(--paper-bg)] rounded-sm">
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 font-bold">
                        {t('article.age')}
                      </p>
                      <p className="text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                        {post.age_auteur} {t('article.years')}
                      </p>
                    </div>
                  )}
                  {post.montant_max && (
                    <div className="p-4 border border-[var(--warm-border)] bg-[var(--paper-bg)] rounded-sm">
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1 font-bold">
                        {t('article.max_amount')}
                      </p>
                      <p className="text-xl font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                        {formatAmount(post.montant_max)}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Original Content */}
            {post.selftext && (
              <section className="mb-10">
                <Eyebrow label={t('article.original_content')} />
                <div className="border border-[var(--warm-border)] bg-[var(--paper-bg)] p-6 rounded-sm">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-stone-700 dark:text-stone-300">
                    {post.selftext}
                  </p>
                </div>
              </section>
            )}

            {/* Top Comment */}
            {post.top_comment && (
              <section className="mb-10">
                <Eyebrow label={t('article.top_comment')} />
                <blockquote className="text-base leading-relaxed italic border-l-2 border-indigo-600/40 pl-5 py-2 text-stone-700 dark:text-stone-300">
                  &ldquo;{post.top_comment}&rdquo;
                  {post.comment_score && (
                    <footer className="mt-3 not-italic text-[11px] font-mono text-stone-400 dark:text-stone-500 tabular-nums">
                      {post.comment_score} {t('article.votes')}
                    </footer>
                  )}
                </blockquote>
              </section>
            )}

            {/* Actions */}
            <div className="border-t border-[var(--warm-border)] pt-6 flex items-center gap-3">
              {safeUrl && (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold uppercase tracking-[0.15em] hover:opacity-90 transition-opacity"
                  aria-label={t('article.view_reddit')}
                >
                  {t('article.view_reddit')} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-sm border border-[var(--warm-border)] text-xs font-bold uppercase tracking-[0.15em] text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-[var(--warm-hover)] transition-colors"
                aria-label={t('article.share')}
              >
                {copied ? <><Check className="w-3.5 h-3.5" /> {t('article.copied')}</> : <><Share2 className="w-3.5 h-3.5" /> {t('article.share')}</>}
              </button>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-72 lg:shrink-0 space-y-8">
            {/* Stats card */}
            <section className="bg-[var(--paper-bg)] border border-[var(--warm-border)] p-5 rounded-sm">
              <Eyebrow label={t('article.stats')} />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <ArrowUp className="w-3 h-3" /> {t('article.votes')}
                  </span>
                  <span className="font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">{post.score}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" /> {t('article.comments')}
                  </span>
                  <span className="font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">{post.num_comments || 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {t('article.published')}
                  </span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">{freshness.label}</span>
                </div>
                {post.upvote_ratio && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-500 dark:text-stone-400">{t('article.ratio')}</span>
                    <span className="font-bold font-mono tabular-nums text-stone-900 dark:text-stone-100">
                      {Math.round(post.upvote_ratio * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Tags */}
            {(tags.length > 0 || post.category) && (
              <section>
                <Eyebrow label={t('article.tags')} />
                <div className="flex flex-wrap gap-1.5">
                  {post.category && (
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm tracking-wide uppercase">
                      {post.category}
                    </span>
                  )}
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium text-stone-600 dark:text-stone-400 bg-[var(--warm-divider)] px-2 py-0.5 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* ETF Detected */}
            {post.etf_detected && post.etf_detected.length > 0 && (
              <section>
                <Eyebrow label={t('article.etfs_mentioned')} />
                <div className="flex flex-wrap gap-1.5">
                  {post.etf_detected.map((etf) => (
                    <Link
                      key={etf}
                      href={`/etf`}
                      className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold tracking-tight bg-[var(--ticker-pill)] text-stone-700 dark:text-stone-200 hover:bg-indigo-600 hover:text-white transition-all font-mono"
                    >
                      {etf}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section>
                <Eyebrow label={t('article.similar')} />
                <div className="divide-y divide-[var(--warm-divider)] border-t border-[var(--warm-divider)]">
                  {relatedPosts.map((related) => {
                    const rf = getPostFreshness(related.created_utc, related.created_a, locale);
                    return (
                      <Link
                        key={related.reddit_id}
                        href={`/posts/${related.reddit_id}`}
                        className="block group py-3"
                      >
                        <p className="text-xs font-bold leading-snug mb-1 text-stone-900 dark:text-stone-100 group-hover:text-indigo-900 dark:group-hover:text-indigo-300 transition-colors line-clamp-2">
                          {related.title}
                        </p>
                        <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500 tabular-nums">
                          r/{related.subreddit} · {related.score} · {rf.label}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

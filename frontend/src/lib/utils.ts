import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Locale, t } from '@/lib/i18n';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date, locale: Locale = 'fr'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return t('utils.just_now', locale);
  if (diffMins < 60) return t('utils.min_ago', locale, { n: diffMins });
  if (diffHours < 24) return t('utils.hours_ago', locale, { n: diffHours });
  if (diffDays < 7) return t('utils.days_ago', locale, { n: diffDays });
  if (diffWeeks < 4) return t('utils.weeks_ago', locale, { n: diffWeeks });
  return t('utils.months_ago', locale, { n: diffMonths });
}

// Post freshness levels
export type FreshnessLevel = 'fresh' | 'recent' | 'old';

export function getPostFreshness(createdUtc: number | undefined, createdA?: string, locale: Locale = 'fr'): {
  level: FreshnessLevel;
  label: string;
  color: string;
  bgColor: string;
} {
  // Resolve the date: prefer created_utc, fallback to created_a string
  let postDate: Date | null = null;
  if (createdUtc) {
    postDate = new Date(createdUtc * 1000);
  } else if (createdA) {
    postDate = new Date(createdA + 'Z'); // Treat as UTC
  }

  if (!postDate || isNaN(postDate.getTime())) {
    return { level: 'old', label: t('utils.all_periods', locale), color: 'text-muted-foreground', bgColor: 'bg-muted' };
  }

  const diffMs = Date.now() - postDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const label = formatDistanceToNow(postDate, locale);

  if (diffDays < 7) {
    return { level: 'fresh', label, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/20' };
  }
  if (diffDays < 90) {
    return { level: 'recent', label, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/20' };
  }
  return { level: 'old', label, color: 'text-muted-foreground', bgColor: 'bg-muted' };
}

// Time period filter
export type TimePeriod = 'all' | 'week' | 'month' | 'quarter' | 'old';

export function filterByTimePeriod(createdUtc: number | undefined, period: TimePeriod, createdA?: string): boolean {
  if (period === 'all') return true;

  let postDate: Date | null = null;
  if (createdUtc) {
    postDate = new Date(createdUtc * 1000);
  } else if (createdA) {
    postDate = new Date(createdA + 'Z');
  }

  if (!postDate || isNaN(postDate.getTime())) return period === 'old';

  const diffDays = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);

  switch (period) {
    case 'week': return diffDays <= 7;
    case 'month': return diffDays <= 30;
    case 'quarter': return diffDays <= 90;
    case 'old': return diffDays > 90;
    default: return true;
  }
}

// French subreddits (used for score normalization and language detection)
const FRENCH_SUBREDDITS = ['vosfinances', 'vossous'];

// Confidence score: combines upvotes, ratio, and engagement
// Normalized per community size (FR subreddits have fewer users)
export function getConfidenceScore(post: { score?: number; upvote_ratio?: number; num_comments?: number; subreddit?: string }, locale: Locale = 'fr'): {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low';
  label: string;
  color: string;
} {
  const rawScore = post.score || 0;
  const ratio = post.upvote_ratio || 0.5;
  const comments = post.num_comments || 0;

  // Normalize threshold by community size
  const isFR = FRENCH_SUBREDDITS.includes((post.subreddit || '').toLowerCase());
  const maxReference = isFR ? 300 : 1000;

  // Formula: score * ratio * engagement multiplier
  const engagementMultiplier = 1 + Math.log10(comments + 1);
  const raw = rawScore * ratio * engagementMultiplier;

  // Normalize to 0-100 relative to community
  const normalized = Math.min(100, Math.round((raw / maxReference) * 100));

  if (normalized >= 70) {
    return { score: normalized, level: 'high', label: t('utils.confidence_high', locale), color: 'text-green-500' };
  }
  if (normalized >= 35) {
    return { score: normalized, level: 'medium', label: t('utils.confidence_medium', locale), color: 'text-amber-500' };
  }
  return { score: normalized, level: 'low', label: t('utils.confidence_low', locale), color: 'text-muted-foreground' };
}

// Get post language based on subreddit
export function getPostLanguage(subreddit: string | undefined): 'fr' | 'en' {
  if (!subreddit) return 'en';
  return FRENCH_SUBREDDITS.includes(subreddit.toLowerCase()) ? 'fr' : 'en';
}

// ─── Quality score (0-100) ──────────────────────────────────────
// Composite "worth reading" score that uses Groq-extracted signals
// instead of raw upvote count alone. Used by dashboard hero + /posts sort.
//
// Composition (max 100):
//   40 — community-normalized social score (getConfidenceScore)
//   15 — consensus signal (Groq: fort/moyen/faible/divisé)
//   20 — content density (summary length + key_advice + extracted financial data)
//   25 — freshness with exponential decay (half-life ~7 days)
type QualityPost = {
  score?: number;
  upvote_ratio?: number;
  num_comments?: number;
  subreddit?: string;
  consensus?: string;
  summary?: string;
  key_advice?: string;
  patrimoine?: number;
  revenus_annuels?: number;
  montant_max?: number;
  created_utc?: number;
  created_a?: string;
};

export function getPostQualityScore(post: QualityPost): number {
  // 1. Social signal (40pts) — reuse community-normalized confidence
  const social = (getConfidenceScore(post).score / 100) * 40;

  // 2. Consensus signal (15pts) — fort=15, moyen=10, faible=5, divisé=2
  const consensusMap: Record<string, number> = {
    'fort': 15,
    'moyen': 10,
    'faible': 5,
    'divisé': 2,
    'divise': 2,
  };
  const consensus = consensusMap[(post.consensus || '').toLowerCase()] || 0;

  // 3. Density (20pts) — does the post have substance?
  let density = 0;
  if ((post.summary?.length || 0) > 40) density += 8;
  if ((post.key_advice?.length || 0) > 20) density += 7;
  if (post.patrimoine || post.revenus_annuels || post.montant_max) density += 5;

  // 4. Freshness (25pts) — exponential decay, half-life 7 days
  let postDate: Date | null = null;
  if (post.created_utc) {
    postDate = new Date(post.created_utc * 1000);
  } else if (post.created_a) {
    postDate = new Date(post.created_a + 'Z');
  }
  let freshness = 0;
  if (postDate && !isNaN(postDate.getTime())) {
    const ageDays = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
    freshness = 25 * Math.exp(-ageDays / 7);
  }

  return Math.round(social + consensus + density + freshness);
}

// Get data freshness info
export function getDataFreshness(posts: { created_utc?: number }[], locale: Locale = 'fr'): {
  mostRecentDate: Date | null;
  hoursAgo: number;
  label: string;
} {
  if (!posts.length) {
    return { mostRecentDate: null, hoursAgo: Infinity, label: t('utils.no_data', locale) };
  }

  const validPosts = posts.filter(p => p.created_utc);
  if (!validPosts.length) {
    return { mostRecentDate: null, hoursAgo: Infinity, label: t('utils.all_periods', locale) };
  }

  const mostRecent = Math.max(...validPosts.map(p => p.created_utc!));
  const mostRecentDate = new Date(mostRecent * 1000);
  const hoursAgo = (Date.now() / 1000 - mostRecent) / 3600;

  let label: string;
  if (hoursAgo < 1) {
    label = t('utils.updated_less_1h', locale);
  } else if (hoursAgo < 24) {
    label = t('utils.updated_hours', locale, { n: Math.round(hoursAgo) });
  } else {
    const daysAgo = Math.round(hoursAgo / 24);
    label = t('utils.updated_days', locale, { n: daysAgo });
  }

  return { mostRecentDate, hoursAgo, label };
}

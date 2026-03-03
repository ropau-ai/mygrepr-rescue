import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'à l\'instant';
  if (diffMins < 60) return `il y a ${diffMins}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  if (diffWeeks < 4) return `il y a ${diffWeeks}sem`;
  return `il y a ${diffMonths}mois`;
}

// Check if a post is new (< 24h old)
export function isPostNew(createdUtc: number | undefined): boolean {
  if (!createdUtc) return false;
  const now = Date.now() / 1000; // Convert to seconds
  const diffHours = (now - createdUtc) / 3600;
  return diffHours < 24;
}

// Post freshness levels
export type FreshnessLevel = 'fresh' | 'recent' | 'old';

export function getPostFreshness(createdUtc: number | undefined, createdA?: string): {
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
    return { level: 'old', label: 'Date inconnue', color: 'text-muted-foreground', bgColor: 'bg-muted' };
  }

  const diffMs = Date.now() - postDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const label = formatDistanceToNow(postDate);

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
export function getConfidenceScore(post: { score?: number; upvote_ratio?: number; num_comments?: number; subreddit?: string }): {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low';
  label: string;
  color: string;
} {
  const rawScore = post.score || 0;
  const ratio = post.upvote_ratio || 0.5;
  const comments = post.num_comments || 0;

  // Normalize threshold by community size
  // FR subreddits (vosfinances ~230k members): ~200 upvotes = excellent
  // EN subreddits (personalfinance ~18M members): ~1000 upvotes = excellent
  const isFR = FRENCH_SUBREDDITS.includes((post.subreddit || '').toLowerCase());
  const maxReference = isFR ? 300 : 1000;

  // Formula: score * ratio * engagement multiplier
  const engagementMultiplier = 1 + Math.log10(comments + 1);
  const raw = rawScore * ratio * engagementMultiplier;

  // Normalize to 0-100 relative to community
  const normalized = Math.min(100, Math.round((raw / maxReference) * 100));

  if (normalized >= 70) {
    return { score: normalized, level: 'high', label: 'Fiable', color: 'text-green-500' };
  }
  if (normalized >= 35) {
    return { score: normalized, level: 'medium', label: 'Modéré', color: 'text-amber-500' };
  }
  return { score: normalized, level: 'low', label: 'Faible', color: 'text-muted-foreground' };
}

// (FRENCH_SUBREDDITS declared above)

// Get post language based on subreddit
export function getPostLanguage(subreddit: string | undefined): 'fr' | 'en' {
  if (!subreddit) return 'en';
  return FRENCH_SUBREDDITS.includes(subreddit.toLowerCase()) ? 'fr' : 'en';
}

// Get data freshness info
export function getDataFreshness(posts: { created_utc?: number }[]): {
  mostRecentDate: Date | null;
  hoursAgo: number;
  label: string;
} {
  if (!posts.length) {
    return { mostRecentDate: null, hoursAgo: Infinity, label: 'Aucune donnée' };
  }

  const validPosts = posts.filter(p => p.created_utc);
  if (!validPosts.length) {
    return { mostRecentDate: null, hoursAgo: Infinity, label: 'Date inconnue' };
  }

  const mostRecent = Math.max(...validPosts.map(p => p.created_utc!));
  const mostRecentDate = new Date(mostRecent * 1000);
  const hoursAgo = (Date.now() / 1000 - mostRecent) / 3600;

  let label: string;
  if (hoursAgo < 1) {
    label = 'Mis à jour il y a moins d\'1h';
  } else if (hoursAgo < 24) {
    label = `Mis à jour il y a ${Math.round(hoursAgo)}h`;
  } else {
    const daysAgo = Math.round(hoursAgo / 24);
    label = `Mis à jour il y a ${daysAgo}j`;
  }

  return { mostRecentDate, hoursAgo, label };
}

'use client';

const LAST_VISIT_KEY = 'grepr-last-visit';
const READ_POSTS_KEY = 'grepr-read-posts';

/**
 * Get the timestamp of the user's last visit.
 * Returns null if never visited before.
 */
export function getLastVisit(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Update the last visit timestamp to now.
 * Call this after the page has rendered and the user has had a chance to see the "new" indicators.
 */
export function updateLastVisit(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
  } catch {
    // ignore
  }
}

/**
 * Check if a post is new since the user's last visit.
 * Uses CreatedAt (NocoDB ingest time) first, falls back to created_utc.
 */
export function isNewSinceLastVisit(
  lastVisit: number | null,
  createdAt?: string,
  createdUtc?: number
): boolean {
  if (!lastVisit) return false; // First visit — don't mark everything as new

  let postIngestTime: number | null = null;

  if (createdAt) {
    const parsed = new Date(createdAt).getTime();
    if (!isNaN(parsed)) postIngestTime = parsed;
  }

  if (!postIngestTime && createdUtc) {
    postIngestTime = createdUtc * 1000;
  }

  if (!postIngestTime) return false;

  return postIngestTime > lastVisit;
}

/**
 * Get the set of post IDs the user has already read (clicked on).
 */
export function getReadPosts(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(READ_POSTS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // ignore
  }
  return new Set();
}

/**
 * Mark a post as read.
 */
export function markPostAsRead(redditId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const readPosts = getReadPosts();
    readPosts.add(redditId);
    // Keep only the last 500 to avoid localStorage bloat
    const arr = Array.from(readPosts);
    if (arr.length > 500) arr.splice(0, arr.length - 500);
    localStorage.setItem(READ_POSTS_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

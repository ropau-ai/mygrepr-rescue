'use client';

const LAST_VISIT_KEY = 'grepr-last-visit';

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


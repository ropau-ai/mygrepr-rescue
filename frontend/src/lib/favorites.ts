'use client';

const FAVORITES_KEY = 'grepr-favorites';

export interface Favorites {
  posts: string[]; // reddit_id list
  etfs: string[];  // ticker list
}

const defaultFavorites: Favorites = {
  posts: [],
  etfs: [],
};

export function getFavorites(): Favorites {
  if (typeof window === 'undefined') return defaultFavorites;

  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      return { ...defaultFavorites, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load favorites:', e);
  }
  return defaultFavorites;
}

export function saveFavorites(favorites: Favorites): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites:', e);
  }
}

export function togglePostFavorite(redditId: string): boolean {
  const favorites = getFavorites();
  const index = favorites.posts.indexOf(redditId);

  if (index === -1) {
    favorites.posts.push(redditId);
  } else {
    favorites.posts.splice(index, 1);
  }

  saveFavorites(favorites);
  return index === -1; // returns true if added, false if removed
}

export function toggleETFFavorite(ticker: string): boolean {
  const favorites = getFavorites();
  const index = favorites.etfs.indexOf(ticker);

  if (index === -1) {
    favorites.etfs.push(ticker);
  } else {
    favorites.etfs.splice(index, 1);
  }

  saveFavorites(favorites);
  return index === -1;
}

export function isPostFavorite(redditId: string): boolean {
  return getFavorites().posts.includes(redditId);
}

export function isETFFavorite(ticker: string): boolean {
  return getFavorites().etfs.includes(ticker);
}

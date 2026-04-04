import { Post } from '@/types/post';

// Server-side only: these MUST NOT have the NEXT_PUBLIC_ prefix to prevent client-side exposure
const MAX_PAGINATION_ITERATIONS = 20;

function getEnvConfig() {
  const baseUrl = process.env.NOCODB_URL;
  const token = process.env.NOCODB_TOKEN;
  const tableId = process.env.NOCODB_TABLE_ID;

  if (!baseUrl || !token || !tableId) {
    throw new Error('Missing required NOCODB environment variables. Ensure NOCODB_URL, NOCODB_TOKEN, NOCODB_TABLE_ID are set.');
  }

  return { baseUrl, token, tableId };
}

export async function fetchPosts(): Promise<Post[]> {
  const { baseUrl, token, tableId } = getEnvConfig();
  const url = `${baseUrl}/api/v2/tables/${tableId}/records`;
  const allPosts: Post[] = [];
  let offset = 0;
  const limit = 1000;
  let iterations = 0;

  try {
    while (iterations < MAX_PAGINATION_ITERATIONS) {
      iterations++;
      const response = await fetch(`${url}?limit=${limit}&offset=${offset}`, {
        headers: {
          'xc-token': token,
        },
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        throw new Error(`NocoDB fetch failed: ${response.status}`);
      }

      const data = await response.json();
      const records = data.list || [];

      if (records.length === 0) break;

      const validRecords = records.filter((post: Post) =>
        post.title && post.reddit_id
      );

      allPosts.push(...validRecords);

      if (records.length < limit) break;
      offset += limit;
    }
  } catch (error) {
    console.error('Database fetch error:', error);
    throw error;
  }

  return allPosts;
}

export function getTagsFromPost(post: Post): string[] {
  if (!post.tags) return [];
  return post.tags.split(',').map(tag => tag.trim()).filter(Boolean);
}

// Re-export ETF types and utilities from client-safe module
export { ETF_DATABASE, getETFInsights } from './etf-data';
export type { ETFInfo, ETFInsight } from './etf-data';


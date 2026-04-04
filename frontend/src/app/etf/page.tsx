import { fetchPosts } from '@/lib/nocodb';
import { ETFPage } from '@/components/pages/etf-page';
import type { Metadata } from 'next';
import type { Post } from '@/types/post';

export const metadata: Metadata = {
  title: 'Classement ETF — Grepr',
  description: 'Classement des ETF les plus mentionnés par la communauté Reddit francophone. PEA, CTO, performances et sentiment.',
};

export const revalidate = 300;

export default async function Page() {
  let posts: Post[] = [];
  try {
    posts = await fetchPosts();
  } catch {
    // NocoDB down — render with empty data
  }
  return <ETFPage posts={posts} />;
}

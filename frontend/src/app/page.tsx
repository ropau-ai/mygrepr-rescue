import type { Metadata } from 'next';
import { fetchPosts } from '@/lib/nocodb';
import { Post } from '@/types/post';
import { DashboardPage } from '@/components/pages/dashboard-page';

export const metadata: Metadata = {
  title: 'Tableau de bord | Grepr',
  description: 'Tableau de bord finance Reddit — posts recents, ETFs populaires, consensus communautaire.',
  alternates: { canonical: 'https://grepr.jelilahounou.com' },
};

export const dynamic = 'force-dynamic';

export default async function Home() {
  let posts: Post[];
  try {
    posts = await fetchPosts();
  } catch {
    posts = [];
  }

  return <DashboardPage posts={posts} />;
}

import type { Metadata } from 'next';
import { fetchPosts } from '@/lib/nocodb';
import { DashboardPage } from '@/components/pages/dashboard-page';

export const metadata: Metadata = {
  title: 'Tableau de bord | Grepr',
  description: 'Tableau de bord finance Reddit — posts recents, ETFs populaires, consensus communautaire.',
  alternates: { canonical: 'https://grepr.jelilahounou.com' },
};

export const revalidate = 300;

export default async function Home() {
  const posts = await fetchPosts();

  return <DashboardPage posts={posts} />;
}

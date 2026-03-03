import { fetchPosts } from '@/lib/nocodb';
import { DashboardPage } from '@/components/pages/dashboard-page';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const posts = await fetchPosts();

  return <DashboardPage posts={posts} />;
}

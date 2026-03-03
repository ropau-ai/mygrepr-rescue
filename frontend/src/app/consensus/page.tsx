import { fetchPosts } from '@/lib/nocodb';
import { ConsensusBoard } from './components/consensus-board';

export const dynamic = 'force-dynamic';

export default async function Consensus() {
  const posts = await fetchPosts();

  return <ConsensusBoard posts={posts} />;
}

import type { Metadata } from 'next';
import { fetchPosts } from '@/lib/nocodb';
import { Post } from '@/types/post';
import { ConsensusBoard } from './components/consensus-board';

export const metadata: Metadata = {
  title: "Consensus Board — Ou Reddit est d'accord",
  description: "Visualisez le consensus des communautes Reddit finance par categorie. Decouvrez ou la communaute est d'accord et ou elle diverge.",
};

export const dynamic = 'force-dynamic';

export default async function Consensus() {
  let posts: Post[] = [];
  try {
    posts = await fetchPosts();
  } catch { /* graceful degradation */ }

  return <ConsensusBoard posts={posts} />;
}

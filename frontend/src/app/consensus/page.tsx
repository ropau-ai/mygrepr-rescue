import type { Metadata } from 'next';
import { fetchPosts } from '@/lib/nocodb';
import { ConsensusBoard } from './components/consensus-board';

export const metadata: Metadata = {
  title: "Consensus Board — Ou Reddit est d'accord",
  description: "Visualisez le consensus des communautes Reddit finance par categorie. Decouvrez ou la communaute est d'accord et ou elle diverge.",
};

export const revalidate = 300;

export default async function Consensus() {
  const posts = await fetchPosts();

  return <ConsensusBoard posts={posts} />;
}

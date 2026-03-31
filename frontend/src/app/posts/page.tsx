import type { Metadata } from 'next';
import { fetchPosts } from '@/lib/nocodb';
import { PostsPage } from '@/components/pages/posts-page';

export const metadata: Metadata = {
  title: "Explorer les analyses Reddit finance",
  description: "Parcourez les meilleurs conseils financiers extraits et analyses par IA depuis les communautes Reddit francophones et anglophones.",
};

export const revalidate = 300;

export default async function Posts() {
  const posts = await fetchPosts();

  return <PostsPage posts={posts} />;
}

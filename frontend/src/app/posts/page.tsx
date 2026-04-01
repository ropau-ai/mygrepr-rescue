import type { Metadata } from 'next';
import { fetchPosts } from '@/lib/nocodb';
import { Post } from '@/types/post';
import { PostsPage } from '@/components/pages/posts-page';

export const metadata: Metadata = {
  title: "Explorer les analyses Reddit finance",
  description: "Parcourez les meilleurs conseils financiers extraits et analyses par IA depuis les communautes Reddit francophones et anglophones.",
};

export const dynamic = 'force-dynamic';

export default async function Posts() {
  let posts: Post[];
  try {
    posts = await fetchPosts();
  } catch {
    posts = [];
  }

  return <PostsPage posts={posts} />;
}

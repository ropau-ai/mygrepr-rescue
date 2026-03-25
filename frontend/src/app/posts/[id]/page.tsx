import { fetchPosts } from '@/lib/nocodb';
import { PostArticle } from '@/components/post-article';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const posts = await fetchPosts();
  const post = posts.find(p => p.reddit_id === id);

  if (!post) {
    notFound();
  }

  // Find related posts (same category, excluding current)
  const relatedPosts = posts
    .filter(p => p.category === post.category && p.reddit_id !== post.reddit_id)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  return <PostArticle post={post} relatedPosts={relatedPosts} allPosts={posts} />;
}

import type { Metadata } from 'next';
import { cache } from 'react';
import { fetchPosts } from '@/lib/nocodb';
import { PostArticle } from '@/components/post-article';
import { notFound } from 'next/navigation';

export const revalidate = 300;

// Deduplicate fetchPosts across generateMetadata + page component
const getCachedPosts = cache(() => fetchPosts());

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const posts = await getCachedPosts();
  const post = posts.find(p => p.reddit_id === id);

  if (!post) {
    return { title: "Post introuvable" };
  }

  const postUrl = `https://grepr.jelilahounou.com/posts/${id}`;
  return {
    title: post.title,
    description: post.summary || `Analyse du post r/${post.subreddit} — ${post.category}`,
    alternates: { canonical: postUrl },
    openGraph: {
      title: post.title,
      description: post.summary || `Analyse du post r/${post.subreddit} — ${post.category}`,
      url: postUrl,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description: post.summary || `Analyse du post r/${post.subreddit} — ${post.category}`,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const posts = await getCachedPosts();
  const post = posts.find(p => p.reddit_id === id);

  if (!post) {
    notFound();
  }

  const relatedPosts = posts
    .filter(p => p.category === post.category && p.reddit_id !== post.reddit_id)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.summary || `Analyse r/${post.subreddit}`,
    author: { "@type": "Person", name: post.author || "anonyme" },
    publisher: { "@type": "Organization", name: "Grepr" },
    datePublished: post.created_utc
      ? new Date(post.created_utc * 1000).toISOString()
      : post.created_a || undefined,
    mainEntityOfPage: `https://grepr.jelilahounou.com/posts/${post.reddit_id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostArticle post={post} relatedPosts={relatedPosts} />
    </>
  );
}

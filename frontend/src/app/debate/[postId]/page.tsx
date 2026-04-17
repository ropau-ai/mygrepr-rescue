import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchPostByRedditId } from '@/lib/nocodb';
import { DebateView } from '@/components/debate/debate-view';

export const dynamic = 'force-dynamic';

interface DebatePageProps {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: DebatePageProps): Promise<Metadata> {
  const { postId } = await params;
  let post;
  try {
    post = await fetchPostByRedditId(postId);
  } catch {
    post = null;
  }

  if (!post) {
    return { title: 'Débat introuvable · Grepr × Ropau' };
  }

  const url = `https://grepr.jelilahounou.com/debate/${postId}`;
  const title = `Débat IA — ${post.title}`;
  const description = `Le Sceptique vs Le Riskeur — deux personas Ropau débattent en streaming sur ce post r/${post.subreddit}. Verdict structuré : 3 points d'accord, 2 points de friction irréductibles.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'Grepr × Ropau',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function DebatePage({ params }: DebatePageProps) {
  const { postId } = await params;
  let post;
  try {
    post = await fetchPostByRedditId(postId);
  } catch {
    post = null;
  }

  if (!post) {
    notFound();
  }

  return <DebateView post={post} />;
}

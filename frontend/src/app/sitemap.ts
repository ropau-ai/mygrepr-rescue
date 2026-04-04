import type { MetadataRoute } from 'next';
import { fetchPosts } from '@/lib/nocodb';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://grepr.jelilahounou.com';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/etf`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic post pages
  try {
    const posts = await fetchPosts();
    const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/posts/${post.reddit_id}`,
      lastModified: post.created_utc
        ? new Date(post.created_utc * 1000)
        : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
    return [...staticPages, ...postPages];
  } catch {
    // If NocoDB is down, return static pages only
    return staticPages;
  }
}

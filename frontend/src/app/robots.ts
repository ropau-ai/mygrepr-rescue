import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/settings', '/login', '/sign-up', '/maintenance'],
    },
    sitemap: 'https://grepr.jelilahounou.com/sitemap.xml',
  };
}

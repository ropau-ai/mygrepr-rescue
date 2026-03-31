import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { fetchPosts } from '@/lib/nocodb';

export const revalidate = 300;

// In-memory rate limiter — 10 requests per minute per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;
const MAX_MAP_SIZE = 10_000;

// Periodic cleanup to prevent memory leak
function cleanupRateMap() {
  const now = Date.now();
  if (rateMap.size > MAX_MAP_SIZE) {
    for (const [key, entry] of rateMap) {
      if (now > entry.resetAt) rateMap.delete(key);
    }
  }
}

function getClientIP(request: NextRequest): string {
  // x-real-ip is set by reverse proxies and harder to spoof
  return request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown';
}

function isRateLimited(ip: string): boolean {
  cleanupRateMap();
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const posts = await fetchPosts();
    return NextResponse.json(
      { posts },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'Access-Control-Allow-Origin': 'https://grepr.jelilahounou.com',
          'Access-Control-Allow-Methods': 'GET',
        },
      }
    );
  } catch (error) {
    console.error('API /posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

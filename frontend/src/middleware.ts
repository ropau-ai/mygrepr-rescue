import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes — accessible without login
const isPublicRoute = createRouteMatcher([
  '/landing(.*)',
  '/login(.*)',
  '/sign-up(.*)',
  '/maintenance(.*)',
  '/about(.*)',
  '/api/posts(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Maintenance mode
  const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
  if (isMaintenanceMode) {
    const pathname = request.nextUrl.pathname;
    const isExcluded = pathname.startsWith('/maintenance') || pathname.startsWith('/_next/');
    if (!isExcluded) {
      return NextResponse.rewrite(new URL('/maintenance', request.url));
    }
  }

  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

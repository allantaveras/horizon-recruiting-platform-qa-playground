import { NextResponse, NextRequest } from 'next/server';

/**
 * Decodes the JWT payload without verifying its signature.
 * 
 * SECURITY NOTE & TRADE-OFF:
 * This method is used in Next.js middleware for quick UI routing checks (e.g. role-based redirects).
 * It does NOT verify the signature of the JWT token. Because of this:
 * 1. It must not be relied upon for database or backend API security. 
 * 2. Critical authorization and data access controls are enforced securely on the backend / Supabase layer 
 *    using Row Level Security (RLS) and cryptographic signature validation in API routes.
 */
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = atob(base64);
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Static files, icons, API endpoints, and Supabase proxy routes are ignored by middleware
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/') ||
    path.startsWith('/auth/') ||
    path.startsWith('/rest/') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('sb-access-token')?.value;

  // Redirect to login if accessing protected routes without token
  if (!token && path !== '/' && path !== '/apply' && !path.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If logged in, redirect away from login page to dashboard
  if (token && path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (token) {
    // Role information can be extracted for route protection here if needed in the future
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/documents',
  '/investigations',
  '/reports',
  '/sessions',
  '/users',
  '/keys',
  '/ledger',
  '/watermarks',
  '/audit',
  '/profile',
  '/admin'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('ns_access_token')?.value;

  const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/documents/:path*',
    '/investigations/:path*',
    '/reports/:path*',
    '/sessions/:path*',
    '/users/:path*',
    '/keys/:path*',
    '/ledger/:path*',
    '/watermarks/:path*',
    '/audit/:path*',
    '/profile/:path*',
    '/admin/:path*'
  ]
};

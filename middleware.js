// middleware.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  // Allow public assets and API routes
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req });
  
  // Handle auth pages
  if (req.nextUrl.pathname.startsWith('/auth')) {
    if (token) {
      // If user has completed onboarding, redirect to home
      if (token.hasCompletedOnboarding && req.nextUrl.pathname === '/auth/username-select') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      // If user hasn't completed onboarding, ensure they complete it
      if (!token.hasCompletedOnboarding && req.nextUrl.pathname !== '/auth/username-select') {
        return NextResponse.redirect(new URL('/auth/username-select', req.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // Force onboarding completion
  if (!token.hasCompletedOnboarding && 
      req.nextUrl.pathname !== '/auth/username-select') {
    return NextResponse.redirect(new URL('/auth/username-select', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
};
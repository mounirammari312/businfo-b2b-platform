import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth pages: redirect authenticated users away from login/register
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password')) {
    // Check for Supabase auth cookie
    const authCookie = request.cookies.get('sb-bddpxpglnpndgdygdtth-auth-token');
    if (authCookie?.value) {
      try {
        const parsed = JSON.parse(authCookie.value);
        if (parsed.access_token && parsed.access_token.length > 10) {
          // User is authenticated, redirect to dashboard
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      } catch {
        // Invalid cookie, continue
      }
    }
    return NextResponse.next();
  }

  // Admin routes: need admin role
  if (pathname.startsWith('/admin') || pathname.startsWith('/(dashboard)/admin')) {
    const authCookie = request.cookies.get('sb-bddpxpglnpndgdygdtth-auth-token');
    if (!authCookie?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      const parsed = JSON.parse(authCookie.value);
      // Basic token presence check — actual role verification happens client-side
      // because Supabase JWT claims need client-side decoding
      if (!parsed.access_token || parsed.access_token.length < 10) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Protected dashboard routes (buyer, supplier)
  if (pathname.startsWith('/(dashboard)/buyer') || pathname.startsWith('/(dashboard)/supplier')) {
    const authCookie = request.cookies.get('sb-bddpxpglnpndgdygdtth-auth-token');
    if (!authCookie?.value) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      const parsed = JSON.parse(authCookie.value);
      if (!parsed.access_token || parsed.access_token.length < 10) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/forgot-password',
    '/dashboard/:path*',
    '/admin/:path*',
    '/(dashboard)/buyer/:path*',
    '/(dashboard)/supplier/:path*',
    '/(dashboard)/admin/:path*',
  ],
};

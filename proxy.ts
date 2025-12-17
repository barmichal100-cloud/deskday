import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/desk/.*/book',
  '/payment',
];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = [
  '/auth/sign-in',
  '/auth/sign-up',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  let isAuthenticated = false;
  try {
    if (token) {
      jwt.verify(token, JWT_SECRET);
      isAuthenticated = true;
    }
  } catch (error) {
    // Token is invalid or expired
    isAuthenticated = false;
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.includes('.*')) {
      const regex = new RegExp('^' + route + '$');
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });

  // Redirect to sign-in if trying to access protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Check if on auth route while authenticated
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // Redirect to dashboard if already authenticated and trying to access auth pages
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};

// middleware.ts - FIXED VERSION
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';

// Define protected routes and their required roles
const protectedRoutes = {
  '/kitchen': ['kitchen', 'manager'],
  '/manager': ['manager'],
  '/api/kitchen': ['kitchen', 'manager'],
  '/api/analytics': ['manager'],
  '/api/menu': { 
    GET: ['public'], 
    PUT: ['manager'], 
    POST: ['manager'] 
  },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/customer' ||
    pathname === '/unauthorized' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const isProtected = Object.keys(protectedRoutes).some(route =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return pathname.startsWith('/api')
      ? NextResponse.json({ success: false }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
  }

  const user = await verifyToken(token);

  if (!user) {
    return pathname.startsWith('/api')
      ? NextResponse.json({ success: false }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
  }

  // ✅ ROLE CHECK (you were missing this)
  const requiredRoles = getRequiredRoles(pathname, request.method);

  if (
    !requiredRoles.includes('public') &&
    !requiredRoles.includes(user.role)
  ) {
    return pathname.startsWith('/api')
      ? NextResponse.json({ success: false }, { status: 403 })
      : NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  // Attach user headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', String(user.id));
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-username', user.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}



function getRequiredRoles(pathname: string, method: string): string[] {
  for (const [route, roles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      // Handle method-specific roles
      if (typeof roles === 'object' && !Array.isArray(roles)) {
        return roles[method as keyof typeof roles] || [];
      }
      return roles as string[];
    }
  }
  return ['public'];
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
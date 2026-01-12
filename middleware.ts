import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth-edge';

// Protected routes and roles
const protectedRoutes: Record<
  string,
  string[] | Record<string, string[]>
> = {
  '/kitchen': ['kitchen', 'manager'],
  '/manager': ['manager'],
  '/api/kitchen': ['kitchen', 'manager'],
  '/api/analytics': ['manager'],
  '/api/menu': {
    GET: ['public'],
    POST: ['manager'],
    PUT: ['manager'],
  },
  '/api/categories': {
    GET: ['public'],
  },
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  /* -------------------- PUBLIC ROUTES -------------------- */
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

  /* -------------------- CHECK IF PROTECTED -------------------- */
  const matchedRoute = Object.keys(protectedRoutes).find(route =>
    pathname.startsWith(route)
  );

  if (!matchedRoute) {
    return NextResponse.next();
  }

  /* -------------------- REQUIRED ROLES -------------------- */
  const routeConfig = protectedRoutes[matchedRoute];
  let requiredRoles: string[] = [];

  if (typeof routeConfig === 'object' && !Array.isArray(routeConfig)) {
    requiredRoles = routeConfig[method] || [];
  } else {
    requiredRoles = routeConfig as string[];
  }

  // ✅ Public GET access (menu, categories)
  if (requiredRoles.includes('public')) {
    return NextResponse.next();
  }

  /* -------------------- AUTH TOKEN -------------------- */
  const token =
    request.cookies.get('auth_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return pathname.startsWith('/api')
      ? NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
  }

  /* -------------------- VERIFY TOKEN -------------------- */
  const user = await verifyToken(token);

  if (!user) {
    return pathname.startsWith('/api')
      ? NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
  }

  /* -------------------- ROLE CHECK -------------------- */
  if (!requiredRoles.includes(user.role)) {
    return pathname.startsWith('/api')
      ? NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      : NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  /* -------------------- ATTACH USER HEADERS -------------------- */
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

/* -------------------- MATCHER -------------------- */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

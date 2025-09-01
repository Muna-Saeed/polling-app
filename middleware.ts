import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Authentication logic based on route
  const path = request.nextUrl.pathname;

  // Protected routes - redirect to login if not authenticated
  const protectedRoutes = [
    '/create-poll',
    '/my-polls',
    '/account',
  ];

  // Auth routes - redirect to home if already authenticated
  const authRoutes = [
    '/auth/login',
    '/auth/register',
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => path === route);

  // Redirect logic
  if (isProtectedRoute && !session) {
    // Redirect to login if trying to access protected route without session
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isAuthRoute && session) {
    // Redirect to home if trying to access auth routes with active session
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    // Apply to all routes except static files, api routes, and _next
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
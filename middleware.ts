import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Update the session using the utility function
  const response = await updateSession(request);
  
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

  // Get the session cookie to check authentication status
  const hasAccessToken = request.cookies.has('sb-access-token') || 
                         request.cookies.has('sb-refresh-token');

  // Redirect logic
  if (isProtectedRoute && !hasAccessToken) {
    // Redirect to login if trying to access protected route without session
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (isAuthRoute && hasAccessToken) {
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
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // Update the session using the utility function
  const response = await updateSession(request);
  
  // Get the session from the cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Check if the user is authenticated by looking for the sb-access-token cookie
  const hasAccessToken = request.cookies.has('sb-access-token');
  const session = hasAccessToken ? { user: {} } : null;

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
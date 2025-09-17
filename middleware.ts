import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/'];
const PROTECTED_PATHS = ['/create-poll', '/my-polls', '/account'];

export async function middleware(request: NextRequest) {
  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client configured to use cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update the request cookies
          request.cookies.set({
            name,
            value,
            ...options,
          });
          
          // Update the response cookies
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: 'lax',
            path: '/',
          });
        },
        remove(name: string, options: CookieOptions) {
          // Update the request cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
          
          // Update the response cookies
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
            path: '/',
          });
        },
      },
    }
  );

  // Refresh the session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();
  const currentPath = request.nextUrl.pathname;

  // Check if the current path is protected
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    currentPath.startsWith(path)
  );

  // Check if the current path is a public auth path
  const isPublicPath = PUBLIC_PATHS.some(path => 
    currentPath === path || currentPath.startsWith(`${path}/`)
  );

  // Handle protected routes
  if (isProtectedPath) {
    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url);
      redirectUrl.searchParams.set('redirectedFrom', currentPath);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle auth routes (login/register)
  if (isPublicPath && session && !currentPath.startsWith('/auth/callback')) {
    if (currentPath !== '/') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|_next/data/).*)',
  ],
};
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RateLimitError } from '@/lib/errors';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// In-memory store for rate limiting (consider using Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number;
  
  /**
   * Maximum number of requests allowed in the window
   * @default 100
   */
  max?: number;
  
  /**
   * Whether to include rate limit headers
   * @default true
   */
  headers?: boolean;
  
  /**
   * Message to return when rate limit is exceeded
   * @default 'Too many requests, please try again later.'
   */
  message?: string;
  
  /**
   * Whether to skip rate limiting for authenticated users
   * @default false
   */
  skipAuthenticated?: boolean;
}

const defaultOptions: Required<RateLimitOptions> = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  headers: true,
  message: 'Too many requests, please try again later.',
  skipAuthenticated: false,
};

/**
 * Rate limiting middleware for Next.js API routes
 * @param options Rate limiting options
 * @returns Next.js middleware function
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const { windowMs, max, headers, message, skipAuthenticated } = { ...defaultOptions, ...options };
  
  return async function (req: NextRequest) {
    // Skip rate limiting if user is authenticated and skipAuthenticated is true
    if (skipAuthenticated && req.headers.get('authorization')) {
      return NextResponse.next();
    }

    // Get client IP from headers (handled by Next.js in production)
    const ip = req.headers.get('x-real-ip') || 
               req.headers.get('x-forwarded-for')?.split(',').shift()?.trim() || 
               'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    const nowCleanup = Date.now();
    const windowStartCleanup = nowCleanup - windowMs;
    
    rateLimitStore.forEach((value, key) => {
      if (value.resetAt < windowStartCleanup) {
        rateLimitStore.delete(key);
      }
    });

    // Get or create rate limit entry
    const entry = rateLimitStore.get(ip) || { count: 0, resetAt: now + windowMs };
    
    // Check if we should reset the counter
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    // Increment the request count
    entry.count++;
    rateLimitStore.set(ip, entry);

    // Check if rate limit is exceeded
    const remaining = Math.max(0, max - entry.count);
    const resetIn = Math.ceil((entry.resetAt - now) / 1000);

    // Create response with rate limit headers
    const responseHeaders = new Headers();
    
    if (headers) {
      responseHeaders.set('X-RateLimit-Limit', max.toString());
      responseHeaders.set('X-RateLimit-Remaining', remaining.toString());
      responseHeaders.set('X-RateLimit-Reset', resetIn.toString());
    }

    // If rate limit is exceeded, return error
    if (entry.count > max) {
      responseHeaders.set('Retry-After', resetIn.toString());
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message,
          retryAfter: resetIn,
        },
        { 
          status: 429,
          headers: responseHeaders
        }
      );
    }

    return NextResponse.next({
      headers: responseHeaders
    });
  };
}

/**
 * Creates a rate-limited API route handler
 * @param handler The API route handler function
 * @param options Rate limiting options
 * @returns A wrapped API route handler with rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  options?: RateLimitOptions
) {
  const rateLimitMiddleware = rateLimit(options);
  
  return async function (req: NextRequest) {
    // First, apply rate limiting
    const rateLimitResponse = await rateLimitMiddleware(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    try {
      // If rate limit not exceeded, call the original handler
      return await handler(req);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            message: error.message,
            retryAfter: error.details?.retryAfter,
          },
          { status: 429 }
        );
      }
      
      // Re-throw other errors to be handled by Next.js error handling
      throw error;
    }
  };
}

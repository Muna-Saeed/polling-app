import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

type SupabaseClient = ReturnType<typeof createBrowserClient<Database>>

let client: SupabaseClient | null = null

export function createClient() {
  if (client) return client
  
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined;
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
        },
        set(name: string, value: string, options: any) {
          try {
            document.cookie = `${name}=${value}${options ? `; ${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('; ')}` : ''}`;
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: any) {
          try {
            document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT${options ? `; ${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('; ')}` : ''}`;
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
  
  return client
}

export function getSupabaseClient() {
  return createClient()
}

export function getSupabaseServerClient() {
  return createClient()
}

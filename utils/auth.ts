import { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Attempt to retrieve the currently authenticated user.
 * Returns the user object on success or `null` if the user is not
 * authenticated. Any Supabase error is also forwarded to the caller so that
 * custom handling can take place upstream.
 */
export async function getAuthenticatedUser(
  supabase: SupabaseClient
): Promise<{ user: User | null; error: string | null }> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return { user: null, error: error.message };
  }

  if (!session?.user) {
    return { user: null, error: null };
  }

  return { user: session.user, error: null };
}

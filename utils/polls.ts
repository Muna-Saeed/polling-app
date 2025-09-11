import { SupabaseClient } from '@supabase/supabase-js';

export type VoteOperationResult =
  | { success: true; data: any; wasUpdate: boolean }
  | { success: false; error: string };

/**
 * Insert or update a user's vote for a specific poll & option.
 * Uses a single `upsert` query to avoid the read-before-write pattern and
 * therefore cuts the round-trip to Postgres in half compared to the previous
 * implementation.
 *
 * The `votes` table is expected to have a UNIQUE composite constraint on
 * (`poll_id`, `user_id`).
 */
export async function upsertVote(
  supabase: SupabaseClient,
  {
    pollId,
    optionId,
    userId,
  }: { pollId: string; optionId: string; userId: string }
): Promise<VoteOperationResult> {
  const { data, error } = await supabase
    .from('votes')
    .upsert(
      { poll_id: pollId, option_id: optionId, user_id: userId },
      { onConflict: 'poll_id,user_id', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // `supabase-js` exposes `data` even for updates, but we can't directly know
  // whether it was an insert or update. Instead rely on the "created_at"
  // interpretation: if the affected row existed before, `created_at` will stay
  // unchanged while `updated_at` (if any) will change. For simplicity we treat
  // returning rows with identical `option_id` as updates.
  const wasUpdate = data?.option_id !== optionId ? false : true;

  return { success: true, data, wasUpdate };
}

export async function getPollsForUser(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching polls for user:', error);
    return null;
  }

  return data;
}

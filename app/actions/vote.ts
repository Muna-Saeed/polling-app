'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { getAuthenticatedUser } from '@/utils/auth';
import { upsertVote, VoteOperationResult } from '@/utils/polls';

// Define the vote schema
const voteSchema = z.object({
  pollId: z.string(),
  optionId: z.string(),
});

export type VoteResponse =
  | { success: true; message: string; data: any }
  | { success: false; message: string; error: string };

export async function submitVote(formData: FormData): Promise<VoteResponse> {
  // Extract & validate payload early
  const pollId = formData.get('pollId') as string;
  const optionId = formData.get('optionId') as string;

  const parse = voteSchema.safeParse({ pollId, optionId });
  if (!parse.success) {
    return {
      success: false,
      message: 'Invalid request payload',
      error: parse.error.message,
    };
  }

  // Create Supabase client (server side)
  const supabase = await createClient();

  // Ensure user is authenticated
  const { user, error: authErr } = await getAuthenticatedUser(supabase);
  if (authErr) {
    return {
      success: false,
      message: 'Authentication error',
      error: authErr,
    };
  }

  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to vote',
      error: 'UNAUTHORIZED',
    };
  }

  // Perform a single upsert to record the vote
  const result: VoteOperationResult = await upsertVote(supabase, {
    pollId,
    optionId,
    userId: user.id,
  });

  if (!result.success) {
    return {
      success: false,
      message: 'Failed to record vote',
      error: result.error,
    };
  }

  const message = result.wasUpdate
    ? 'Your vote has been updated'
    : 'Your vote has been submitted';

  return {
    success: true,
    message,
    data: result.data,
  };

}
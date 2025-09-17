'use server';

import { z } from 'zod';
import { requireSession } from '@/lib/services/auth';
import { submitVote } from '@/lib/services/polls';

// Define the vote schema
const voteSchema = z.object({
  pollId: z.string(),
  optionId: z.string(),
});

export type VoteResponse =
  | { success: true; message: string; data: any }
  | { success: false; message: string; error: string };

export async function submitVoteAction(pollId: string, optionId: string): Promise<VoteResponse> {
  if (!pollId || !optionId) {
    return {
      success: false,
      message: 'Poll ID and option ID are required',
      error: 'Missing required fields',
    };
  }

  const parse = voteSchema.safeParse({ pollId, optionId });
  if (!parse.success) {
    return {
      success: false,
      message: 'Invalid request payload',
      error: parse.error.message,
    };
  }

  try {
    // Ensure user is authenticated
    const session = await requireSession();
    
    // Submit the vote
    const result = await submitVote(
      parse.data.pollId,
      parse.data.optionId,
      session.user.id
    );

    return {
      success: true,
      message: 'Vote submitted successfully',
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      message: errorMessage,
      error: errorMessage,
    };
  }
}
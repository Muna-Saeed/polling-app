import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { getAuthenticatedUser } from '@/utils/auth';
import { upsertVote, VoteOperationResult } from '@/utils/polls';

// Define the vote schema
const voteSchema = z.object({
  pollId: z.string(),
  optionId: z.string(),
});

export async function POST(req: NextRequest) {
  // Extract & validate payload
  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json(
      { success: false, message: 'Unsupported media type', error: 'EXPECTED_APPLICATION_JSON' },
      { status: 415 }
    );
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON payload', error: 'BAD_JSON' },
      { status: 400 }
    );
  }
  const parse = voteSchema.safeParse(body);

  if (!parse.success) {
    return NextResponse.json(
      { success: false, message: 'Invalid request payload', error: parse.error.message },
      { status: 400 }
    );
  }

  const { pollId, optionId } = parse.data;

  // Create Supabase client
  const supabase = await createClient();

  // Ensure user is authenticated
  const { user, error: authErr } = await getAuthenticatedUser(supabase);
  if (authErr) {
    return NextResponse.json(
      { success: false, message: 'Authentication error', error: authErr },
      { status: 500 }
    );
  }

  if (!user) {
    return NextResponse.json(
      { success: false, message: 'You must be logged in to vote', error: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Perform a single upsert to record the vote
  const result: VoteOperationResult = await upsertVote(supabase, {
    pollId,
    optionId,
    userId: user.id,
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: 'Failed to record vote', error: result.error },
      { status: 500 }
    );
  }

  const message = result.wasUpdate
    ? 'Your vote has been updated'
    : 'Your vote has been submitted';

  return NextResponse.json(
    { success: true, message, data: result.data },
    { status: result.wasUpdate ? 200 : 201 }
  );
}

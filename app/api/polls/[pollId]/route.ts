import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const pollIdSchema = z.string().uuid();

export async function GET(
  request: Request,
  { params }: { params: { pollId: string } }
) {
  try {
    // Validate pollId
    const validation = pollIdSchema.safeParse(params.pollId);
    if (!validation.success) {
      return new NextResponse('Invalid poll ID', { status: 400 });
    }

    const pollId = validation.data;
    const supabase = getSupabaseServerClient();
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch poll with options and vote counts
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        created_at,
        user_id,
        options: poll_options(
          id,
          text,
          votes: votes(count)
        )
      `)
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return new NextResponse('Poll not found', { status: 404 });
    }

    // Verify ownership
    if (poll.user_id !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Transform the data to include vote counts
    const transformedPoll = {
      ...poll,
      options: poll.options.map((option: any) => ({
        ...option,
        votes: option.votes[0]?.count || 0
      })),
      total_votes: poll.options.reduce(
        (sum: number, option: any) => sum + (option.votes[0]?.count || 0),
        0
      )
    };

    return NextResponse.json(transformedPoll);
  } catch (error) {
    console.error('Error fetching poll results:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

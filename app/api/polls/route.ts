import { createServerClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { title, description, question, options } = body;

    // Validate required fields
    if (!title || !description || !question || !options || options.length < 2) {
      return NextResponse.json(
        { message: 'Title, description, question, and at least 2 options are required' },
        { status: 400 }
      );
    }

    // Validate question length
    if (question.length < 10) {
      return NextResponse.json(
        { message: 'Question must be at least 10 characters long' },
        { status: 400 }
      );
    }

    // Validate that all options are non-empty
    if (options.some((option: string) => !option.trim())) {
      return NextResponse.json(
        { message: 'All options must be non-empty' },
        { status: 400 }
      );
    }

    // Create a Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);

    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { message: 'You must be logged in to create a poll' },
        { status: 401 }
      );
    }

    // Insert the poll into the database
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        question,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (pollError) {
      console.error('Error creating poll:', pollError);
      return NextResponse.json(
        { message: 'Failed to create poll' },
        { status: 500 }
      );
    }

    // Insert the options into the database
    const optionsToInsert = options.map((option: string) => ({
      poll_id: pollData.id,
      text: option,
    }));

    const { error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert);

    if (optionsError) {
      console.error('Error creating poll options:', optionsError);
      // Attempt to delete the poll if options creation fails
      await supabase.from('polls').delete().eq('id', pollData.id);
      return NextResponse.json(
        { message: 'Failed to create poll options' },
        { status: 500 }
      );
    }

    return NextResponse.json(pollData, { status: 201 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
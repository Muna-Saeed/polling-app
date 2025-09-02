import { createServerClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { title, description } = body;

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { message: 'Title and description are required' },
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
    const { data, error } = await supabase
      .from('polls')
      .insert({
        title,
        description,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating poll:', error);
      return NextResponse.json(
        { message: 'Failed to create poll' },
        { status: 500 }
      );
    }

    // Return the created poll
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
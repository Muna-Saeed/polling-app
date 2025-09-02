'use server';

import { createServerClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { z } from 'zod';

// Define the vote schema
const voteSchema = z.object({
  pollId: z.string(),
  optionId: z.string(),
});

export type VoteResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};

export async function submitVote(formData: FormData): Promise<VoteResponse> {
  try {
    // Extract and validate the data
    const pollId = formData.get('pollId') as string;
    const optionId = formData.get('optionId') as string;
    
    const validatedData = voteSchema.parse({ pollId, optionId });
    
    // Create a Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    
    // Get the current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        message: 'You must be logged in to vote',
        error: 'UNAUTHORIZED',
      };
    }
    
    // Check if user has already voted on this poll
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', validatedData.pollId)
      .eq('user_id', session.user.id)
      .single();
    
    if (existingVote) {
      // Update existing vote
      const { error: updateError } = await supabase
        .from('votes')
        .update({ option_id: validatedData.optionId })
        .eq('id', existingVote.id);
      
      if (updateError) {
        console.error('Error updating vote:', updateError);
        return {
          success: false,
          message: 'Failed to update vote',
          error: updateError.message,
        };
      }
      
      return {
        success: true,
        message: 'Your vote has been updated',
      };
    }
    
    // Insert new vote
    const { data, error } = await supabase
      .from('votes')
      .insert({
        poll_id: validatedData.pollId,
        option_id: validatedData.optionId,
        user_id: session.user.id,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error submitting vote:', error);
      return {
        success: false,
        message: 'Failed to submit vote',
        error: error.message,
      };
    }
    
    return {
      success: true,
      message: 'Your vote has been submitted',
      data,
    };
  } catch (error) {
    console.error('Error processing vote:', error);
    return {
      success: false,
      message: 'Failed to process vote',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
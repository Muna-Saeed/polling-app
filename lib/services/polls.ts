import { getSupabaseClient } from '../supabase/client'
import { getSupabaseServerClient } from '../supabase/server'
import type { Database } from '../../lib/database.types'

type PollOption = Database['public']['Tables']['options']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

export interface PollWithVotes extends Omit<Database['public']['Tables']['polls']['Row'], 'options'> {
  options: (PollOption & { votes: number })[]
  total_votes: number
}

interface PollWithOptions extends Omit<Database['public']['Tables']['polls']['Row'], 'options'> {
  options: Array<PollOption & { votes: Array<{ count: number }> }>
}

export async function getPollWithResults(pollId: string, userId?: string): Promise<PollWithVotes | null> {
  const supabase = getSupabaseClient()
  
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .select(`
      *,
      options:options!poll_options_poll_id_fkey(
        id,
        text,
        votes:votes!votes_option_id_fkey(count)
      )
    `)
    .eq('id', pollId)
    .single() as { data: PollWithOptions | null; error: any }

  if (pollError || !poll) {
    console.error('Error fetching poll:', pollError?.message)
    return null
  }

  // If userId is provided, verify ownership
  if (userId && poll.user_id !== userId) {
    throw new Error('Unauthorized: You do not own this poll')
  }

  // Transform the data
  const optionsWithVotes = (poll.options || []).map((option) => ({
    ...option,
    votes: option.votes?.[0]?.count || 0
  }))

  const totalVotes = optionsWithVotes.reduce((sum: number, option: { votes: number }) => sum + option.votes, 0)

  return {
    ...poll,
    options: optionsWithVotes,
    total_votes: totalVotes
  }
}

export async function getUserPolls(userId: string): Promise<PollWithVotes[]> {
  const supabase = getSupabaseClient()
  
  const { data: polls, error } = await supabase
    .from('polls')
    .select(`
      *,
      options:options!poll_options_poll_id_fkey(
        id,
        text,
        votes:votes!votes_option_id_fkey(count)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false }) as { data: PollWithOptions[] | null; error: any }

  if (error) {
    console.error('Error fetching user polls:', error.message)
    return []
  }

  return (polls || []).map(poll => {
    const optionsWithVotes = (poll.options || []).map(option => ({
      ...option,
      votes: option.votes?.[0]?.count || 0
    }))

    const totalVotes = optionsWithVotes.reduce((sum: number, option: { votes: number }) => sum + option.votes, 0)

    return {
      ...poll,
      options: optionsWithVotes,
      total_votes: totalVotes
    }
  })
}

export async function createPoll(question: string, options: string[], userId: string) {
  const supabase = getSupabaseClient()
  
  // Start a transaction
  const { data: poll, error: pollError } = await supabase
    .from('polls')
    .insert({
      question,
      user_id: userId,
    })
    .select()
    .single()

  if (pollError) {
    throw new Error(`Failed to create poll: ${pollError.message}`)
  }

  // Add options
  const { error: optionsError } = await supabase
    .from('poll_options')
    .insert(
      options.map(option => ({
        poll_id: poll.id,
        text: option,
      }))
    )

  if (optionsError) {
    // Clean up the poll if options insertion fails
    await supabase.from('polls').delete().eq('id', poll.id)
    throw new Error(`Failed to add poll options: ${optionsError.message}`)
  }

  return poll.id
}

export async function submitVote(pollId: string, optionId: string, userId: string) {
  const supabase = getSupabaseClient()
  
  // Check if user already voted
  const { data: existingVote, error: voteCheckError } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('user_id', userId)
    .maybeSingle()

  if (voteCheckError) {
    throw new Error(`Failed to check existing vote: ${voteCheckError.message}`)
  }

  if (existingVote) {
    throw new Error('You have already voted in this poll')
  }

  // Record the vote
  const { error: voteError } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
    })

  if (voteError) {
    throw new Error(`Failed to record vote: ${voteError.message}`)
  }

  // Get updated poll results
  const updatedPoll = await getPollWithResults(pollId)
  return updatedPoll
}

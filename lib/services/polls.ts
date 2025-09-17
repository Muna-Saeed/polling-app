import { getSupabaseClient } from '../supabase/client';
import type { Database } from '../../lib/database.types';
import { 
  PollError, 
  ValidationError, 
  NotFoundError 
} from '../errors';

// Types
type PollOption = Database['public']['Tables']['options']['Row'];
type Vote = Database['public']['Tables']['votes']['Row'];

interface VoteResult {
  count: number;
}

export interface PollWithVotes extends Omit<Database['public']['Tables']['polls']['Row'], 'options'> {
  options: (PollOption & { votes: number })[];
  total_votes: number;
  is_owner?: boolean;
}

// Type for poll creation result
interface PollCreationResult {
  id: string;
}

interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Constants
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;
const DEFAULT_PAGE_SIZE = 10;
const MAX_POLL_QUESTION_LENGTH = 280;
const MAX_OPTION_LENGTH = 100;

export async function getPollWithResults(
  pollId: string, 
  userId?: string
): Promise<PollWithVotes> {
  if (!pollId) {
    throw new ValidationError('Poll ID is required');
  }

  const supabase = getSupabaseClient();
  
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
    .single();

  if (pollError) {
    if (pollError.code === 'PGRST116') { // Not found
      throw new NotFoundError('Poll');
    }
    throw new PollError(
      'Failed to fetch poll', 
      'POLL_FETCH_ERROR', 
      500, 
      { cause: pollError }
    );
  }

  const isOwner = userId ? poll.user_id === userId : false;
  const options = poll.options || [];

  // Transform the data
  const optionsWithVotes = options.map((option: PollOption & { votes: VoteResult[] }) => ({
    ...option,
    votes: option.votes?.[0]?.count || 0
  }));

  const totalVotes = optionsWithVotes.reduce(
    (sum: number, option: { votes: number }) => sum + option.votes, 
    0
  );

  return {
    ...poll,
    options: optionsWithVotes,
    total_votes: totalVotes,
    is_owner: isOwner
  };
}

interface UserPollsResult {
  polls: PollWithVotes[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export async function getUserPolls(
  userId: string, 
  { page = 1, pageSize = DEFAULT_PAGE_SIZE }: PaginationParams = {}
): Promise<UserPollsResult> {
  if (!userId) {
    throw new ValidationError('User ID is required');
  }

  // Validate pagination parameters
  const currentPage = Math.max(1, Math.floor(page));
  const currentPageSize = Math.max(1, Math.min(pageSize, 100)); // Cap page size at 100
  
  const from = (currentPage - 1) * currentPageSize;
  const to = from + currentPageSize - 1;
  
  const supabase = getSupabaseClient();
  
  // Create a reusable query builder
  const pollsQuery = supabase
    .from('polls')
    .select(
      `
      *,
      options:options!poll_options_poll_id_fkey(
        id,
        text,
        votes:votes!votes_option_id_fkey(count)
      )
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Execute the query with pagination
  const { data: polls, count: total, error } = await pollsQuery.range(from, to);

  if (error) {
    throw new PollError(
      'Failed to fetch polls', 
      'POLLS_FETCH_ERROR', 
      500, 
      { cause: error }
    );
  }

  const totalPolls = total || 0;
  const totalPages = Math.ceil(totalPolls / currentPageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const pollsWithVotes = (polls || []).map(poll => {
    const options = Array.isArray(poll.options) ? poll.options : [];
    const optionsWithVotes = options.map((option: PollOption & { votes?: VoteResult[] }) => ({
      ...option,
      votes: option.votes?.[0]?.count || 0
    }));

    const totalVotes = optionsWithVotes.reduce(
      (sum: number, option: { votes: number }) => sum + option.votes, 
      0
    );

    return {
      ...poll,
      options: optionsWithVotes,
      total_votes: totalVotes,
      is_owner: true // Since these are user's own polls
    };
  });

  return {
    polls: pollsWithVotes,
    total: totalPolls,
    page: currentPage,
    pageSize: currentPageSize,
    totalPages,
    hasNextPage,
    hasPreviousPage
  };
}

function validatePollInput(question: string, options: string[]): void {
  if (!question?.trim()) {
    throw new ValidationError('Poll question is required');
  }

  if (question.length > MAX_POLL_QUESTION_LENGTH) {
    throw new ValidationError(
      `Question must be less than ${MAX_POLL_QUESTION_LENGTH} characters`
    );
  }

  if (!Array.isArray(options) || options.length < MIN_OPTIONS) {
    throw new ValidationError(
      `At least ${MIN_OPTIONS} options are required`
    );
  }

  if (options.length > MAX_OPTIONS) {
    throw new ValidationError(
      `Maximum ${MAX_OPTIONS} options are allowed`
    );
  }

  // Check for empty or duplicate options
  const uniqueOptions = new Set<string>();
  
  options.forEach((option, index) => {
    const trimmed = option.trim();
    
    if (!trimmed) {
      throw new ValidationError(`Option ${index + 1} cannot be empty`);
    }
    
    if (trimmed.length > MAX_OPTION_LENGTH) {
      throw new ValidationError(
        `Option ${index + 1} must be less than ${MAX_OPTION_LENGTH} characters`
      );
    }
    
    const lowerCaseOption = trimmed.toLowerCase();
    if (uniqueOptions.has(lowerCaseOption)) {
      throw new ValidationError(
        `Duplicate option: "${trimmed}"`
      );
    }
    
    uniqueOptions.add(lowerCaseOption);
  });
}

/**
 * Create a new poll with the given question and options
 * @param title The title of the poll
 * @param description Optional description of the poll
 * @param question The poll question
 * @param options Array of poll options
 * @param userId The ID of the user creating the poll
 * @returns The created poll ID
 */
export async function createPoll(
  title: string,
  description: string | null,
  question: string, 
  options: string[], 
  userId: string
): Promise<string> {
  // Validate input
  validatePollInput(question, options);

  const supabase = getSupabaseClient();
  
  try {
    // Start transaction
    const { data: poll, error: pollError } = await supabase
      .rpc<PollCreationResult[]>('create_poll_with_options', {
        p_title: title,
        p_description: description,
        p_question: question,
        p_user_id: userId,
        p_options: options.map(opt => opt.trim())
      });

    if (pollError) {
      throw new PollError(
        `Failed to create poll: ${pollError.message}`,
        'POLL_CREATION_ERROR',
        500,
        { cause: pollError }
      );
    }

    if (!poll || !poll[0]?.id) {
      throw new PollError('Failed to create poll: No ID returned', 'POLL_CREATION_ERROR', 500);
    }

    return poll[0].id;
  } catch (error) {
    if (error instanceof PollError) throw error;
    
    throw new PollError(
      'Failed to create poll', 
      'POLL_CREATION_ERROR', 

/**
 * Submit a vote for a poll option
 * @param pollId The ID of the poll
 * @param optionId The ID of the option being voted for
 * @param userId The ID of the user voting
 * @returns Object with success status and updated poll data
 */
export async function submitVote(
  pollId: string, 
  optionId: string, 
  userId: string
): Promise<{ success: boolean; poll: PollWithVotes }> {
  if (!pollId || !optionId || !userId) {
    throw new ValidationError('Poll ID, option ID, and user ID are required');
  }

  const supabase = getSupabaseClient();
  
  try {
    // Check if user has already voted on this poll
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .maybeSingle();

    if (voteCheckError) throw voteCheckError;
    if (existingVote) {
      throw new PollError(
        'You have already voted on this poll',
        'ALREADY_VOTED',
        400
      );
    }

    // Check if the option belongs to the poll
    const { data: option, error: optionError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('id', optionId)
      .eq('poll_id', pollId)
      .single();

    if (optionError || !option) {
      throw new NotFoundError('Poll option');
    }

    // Record the vote
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
      });

    if (voteError) {
      throw new PollError(
        'Failed to submit vote', 
        'VOTE_SUBMISSION_ERROR', 
        500, 
        { cause: voteError }
      );
    }

    // Get updated poll results
    const updatedPoll = await getPollWithResults(pollId, userId);
    return { success: true, poll: updatedPoll };
  } catch (error) {
    if (error instanceof PollError) throw error;
    
    throw new PollError(
      'Failed to submit vote', 
      'VOTE_SUBMISSION_ERROR', 
      500, 
      { cause: error as Error }
    );
  }

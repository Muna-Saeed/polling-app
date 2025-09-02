-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view all votes
CREATE POLICY "Votes are viewable by everyone" 
  ON public.votes 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to create their own votes
CREATE POLICY "Users can create their own votes" 
  ON public.votes 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own votes
CREATE POLICY "Users can update their own votes" 
  ON public.votes 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow users to delete their own votes
CREATE POLICY "Users can delete their own votes" 
  ON public.votes 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX votes_poll_id_idx ON public.votes (poll_id);
CREATE INDEX votes_user_id_idx ON public.votes (user_id);
CREATE INDEX votes_option_id_idx ON public.votes (option_id);
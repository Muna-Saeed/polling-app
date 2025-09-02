-- Create polls table
CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view all polls
CREATE POLICY "Polls are viewable by everyone" 
  ON public.polls 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to create polls
CREATE POLICY "Users can create their own polls" 
  ON public.polls 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own polls
CREATE POLICY "Users can update their own polls" 
  ON public.polls 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow users to delete their own polls
CREATE POLICY "Users can delete their own polls" 
  ON public.polls 
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);
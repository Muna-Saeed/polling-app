-- Add question field to polls table
ALTER TABLE public.polls ADD COLUMN IF NOT EXISTS question TEXT;

-- Create poll_options table
CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view all poll options
CREATE POLICY "Poll options are viewable by everyone" 
  ON public.poll_options 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to create poll options
CREATE POLICY "Users can create poll options for their polls" 
  ON public.poll_options 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE id = poll_options.poll_id AND user_id = auth.uid()
    )
  );

-- Allow users to update poll options for their polls
CREATE POLICY "Users can update poll options for their polls" 
  ON public.poll_options 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE id = poll_options.poll_id AND user_id = auth.uid()
    )
  );

-- Allow users to delete poll options for their polls
CREATE POLICY "Users can delete poll options for their polls" 
  ON public.poll_options 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.polls 
      WHERE id = poll_options.poll_id AND user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX poll_options_poll_id_idx ON public.poll_options (poll_id);
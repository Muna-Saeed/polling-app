-- Create a function to create a poll with options in a transaction
CREATE OR REPLACE FUNCTION create_poll_with_options(
  p_question TEXT,
  p_user_id UUID,
  p_options TEXT[]
) 
RETURNS TABLE (id UUID) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_poll_id UUID;
  v_option TEXT;
BEGIN
  -- Validate input
  IF p_question IS NULL OR p_question = '' THEN
    RAISE EXCEPTION 'Poll question is required';
  END IF;
  
  IF array_length(p_options, 1) IS NULL OR array_length(p_options, 1) < 2 THEN
    RAISE EXCEPTION 'At least 2 options are required';
  END IF;
  
  IF array_length(p_options, 1) > 10 THEN
    RAISE EXCEPTION 'Maximum 10 options are allowed';
  END IF;
  
  -- Start transaction
  BEGIN
    -- Insert the poll
    INSERT INTO polls (question, user_id)
    VALUES (p_question, p_user_id)
    RETURNING id INTO v_poll_id;
    
    -- Insert options
    FOREACH v_option IN ARRAY p_options
    LOOP
      IF v_option IS NULL OR v_option = '' THEN
        RAISE EXCEPTION 'Option cannot be empty';
      END IF;
      
      INSERT INTO poll_options (poll_id, text)
      VALUES (v_poll_id, v_option);
    END LOOP;
    
    -- Return the new poll ID
    RETURN QUERY SELECT v_poll_id;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback the transaction on any error
      RAISE EXCEPTION 'Failed to create poll: %', SQLERRM;
  END;
  
  RETURN;
END;
$$;

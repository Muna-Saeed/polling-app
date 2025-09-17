import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/middleware/rateLimit';
import { ValidationError } from '@/lib/errors';
import { createPoll } from '@/lib/services/polls';

// Rate limit configuration
const rateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
};

interface CreatePollRequest {
  title?: string;
  description?: string | null;
  question: string;
  options: string[];
}

/**
 * @swagger
 * /api/polls:
 *   post:
 *     summary: Create a new poll
 *     description: Creates a new poll with the provided question and options
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, options]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               question:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *               options:
 *                 type: array
 *                 minItems: 2
 *                 maxItems: 10
 *                 items:
 *                   type: string
 *                   minLength: 1
 *                   maxLength: 200
 *     responses:
 *       201:
 *         description: Poll created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
async function createPollHandler(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description, question, options } = await request.json() as CreatePollRequest;

    // Validate required fields
    if (!question?.trim() || !Array.isArray(options) || options.length < 2) {
      throw new ValidationError('Question and at least 2 options are required');
    }

    // Create the poll
    const pollId = await createPoll(
      title?.trim() || 'Untitled Poll',
      description?.trim() || null,
      question.trim(),
      options.map((opt: string) => opt.trim()),
      session.user.id
    );

    return NextResponse.json(
      { 
        id: pollId,
        message: 'Poll created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating poll:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: 'Failed to create poll' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the POST handler
export const POST = withRateLimit(createPollHandler, rateLimitOptions);
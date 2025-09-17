import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { submitVote } from '@/lib/services/polls'
import { requireSession } from '@/lib/services/auth'
import { responses } from '@/lib/utils/api'

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    const { pollId, optionId } = await request.json()
    
    if (!pollId || !optionId) {
      return responses.validationError('Poll ID and option ID are required')
    }

    const updatedPoll = await submitVote(pollId, optionId, session.user.id)
    return responses.success(updatedPoll)
    
  } catch (error) {
    console.error('Error in vote submission:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return responses.unauthorized()
      }
      if (error.message.includes('already voted')) {
        return responses.validationError(error.message)
      }
    }
    
    return responses.serverError(error)
  }
}

// Add OPTIONS handler for CORS preflight
// @ts-ignore - This is a valid route handler
export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

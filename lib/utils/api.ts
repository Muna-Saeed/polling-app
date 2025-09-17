import { NextResponse } from 'next/server'

type SuccessResponse<T> = {
  success: true
  data: T
}

type ErrorResponse = {
  success: false
  error: string
  code?: string
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } as SuccessResponse<T>, { status })
}

export function errorResponse(error: string | Error, status = 400, code?: string) {
  const errorMessage = typeof error === 'string' ? error : error.message
  return NextResponse.json(
    { success: false, error: errorMessage, code } as ErrorResponse,
    { status }
  )
}

export const responses = {
  success: <T>(data: T, status = 200) => successResponse(data, status),
  unauthorized: () => errorResponse('Unauthorized', 401, 'UNAUTHORIZED'),
  forbidden: () => errorResponse('Forbidden', 403, 'FORBIDDEN'),
  notFound: (resource = 'Resource') =>
    errorResponse(`${resource} not found`, 404, 'NOT_FOUND'),
  methodNotAllowed: () =>
    errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED'),
  serverError: (error: unknown) => {
    console.error('Server error:', error)
    return errorResponse(
      'An unexpected error occurred',
      500,
      'INTERNAL_SERVER_ERROR'
    )
  },
  validationError: (message: string) =>
    errorResponse(message, 400, 'VALIDATION_ERROR'),
  tooManyRequests: () =>
    errorResponse('Too many requests', 429, 'TOO_MANY_REQUESTS'),
}

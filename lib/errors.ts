export class PollError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PollError';
    // This ensures the error is properly captured in the stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PollError);
    }
  }
}

export class ValidationError extends PollError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends PollError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends PollError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends PollError {
  constructor(retryAfter?: number) {
    super('Too many requests', 'RATE_LIMIT_EXCEEDED', 429, {
      retryAfter,
    });
    this.name = 'RateLimitError';
  }
}

export function isPollError(error: unknown): error is PollError {
  return error instanceof PollError;
}

export function handleError(error: unknown): { status: number; code: string; message: string } {
  if (isPollError(error)) {
    return {
      status: error.statusCode,
      code: error.code,
      message: error.message,
    };
  }

  console.error('Unhandled error:', error);
  return {
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  };
}

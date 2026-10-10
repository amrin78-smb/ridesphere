import type { Hook } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import type { ErrorCode, ErrorEnvelope } from '@ridesphere/shared';
import { errorEnvelopeSchema } from '@ridesphere/shared';
import type { Context, ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { log } from './logger';
import type { AppBindings } from './types';

/** An expected failure with a stable code and a message that is safe to show to users. */
export class AppError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly code: ErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'AppError';
  }
}

export const ErrorEnvelopeSchema = z.object(errorEnvelopeSchema.shape).openapi('Error');

/** OpenAPI response entry for an error status. */
export function errorResponse(description: string) {
  return {
    description,
    content: { 'application/json': { schema: ErrorEnvelopeSchema } },
  };
}

function envelope(c: Context<AppBindings>, code: ErrorCode, message: string): ErrorEnvelope {
  return { error: { code, message, requestId: c.get('requestId') } };
}

export const validationHook: Hook<unknown, AppBindings, string, unknown> = (result, c) => {
  if (!result.success) {
    return c.json(envelope(c, 'VALIDATION_FAILED', 'The request is not valid.'), 400);
  }
};

export const handleNotFound: NotFoundHandler<AppBindings> = (c) =>
  c.json(envelope(c, 'NOT_FOUND', 'The requested resource was not found.'), 404);

export const handleError: ErrorHandler<AppBindings> = (err, c) => {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      log('error', 'request failed', {
        requestId: c.get('requestId'),
        code: err.code,
        cause: err.cause instanceof Error ? err.cause.message : undefined,
      });
    }
    return c.json(envelope(c, err.code, err.message), err.status);
  }
  if (err instanceof HTTPException && err.status < 500) {
    return c.json(
      envelope(c, 'VALIDATION_FAILED', 'The request could not be processed.'),
      err.status,
    );
  }
  // Unexpected: log the detail, return nothing internal to the client.
  log('error', 'unhandled error', {
    requestId: c.get('requestId'),
    name: err.name,
    detail: err.message,
  });
  return c.json(envelope(c, 'INTERNAL_ERROR', 'Something went wrong.'), 500);
};

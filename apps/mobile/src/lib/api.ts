import { errorEnvelopeSchema, type ErrorCode } from '@ridesphere/shared';
import type { z } from 'zod';

/** A failed API call. `kind` tells screens which state to show. */
export class ApiError extends Error {
  constructor(
    readonly kind: 'not-configured' | 'network' | 'http' | 'invalid-response',
    message: string,
    readonly details: { status?: number; code?: ErrorCode; requestId?: string } = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// EXPO_PUBLIC_* values are compiled into the app and are public. Never put a secret in one.
const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export const isApiConfigured = Boolean(baseUrl);

/** GETs a path under /api/v1 and validates the response against the shared contract. */
export async function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (!baseUrl) {
    throw new ApiError('not-configured', 'The app is not connected to a RideSphere server.');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1${path}`, {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('network', 'Could not reach RideSphere. Check your connection.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const envelope = errorEnvelopeSchema.safeParse(body);
    if (envelope.success) {
      const { code, message, requestId } = envelope.data.error;
      throw new ApiError('http', message, { status: response.status, code, requestId });
    }
    throw new ApiError('http', 'Something went wrong.', { status: response.status });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('invalid-response', 'RideSphere sent a response this app cannot read.');
  }
  return parsed.data;
}

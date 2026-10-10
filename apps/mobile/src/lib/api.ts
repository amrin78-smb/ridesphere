import { errorEnvelopeSchema, type ErrorCode } from '@ridesphere/shared';
import type { z } from 'zod';

import { authClient } from '@/lib/auth-client';
import { apiBaseUrl } from '@/lib/config';

export { isApiConfigured } from '@/lib/config';

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

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Send the member's session. Leave off for public endpoints. */
  authenticated?: boolean;
  signal?: AbortSignal | undefined;
};

/** Performs the request and returns the decoded body, or throws an ApiError. */
async function send(
  path: string,
  { method = 'GET', body, authenticated = false, signal }: RequestOptions,
): Promise<unknown> {
  if (!apiBaseUrl) {
    throw new ApiError('not-configured', 'The app is not connected to a RideSphere server.');
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (authenticated) {
    const cookie = await authClient.getCookie();
    if (cookie) headers.Cookie = cookie;
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
      method,
      headers,
      // The session travels in the explicit header above, not in the platform cookie jar.
      credentials: 'omit',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('network', 'Could not reach RideSphere. Check your connection.');
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const envelope = errorEnvelopeSchema.safeParse(payload);
    if (envelope.success) {
      const { code, message, requestId } = envelope.data.error;
      throw new ApiError('http', message, { status: response.status, code, requestId });
    }
    throw new ApiError('http', 'Something went wrong.', { status: response.status });
  }

  return payload;
}

/** Calls a path under /api/v1 and validates the response against the shared contract. */
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  const parsed = schema.safeParse(await send(path, options));
  if (!parsed.success) {
    throw new ApiError('invalid-response', 'RideSphere sent a response this app cannot read.');
  }
  return parsed.data;
}

/** Calls a path under /api/v1 that answers without a body. */
export async function apiCommand(path: string, options: RequestOptions): Promise<void> {
  await send(path, options);
}

export function apiGet<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  return apiRequest(path, schema, { signal });
}

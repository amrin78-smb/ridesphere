import { createMiddleware } from 'hono/factory';

import type { AppBindings } from './types';

/** Assigns a server-generated ID to every request. Client-supplied IDs are not trusted. */
export const requestId = createMiddleware<AppBindings>(async (c, next) => {
  const id = crypto.randomUUID();
  c.set('requestId', id);
  c.header('X-Request-Id', id);
  await next();
});

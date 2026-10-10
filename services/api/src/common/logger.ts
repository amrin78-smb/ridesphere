import { createMiddleware } from 'hono/factory';

import type { AppBindings } from './types';

type LogFields = Record<string, string | number | boolean | undefined>;

/** One JSON object per line. Pass only fields that are safe to store: no tokens, bodies or personal data. */
export function log(level: 'info' | 'warn' | 'error', message: string, fields: LogFields = {}) {
  console[level](JSON.stringify({ level, message, ...fields }));
}

/** Logs method, path and outcome. The query string is left out because it can carry personal data. */
export const requestLogger = createMiddleware<AppBindings>(async (c, next) => {
  const startedAt = Date.now();
  await next();
  log('info', 'request', {
    requestId: c.get('requestId'),
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - startedAt,
  });
});

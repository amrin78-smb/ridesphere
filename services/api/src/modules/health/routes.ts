import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { healthResponseSchema, readinessResponseSchema } from '@ridesphere/shared';
import { sql } from 'drizzle-orm';

import { AppError, errorResponse } from '../../common/errors';
import type { AppBindings } from '../../common/types';
import { withDb } from '../../db/client';

const HealthSchema = z.object(healthResponseSchema.shape).openapi('Health');
const ReadinessSchema = z.object(readinessResponseSchema.shape).openapi('Readiness');

const liveness = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Liveness: the Worker is running and configured',
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: HealthSchema } } },
    500: errorResponse('The service is misconfigured'),
  },
});

const readiness = createRoute({
  method: 'get',
  path: '/ready',
  tags: ['Health'],
  summary: 'Readiness: the Worker can reach the database',
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: ReadinessSchema } } },
    503: errorResponse('The database cannot be reached'),
  },
});

export const healthRoutes = new OpenAPIHono<AppBindings>()
  .openapi(liveness, (c) =>
    c.json({ status: 'ok' as const, environment: c.get('config').appEnv }, 200),
  )
  .openapi(readiness, async (c) => {
    try {
      await withDb(c.get('config'), (db) => db.execute(sql`select 1`));
    } catch (cause) {
      // The probe query cannot fail on its own, so any failure means the database is unreachable.
      throw new AppError(503, 'DATABASE_UNAVAILABLE', 'The service is temporarily unavailable.', {
        cause,
      });
    }
    return c.json({ status: 'ok' as const, database: 'ok' as const }, 200);
  });

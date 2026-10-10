import { OpenAPIHono } from '@hono/zod-openapi';
import { secureHeaders } from 'hono/secure-headers';

import { handleError, handleNotFound, validationHook } from './common/errors';
import { requestLogger } from './common/logger';
import { requestId } from './common/request-id';
import type { AppBindings } from './common/types';
import { createAuth } from './auth';
import { AUTH_BASE_PATH } from './auth/options';
import { configMiddleware } from './config/env';
import { dbMiddleware } from './db/middleware';
import { configRoutes } from './modules/config/routes';
import { healthRoutes } from './modules/health/routes';
import { meRoutes } from './modules/me/routes';
import { rideRoutes } from './modules/rides/routes';

function createRouter() {
  return new OpenAPIHono<AppBindings>({ defaultHook: validationHook });
}

export const app = createRouter();
app.use(requestId);
app.use(requestLogger);
app.use(secureHeaders());
app.use(configMiddleware);
// Not part of the API contract: a signpost for people who open the base URL in a browser.
app.get('/', (c) =>
  c.json({
    service: 'RideSphere API',
    environment: c.get('config').appEnv,
    health: '/api/v1/health',
    specification: '/api/v1/openapi.json',
  }),
);

app.route('/api/v1/health', healthRoutes);
app.route('/api/v1/config', configRoutes);

// Sign-up, sign-in, sign-out and sessions are served by Better Auth (ADR-0005).
app.use(`${AUTH_BASE_PATH}/*`, dbMiddleware);
app.on(['GET', 'POST'], `${AUTH_BASE_PATH}/*`, (c) =>
  createAuth(c.get('config'), c.get('db')).handler(c.req.raw),
);

app.use('/api/v1/rides', dbMiddleware);
app.use('/api/v1/rides/*', dbMiddleware);
app.route('/api/v1/rides', rideRoutes);

app.use('/api/v1/me', dbMiddleware);
app.use('/api/v1/me/*', dbMiddleware);
app.route('/api/v1/me', meRoutes);

app.openAPIRegistry.registerComponent('securitySchemes', 'session', {
  type: 'http',
  scheme: 'bearer',
  description: 'Better Auth session, sent by the mobile app as a session cookie.',
});
app.doc31('/api/v1/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'RideSphere API',
    version: '0.1.0',
    description: 'REST API for the RideSphere mobile app. All routes are versioned under /api/v1.',
  },
});
app.notFound(handleNotFound);
app.onError(handleError);

import { OpenAPIHono } from '@hono/zod-openapi';
import { secureHeaders } from 'hono/secure-headers';

import { handleError, handleNotFound, validationHook } from './common/errors';
import { requestLogger } from './common/logger';
import { requestId } from './common/request-id';
import type { AppBindings } from './common/types';
import { configMiddleware } from './config/env';
import { healthRoutes } from './modules/health/routes';

function createRouter() {
  return new OpenAPIHono<AppBindings>({ defaultHook: validationHook });
}

export const app = createRouter();
app.use(requestId);
app.use(requestLogger);
app.use(secureHeaders());
app.use(configMiddleware);
app.route('/api/v1/health', healthRoutes);
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

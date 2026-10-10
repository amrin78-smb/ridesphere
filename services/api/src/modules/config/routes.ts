import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { publicConfigSchema } from '@ridesphere/shared';

import type { AppBindings } from '../../common/types';

const PublicConfigSchema = z.object(publicConfigSchema.shape).openapi('PublicConfig');

const getConfig = createRoute({
  method: 'get',
  path: '/',
  tags: ['Config'],
  summary: 'Which sign-in methods this environment offers',
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: PublicConfigSchema } } },
  },
});

// Booleans only. Nothing from the credentials themselves is ever returned.
export const configRoutes = new OpenAPIHono<AppBindings>().openapi(getConfig, (c) =>
  c.json({ auth: { google: c.get('config').auth.google !== undefined } }, 200),
);

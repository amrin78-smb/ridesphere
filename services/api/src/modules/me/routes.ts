import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { meResponseSchema, updateMeRequestSchema } from '@ridesphere/shared';
import { eq } from 'drizzle-orm';

import { requireUser } from '../../auth/require-user';
import { errorResponse, validationHook } from '../../common/errors';
import type { AppBindings, CurrentUser } from '../../common/types';
import { profiles } from '../../db/schema';

const MeSchema = z.object(meResponseSchema.shape).openapi('Me');
const UpdateMeSchema = z.strictObject(updateMeRequestSchema.shape).openapi('UpdateMe');

const security = [{ session: [] }];

const getMe = createRoute({
  method: 'get',
  path: '/',
  tags: ['Me'],
  summary: 'The signed-in member and their profile',
  security,
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: MeSchema } } },
    401: errorResponse('Not signed in'),
    403: errorResponse('The account is suspended or deleted'),
  },
});

const updateMe = createRoute({
  method: 'patch',
  path: '/',
  tags: ['Me'],
  summary: 'Update your own profile',
  security,
  request: {
    body: { required: true, content: { 'application/json': { schema: UpdateMeSchema } } },
  },
  responses: {
    200: { description: 'OK', content: { 'application/json': { schema: MeSchema } } },
    400: errorResponse('The request is not valid'),
    401: errorResponse('Not signed in'),
    403: errorResponse('The account is suspended or deleted'),
  },
});

// Explicit mapping: database rows are never returned as they are, and account status
// stays internal.
function toMe(user: CurrentUser) {
  const { profile } = user;
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    profile: {
      displayName: profile.displayName,
      homeArea: profile.homeArea,
      locale: profile.locale,
      visibility: profile.visibility,
      role: profile.role,
    },
  };
}

export const meRoutes = new OpenAPIHono<AppBindings>({ defaultHook: validationHook });
meRoutes.use(requireUser);
meRoutes.openapi(getMe, (c) => c.json(toMe(c.get('user')), 200));
meRoutes.openapi(updateMe, async (c) => {
  const user = c.get('user');
  const changes = c.req.valid('json');
  if (Object.keys(changes).length === 0) return c.json(toMe(user), 200);
  const [profile] = await c
    .get('db')
    .update(profiles)
    .set(changes)
    .where(eq(profiles.userId, user.id))
    .returning();
  if (!profile) throw new Error('profile disappeared during update');
  return c.json(toMe({ ...user, profile }), 200);
});

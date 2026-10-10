import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  type BikeType,
  distanceRangeRule,
  emptyPreferences,
  meResponseSchema,
  type Preferences,
  preferencesSchema,
  type RidingStyle,
  type SpokenLanguage,
  updateMeRequestSchema,
} from '@ridesphere/shared';
import { eq } from 'drizzle-orm';

import { requireUser } from '../../auth/require-user';
import { errorResponse, validationHook } from '../../common/errors';
import { log } from '../../common/logger';
import type { AppBindings, CurrentUser } from '../../common/types';
import type { Database } from '../../db/client';
import { profiles, user as authUser, userPreferences, verification } from '../../db/schema';

const PreferencesSchema = z.object(preferencesSchema.shape).openapi('Preferences');
const MeSchema = z
  .object({ ...meResponseSchema.shape, preferences: PreferencesSchema })
  .openapi('Me');
const UpdateMeSchema = z.strictObject(updateMeRequestSchema.shape).openapi('UpdateMe');
// Rebuilt from the shared shape with this package's OpenAPI-aware zod.
const UpdatePreferencesSchema = z
  .strictObject(preferencesSchema.shape)
  .refine(distanceRangeRule.check, distanceRangeRule.params)
  .openapi('UpdatePreferences');
const DeleteMeSchema = z
  .strictObject({ confirm: z.literal('DELETE') })
  .openapi('DeleteMe', { description: 'Send {"confirm":"DELETE"} to confirm.' });

const security = [{ session: [] }];
const authErrors = {
  401: errorResponse('Not signed in'),
  403: errorResponse('The account is suspended or deleted'),
};
const meOk = { description: 'OK', content: { 'application/json': { schema: MeSchema } } };

const getMe = createRoute({
  method: 'get',
  path: '/',
  tags: ['Me'],
  summary: 'The signed-in member, their profile and riding preferences',
  security,
  responses: { 200: meOk, ...authErrors },
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
  responses: { 200: meOk, 400: errorResponse('The request is not valid'), ...authErrors },
});

const updatePreferences = createRoute({
  method: 'put',
  path: '/preferences',
  tags: ['Me'],
  summary: 'Replace your riding preferences',
  security,
  request: {
    body: { required: true, content: { 'application/json': { schema: UpdatePreferencesSchema } } },
  },
  responses: { 200: meOk, 400: errorResponse('The request is not valid'), ...authErrors },
});

const deleteMe = createRoute({
  method: 'delete',
  path: '/',
  tags: ['Me'],
  summary: 'Permanently delete your account and everything stored about you',
  security,
  request: {
    body: { required: true, content: { 'application/json': { schema: DeleteMeSchema } } },
  },
  responses: {
    204: { description: 'The account has been deleted' },
    400: errorResponse('The confirmation is missing'),
    ...authErrors,
  },
});

async function loadPreferences(db: Database, userId: string): Promise<Preferences> {
  const [row] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  if (!row) return emptyPreferences;
  return {
    // Stored as text[]; values were validated against the allowed lists when written.
    bikeTypes: row.bikeTypes as BikeType[],
    ridingStyles: row.ridingStyles as RidingStyle[],
    languages: row.languages as SpokenLanguage[],
    pace: row.pace,
    experience: row.experience,
    distanceMinKm: row.distanceMinKm,
    distanceMaxKm: row.distanceMaxKm,
  };
}

// Explicit mapping: database rows are never returned as they are, and account status
// stays internal.
function toMe(user: CurrentUser, preferences: Preferences) {
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
    preferences,
  };
}

export const meRoutes = new OpenAPIHono<AppBindings>({ defaultHook: validationHook });
meRoutes.use(requireUser);

meRoutes.openapi(getMe, async (c) => {
  const user = c.get('user');
  return c.json(toMe(user, await loadPreferences(c.get('db'), user.id)), 200);
});

meRoutes.openapi(updateMe, async (c) => {
  const user = c.get('user');
  const db = c.get('db');
  const changes = c.req.valid('json');
  let profile = user.profile;
  if (Object.keys(changes).length > 0) {
    const [updated] = await db
      .update(profiles)
      .set(changes)
      .where(eq(profiles.userId, user.id))
      .returning();
    if (!updated) throw new Error('profile disappeared during update');
    profile = updated;
  }
  return c.json(toMe({ ...user, profile }, await loadPreferences(db, user.id)), 200);
});

meRoutes.openapi(updatePreferences, async (c) => {
  const user = c.get('user');
  const preferences = c.req.valid('json');
  await c
    .get('db')
    .insert(userPreferences)
    .values({ userId: user.id, ...preferences })
    .onConflictDoUpdate({ target: userPreferences.userId, set: preferences });
  return c.json(toMe(user, preferences), 200);
});

meRoutes.openapi(deleteMe, async (c) => {
  const user = c.get('user');
  // Everything keyed to the member (sessions, credentials, linked sign-ins, profile,
  // preferences) is removed by the foreign keys' ON DELETE CASCADE. Tables added later
  // must either cascade too or be handled here, and docs/privacy/data-inventory.md updated.
  await c.get('db').transaction(async (tx) => {
    await tx.delete(verification).where(eq(verification.identifier, user.email));
    await tx.delete(authUser).where(eq(authUser.id, user.id));
  });
  log('info', 'account deleted', { requestId: c.get('requestId') });
  return c.body(null, 204);
});

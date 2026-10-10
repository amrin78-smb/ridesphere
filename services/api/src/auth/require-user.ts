import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';

import { AppError } from '../common/errors';
import type { AppBindings } from '../common/types';
import type { Database } from '../db/client';
import { profiles } from '../db/schema';
import { createAuth } from './index';

async function loadProfile(db: Database, userId: string, name: string) {
  const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (existing) return existing;
  // First authenticated request after sign-up. The insert is idempotent so that two
  // concurrent first requests cannot fail on the primary key.
  await db
    .insert(profiles)
    .values({ userId, displayName: name.trim().slice(0, 60) || 'Rider' })
    .onConflictDoNothing();
  const [created] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (!created) throw new Error('profile could not be created');
  return created;
}

/**
 * Requires a valid session and an active account. Must run after `dbMiddleware`.
 * A valid session is not enough: suspended and deleted accounts are refused here, so a
 * moderation action takes effect on the member's next request.
 */
export const requireUser = createMiddleware<AppBindings>(async (c, next) => {
  const db = c.get('db');
  const session = await createAuth(c.get('config'), db).api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  }
  const profile = await loadProfile(db, session.user.id, session.user.name);
  if (profile.status !== 'active') {
    throw new AppError(403, 'ACCOUNT_RESTRICTED', 'This account cannot be used right now.');
  }
  c.set('user', {
    id: session.user.id,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    profile,
  });
  await next();
});

import { eq } from 'drizzle-orm';
import { createMiddleware } from 'hono/factory';

import type { AppBindings } from '../common/types';
import { profiles } from '../db/schema';
import { createAuth } from './index';

/**
 * For endpoints that work signed out but show more to members. Sets `c.get('viewer')` to
 * the signed-in, active member, or leaves it undefined. Never rejects: an invalid session
 * or a restricted account is simply treated as a visitor. Must run after `dbMiddleware`.
 */
export const optionalUser = createMiddleware<AppBindings>(async (c, next) => {
  // Visitors send no session, so skip the lookups entirely.
  if (c.req.header('cookie')) {
    const db = c.get('db');
    const session = await createAuth(c.get('config'), db).api.getSession({
      headers: c.req.raw.headers,
    });
    if (session) {
      const [profile] = await db
        .select({ status: profiles.status })
        .from(profiles)
        .where(eq(profiles.userId, session.user.id));
      // No profile row yet means a brand-new member who has not called /me: still a member.
      if (!profile || profile.status === 'active') c.set('viewer', { id: session.user.id });
    }
  }
  await next();
});

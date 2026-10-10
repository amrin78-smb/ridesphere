import { createMiddleware } from 'hono/factory';

import type { AppBindings } from '../common/types';
import { withDb } from './client';

/** Gives every handler below it `c.get('db')`: one client for the whole request. */
export const dbMiddleware = createMiddleware<AppBindings>((c, next) =>
  withDb(c.get('config'), async (db) => {
    c.set('db', db);
    await next();
  }),
);

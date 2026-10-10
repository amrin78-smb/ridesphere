import type { AppConfig } from '../config/env';
import type { Database } from '../db/client';
import type { profiles } from '../db/schema';

export type CurrentUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: typeof profiles.$inferSelect;
};

export type AppBindings = {
  Bindings: Env;
  Variables: {
    requestId: string;
    config: AppConfig;
    /** Set by `dbMiddleware`. */
    db: Database;
    /** Set by `requireUser`. */
    user: CurrentUser;
    /** Set by `optionalUser` when the request comes from a signed-in, active member. */
    viewer?: { id: string };
  };
};

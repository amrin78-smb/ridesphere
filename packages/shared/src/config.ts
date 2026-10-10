import { z } from 'zod';

/** Public, unauthenticated facts the app needs before anyone signs in. */
export const publicConfigSchema = z.object({
  auth: z.object({
    google: z.boolean(),
  }),
});
export type PublicConfig = z.infer<typeof publicConfigSchema>;

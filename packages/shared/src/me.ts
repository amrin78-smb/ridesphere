import { z } from 'zod';

export const profileVisibilitySchema = z.enum(['public', 'members', 'private']);
export type ProfileVisibility = z.infer<typeof profileVisibilitySchema>;

export const memberRoleSchema = z.enum(['member', 'moderator', 'admin']);
export type MemberRole = z.infer<typeof memberRoleSchema>;

export const supportedLocales = ['en', 'th'] as const;

export const meResponseSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  emailVerified: z.boolean(),
  profile: z.object({
    displayName: z.string(),
    homeArea: z.string().nullable(),
    locale: z.string(),
    visibility: profileVisibilitySchema,
    role: memberRoleSchema,
  }),
});
export type MeResponse = z.infer<typeof meResponseSchema>;

/** What a member may change about themselves. Role and account status are deliberately absent. */
export const updateMeRequestSchema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  homeArea: z.string().trim().min(2).max(80).nullable().optional(),
  locale: z.enum(supportedLocales).optional(),
  visibility: profileVisibilitySchema.optional(),
});
export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>;

/** Sign-up and sign-in form rules, mirrored by the server's Better Auth configuration. */
export const credentialsSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z
    .string()
    .min(10, 'Use at least 10 characters.')
    .max(128, 'Use at most 128 characters.'),
});
export const signUpSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, 'Enter your name.').max(60, 'Use at most 60 characters.'),
});

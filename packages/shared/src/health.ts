import { z } from 'zod';

export const appEnvSchema = z.enum(['local', 'preview', 'staging', 'production']);
export type AppEnv = z.infer<typeof appEnvSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  environment: appEnvSchema,
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const readinessResponseSchema = z.object({
  status: z.literal('ok'),
  database: z.literal('ok'),
});
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;

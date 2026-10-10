import { z } from 'zod';

/** Stable, machine-readable error codes. Add to this list; never rename a published code. */
export const errorCodes = [
  'VALIDATION_FAILED',
  'NOT_FOUND',
  'INTERNAL_ERROR',
  'SERVICE_MISCONFIGURED',
  'DATABASE_UNAVAILABLE',
] as const;

export const errorCodeSchema = z.enum(errorCodes);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    requestId: z.string(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

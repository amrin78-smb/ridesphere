import { z } from 'zod';

import { bikeTypes, paces } from './preferences';

// Add to the end of a list; never rename or remove a published value.
export const terrains = ['road', 'gravel', 'trail', 'mixed'] as const;
export const difficulties = ['easy', 'moderate', 'hard', 'expert'] as const;
/** Who can find and open a ride. */
export const rideVisibilities = ['public', 'members', 'private'] as const;
/** Who is told exactly where to meet. `participants` means people who have joined the ride. */
export const meetingDetailVisibilities = ['public', 'members', 'participants'] as const;

export type Terrain = (typeof terrains)[number];
export type Difficulty = (typeof difficulties)[number];
export type RideVisibility = (typeof rideVisibilities)[number];
export type MeetingDetailVisibility = (typeof meetingDetailVisibilities)[number];

export const RIDE_PAGE_SIZE_DEFAULT = 20;
export const RIDE_PAGE_SIZE_MAX = 50;

const kilometres = z.coerce.number().int().min(1).max(1000);

/** Query string of GET /rides. Every filter is optional; unknown parameters are rejected. */
export const rideListQuerySchema = z.strictObject({
  q: z.string().trim().min(2).max(60).optional(),
  area: z.string().trim().min(2).max(80).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  bikeType: z.enum(bikeTypes).optional(),
  terrain: z.enum(terrains).optional(),
  pace: z.enum(paces).optional(),
  difficulty: z.enum(difficulties).optional(),
  minDistanceKm: kilometres.optional(),
  maxDistanceKm: kilometres.optional(),
  maxElevationM: z.coerce.number().int().min(0).max(20000).optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(RIDE_PAGE_SIZE_MAX).optional(),
});
export type RideListQuery = z.infer<typeof rideListQuerySchema>;

export const rideSummarySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  /** UTC instant. Show it in `timezone`, the ride's own IANA zone, not the device's. */
  startsAt: z.iso.datetime(),
  timezone: z.string(),
  area: z.string(),
  bikeTypes: z.array(z.enum(bikeTypes)),
  terrain: z.enum(terrains),
  pace: z.enum(paces),
  difficulty: z.enum(difficulties),
  distanceKm: z.number(),
  elevationM: z.number().int().nullable(),
  capacity: z.number().int().nullable(),
  club: z.object({ slug: z.string(), name: z.string() }).nullable(),
  /** True for synthetic demonstration rides. Clients must label them. */
  isSample: z.boolean(),
});
export type RideSummary = z.infer<typeof rideSummarySchema>;

export const rideListResponseSchema = z.object({
  items: z.array(rideSummarySchema),
  /** Pass back as `cursor` for the next page. Null on the last page. */
  nextCursor: z.string().nullable(),
});
export type RideListResponse = z.infer<typeof rideListResponseSchema>;

export const rideDetailSchema = rideSummarySchema.extend({
  description: z.string(),
  endsAt: z.iso.datetime().nullable(),
  requirements: z.string(),
  cancellationPolicy: z.string(),
  visibility: z.enum(rideVisibilities),
  organiser: z.object({ displayName: z.string() }).nullable(),
  meetingPoint: z.object({
    /** A general description that is safe to show to anyone who can see the ride. */
    name: z.string(),
    /** Exact instructions, or null when the viewer is not yet allowed to see them. */
    details: z.string().nullable(),
    detailsVisibleTo: z.enum(meetingDetailVisibilities),
  }),
});
export type RideDetail = z.infer<typeof rideDetailSchema>;

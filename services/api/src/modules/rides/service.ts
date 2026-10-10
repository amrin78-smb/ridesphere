import {
  type BikeType,
  RIDE_PAGE_SIZE_DEFAULT,
  type RideDetail,
  type RideListQuery,
  type RideListResponse,
  type RideSummary,
} from '@ridesphere/shared';
import { and, asc, eq, gte, ilike, inArray, lte, or, type SQL, sql } from 'drizzle-orm';

import type { Database } from '../../db/client';
import { clubs, profiles, rides } from '../../db/schema';
import { decodeCursor, encodeCursor } from './cursor';
import { canSeeMeetingDetails, canViewRide, listableVisibilities, type Viewer } from './policy';

const summaryColumns = {
  id: rides.id,
  title: rides.title,
  startsAt: rides.startsAt,
  timezone: rides.timezone,
  area: rides.area,
  bikeTypes: rides.bikeTypes,
  terrain: rides.terrain,
  pace: rides.pace,
  difficulty: rides.difficulty,
  distanceM: rides.distanceM,
  elevationM: rides.elevationM,
  capacity: rides.capacity,
  isSample: rides.isSample,
  clubSlug: clubs.slug,
  clubName: clubs.name,
};

type SummaryRow = {
  id: string;
  title: string;
  startsAt: Date;
  timezone: string;
  area: string;
  bikeTypes: string[];
  terrain: RideSummary['terrain'];
  pace: RideSummary['pace'];
  difficulty: RideSummary['difficulty'];
  distanceM: number;
  elevationM: number | null;
  capacity: number | null;
  isSample: boolean;
  // From a left join: null when the ride has no club.
  clubSlug: string | null;
  clubName: string | null;
};

function toSummary(row: SummaryRow): RideSummary {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    timezone: row.timezone,
    area: row.area,
    // Stored as text[]; values are validated against the allowed list when a ride is written.
    bikeTypes: row.bikeTypes as BikeType[],
    terrain: row.terrain,
    pace: row.pace,
    difficulty: row.difficulty,
    distanceKm: Math.round(row.distanceM / 100) / 10,
    elevationM: row.elevationM,
    capacity: row.capacity,
    club: row.clubSlug && row.clubName ? { slug: row.clubSlug, name: row.clubName } : null,
    isSample: row.isSample,
  };
}

/** Escapes the characters that have a meaning in a LIKE pattern. */
const likePattern = (text: string) => `%${text.replace(/[\\%_]/g, '\\$&')}%`;

/**
 * Upcoming, published rides the viewer may discover, soonest first.
 * `now` is a parameter so the "upcoming" boundary can be tested.
 */
export async function listRides(
  db: Database,
  query: RideListQuery,
  viewer: Viewer,
  now: Date = new Date(),
): Promise<RideListResponse> {
  const limit = query.limit ?? RIDE_PAGE_SIZE_DEFAULT;
  const from = query.from ? new Date(query.from) : now;

  const filters: (SQL | undefined)[] = [
    eq(rides.status, 'published'),
    inArray(rides.visibility, listableVisibilities(viewer)),
    // Never list rides that have already started, whatever `from` says.
    gte(rides.startsAt, from > now ? from : now),
    query.to ? lte(rides.startsAt, new Date(query.to)) : undefined,
    query.area ? ilike(rides.area, likePattern(query.area)) : undefined,
    query.q
      ? or(
          ilike(rides.title, likePattern(query.q)),
          ilike(rides.description, likePattern(query.q)),
          ilike(rides.area, likePattern(query.q)),
        )
      : undefined,
    query.bikeType ? sql`${query.bikeType} = any(${rides.bikeTypes})` : undefined,
    query.terrain ? eq(rides.terrain, query.terrain) : undefined,
    query.pace ? eq(rides.pace, query.pace) : undefined,
    query.difficulty ? eq(rides.difficulty, query.difficulty) : undefined,
    query.minDistanceKm ? gte(rides.distanceM, query.minDistanceKm * 1000) : undefined,
    query.maxDistanceKm ? lte(rides.distanceM, query.maxDistanceKm * 1000) : undefined,
    query.maxElevationM !== undefined
      ? or(sql`${rides.elevationM} is null`, lte(rides.elevationM, query.maxElevationM))
      : undefined,
  ];

  if (query.cursor) {
    const cursor = decodeCursor(query.cursor);
    filters.push(
      sql`(${rides.startsAt}, ${rides.id}) > (${cursor.startsAt.toISOString()}::timestamptz, ${cursor.id}::uuid)`,
    );
  }

  // One more than asked for, to learn whether another page exists without a count query.
  const rows = await db
    .select(summaryColumns)
    .from(rides)
    .leftJoin(clubs, eq(rides.clubId, clubs.id))
    .where(and(...filters))
    .orderBy(asc(rides.startsAt), asc(rides.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    items: page.map(toSummary),
    nextCursor: rows.length > limit && last ? encodeCursor(last) : null,
  };
}

/** One ride, or null when it does not exist or the viewer may not see it. */
export async function getRide(
  db: Database,
  id: string,
  viewer: Viewer,
): Promise<RideDetail | null> {
  const [row] = await db
    .select({
      ...summaryColumns,
      description: rides.description,
      endsAt: rides.endsAt,
      requirements: rides.requirements,
      cancellationPolicy: rides.cancellationPolicy,
      visibility: rides.visibility,
      status: rides.status,
      organiserId: rides.organiserId,
      organiserName: profiles.displayName,
      meetingPointName: rides.meetingPointName,
      meetingPointDetails: rides.meetingPointDetails,
      meetingDetailsVisibleTo: rides.meetingDetailsVisibleTo,
    })
    .from(rides)
    .leftJoin(clubs, eq(rides.clubId, clubs.id))
    .leftJoin(profiles, eq(rides.organiserId, profiles.userId))
    .where(eq(rides.id, id));

  // The same answer for "does not exist" and "not yours to see", so that a ride's
  // existence is not revealed.
  if (!row || !canViewRide(row, viewer)) return null;

  return {
    ...toSummary(row),
    description: row.description,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    requirements: row.requirements,
    cancellationPolicy: row.cancellationPolicy,
    visibility: row.visibility,
    organiser: row.organiserName ? { displayName: row.organiserName } : null,
    meetingPoint: {
      name: row.meetingPointName,
      details: canSeeMeetingDetails(row, viewer) ? row.meetingPointDetails : null,
      detailsVisibleTo: row.meetingDetailsVisibleTo,
    },
  };
}

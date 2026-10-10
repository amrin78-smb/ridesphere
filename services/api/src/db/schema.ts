import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth-schema';

export * from './auth-schema';

// Conventions: UUID primary keys, UTC timestamps (timestamptz), explicit status enums,
// created_at/updated_at on every table.

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
};

export const memberRole = pgEnum('member_role', ['member', 'moderator', 'admin']);
export const accountStatus = pgEnum('account_status', ['active', 'suspended', 'deleted']);
export const profileVisibility = pgEnum('profile_visibility', ['public', 'members', 'private']);

/**
 * RideSphere's own record for a signed-in person. Identity (email, credentials, sessions)
 * lives in the Better Auth tables; platform role and account status live here and can
 * only be changed by admin operations, never by the member.
 */
export const profiles = pgTable('profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  // A broad, member-chosen area such as a city or district. Never an address.
  homeArea: text('home_area'),
  locale: text('locale').notNull().default('en'),
  visibility: profileVisibility('visibility').notNull().default('members'),
  role: memberRole('role').notNull().default('member'),
  status: accountStatus('status').notNull().default('active'),
  ...timestamps,
});

export const ridingPace = pgEnum('riding_pace', ['relaxed', 'steady', 'brisk', 'fast']);
export const experienceLevel = pgEnum('experience_level', [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]);

/**
 * Riding preferences, one row per member, created the first time they save any.
 * List values are validated against the shared allowed values by the API; the checks here
 * keep the numbers sane even if something writes around the API.
 */
export const userPreferences = pgTable(
  'user_preferences',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    bikeTypes: text('bike_types')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    ridingStyles: text('riding_styles')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    languages: text('languages')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    pace: ridingPace('pace'),
    experience: experienceLevel('experience'),
    distanceMinKm: integer('distance_min_km'),
    distanceMaxKm: integer('distance_max_km'),
    ...timestamps,
  },
  (table) => [
    check(
      'user_preferences_distance_range',
      sql`(${table.distanceMinKm} is null or ${table.distanceMinKm} between 1 and 400)
        and (${table.distanceMaxKm} is null or ${table.distanceMaxKm} between 1 and 400)
        and (${table.distanceMinKm} is null or ${table.distanceMaxKm} is null
          or ${table.distanceMinKm} <= ${table.distanceMaxKm})`,
    ),
  ],
);

export const clubStatus = pgEnum('club_status', ['pending', 'active', 'suspended', 'archived']);

export const clubs = pgTable('clubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  region: text('region').notNull(),
  status: clubStatus('status').notNull().default('pending'),
  // Synthetic demonstration data, never real. Lets it be labelled and removed safely.
  isSample: boolean('is_sample').notNull().default(false),
  ...timestamps,
});

export const rideStatus = pgEnum('ride_status', ['draft', 'published', 'cancelled', 'completed']);
export const rideVisibility = pgEnum('ride_visibility', ['public', 'members', 'private']);
export const rideTerrain = pgEnum('ride_terrain', ['road', 'gravel', 'trail', 'mixed']);
export const rideDifficulty = pgEnum('ride_difficulty', ['easy', 'moderate', 'hard', 'expert']);
export const meetingDetailVisibility = pgEnum('meeting_detail_visibility', [
  'public',
  'members',
  'participants',
]);

export const rides = pgTable(
  'rides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clubId: uuid('club_id').references(() => clubs.id, { onDelete: 'set null' }),
    // Kept when the organiser deletes their account, so a published ride does not vanish
    // for the people planning to attend. Revisit with the retention policy (open decision 13).
    organiserId: uuid('organiser_id').references(() => user.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    // An instant in UTC plus the ride's own IANA zone: "07:00 in Bangkok" must stay
    // 07:00 in Bangkok whatever the viewer's device says.
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    timezone: text('timezone').notNull(),
    // A broad area such as a city or district, used for discovery.
    area: text('area').notNull(),
    bikeTypes: text('bike_types')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    terrain: rideTerrain('terrain').notNull(),
    pace: ridingPace('pace').notNull(),
    difficulty: rideDifficulty('difficulty').notNull(),
    distanceM: integer('distance_m').notNull(),
    elevationM: integer('elevation_m'),
    capacity: integer('capacity'),
    requirements: text('requirements').notNull().default(''),
    cancellationPolicy: text('cancellation_policy').notNull().default(''),
    // Safe to show to anyone who can see the ride, for example "Lumphini Park, east side".
    meetingPointName: text('meeting_point_name').notNull(),
    // Exact instructions. Only returned to viewers allowed by meetingDetailsVisibleTo.
    meetingPointDetails: text('meeting_point_details').notNull().default(''),
    meetingDetailsVisibleTo: meetingDetailVisibility('meeting_details_visible_to')
      .notNull()
      .default('members'),
    visibility: rideVisibility('visibility').notNull().default('public'),
    status: rideStatus('status').notNull().default('draft'),
    isSample: boolean('is_sample').notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index('rides_discovery_idx').on(table.status, table.startsAt, table.id),
    check('rides_distance_positive', sql`${table.distanceM} > 0`),
    check(
      'rides_elevation_not_negative',
      sql`${table.elevationM} is null or ${table.elevationM} >= 0`,
    ),
    check('rides_capacity_positive', sql`${table.capacity} is null or ${table.capacity} > 0`),
    check(
      'rides_ends_after_start',
      sql`${table.endsAt} is null or ${table.endsAt} > ${table.startsAt}`,
    ),
  ],
);

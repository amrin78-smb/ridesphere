import { sql } from 'drizzle-orm';
import { check, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
  ...timestamps,
});

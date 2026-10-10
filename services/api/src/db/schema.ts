import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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

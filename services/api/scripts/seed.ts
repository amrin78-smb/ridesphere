// Fills a NON-PRODUCTION database with synthetic rides for development and demos.
//
//   pnpm db:seed --confirm-not-production            add or refresh the sample data
//   pnpm db:seed --confirm-not-production --remove   remove it again
//
// Everything written here is marked is_sample = true, and the script only ever deletes
// rows with that mark, so it cannot touch real data. Nothing here describes a real club,
// ride, person or place of residence.
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { clubs, rides } from '../src/db/schema';

try {
  process.loadEnvFile('.env');
} catch {
  // No .env file: rely on the process environment.
}

const args = new Set(process.argv.slice(2));
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');
if (!args.has('--confirm-not-production')) {
  throw new Error('Refusing to run without --confirm-not-production. Never seed production.');
}

const BANGKOK = 'Asia/Bangkok';
const DAY = 24 * 60 * 60 * 1000;

/** `daysAhead` days from today at the given Bangkok local time (UTC+7, no daylight saving). */
function bangkok(daysAhead: number, hour: number, minute = 0): Date {
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour - 7, minute) +
      daysAhead * DAY,
  );
}

type SampleRide = Omit<typeof rides.$inferInsert, 'timezone' | 'status' | 'isSample'>;

const sampleRides = (clubId: string): SampleRide[] => [
  {
    clubId,
    title: 'Sunrise laps at the park',
    description: 'Easy social laps on closed park roads. Regroup every lap, nobody gets dropped.',
    startsAt: bangkok(2, 6, 0),
    endsAt: bangkok(2, 8, 0),
    area: 'Bangkok',
    bikeTypes: ['road', 'hybrid', 'folding'],
    terrain: 'road',
    pace: 'relaxed',
    difficulty: 'easy',
    distanceM: 25_000,
    elevationM: 40,
    capacity: 30,
    requirements: 'Helmet, front and rear lights.',
    cancellationPolicy: 'Cancelled if it is raining at the start time.',
    meetingPointName: 'Central park, main gate',
    meetingPointDetails: 'By the bicycle rental kiosk just inside the main gate, 05:45.',
    meetingDetailsVisibleTo: 'public',
    visibility: 'public',
  },
  {
    clubId,
    title: 'Riverside gravel explorer',
    description: 'Canal paths and orchard tracks west of the river. Expect dust, dogs and coffee.',
    startsAt: bangkok(4, 6, 30),
    area: 'Bangkok',
    bikeTypes: ['gravel', 'mountain'],
    terrain: 'gravel',
    pace: 'steady',
    difficulty: 'moderate',
    distanceM: 62_000,
    elevationM: 120,
    capacity: 16,
    requirements: 'Tyres 35 mm or wider, two bottles, spare tube.',
    cancellationPolicy: 'Goes ahead in light rain. Organiser decides by 05:30.',
    meetingPointName: 'West bank ferry pier',
    meetingPointDetails: 'Coffee cart beside the pier ticket booth, wheels rolling 06:30 sharp.',
    meetingDetailsVisibleTo: 'members',
    visibility: 'public',
  },
  {
    clubId,
    title: 'Airport loop tempo',
    description: 'Fast, steady rotations on the cycle track. Know how to ride in a group.',
    startsAt: bangkok(5, 18, 30),
    area: 'Samut Prakan',
    bikeTypes: ['road'],
    terrain: 'road',
    pace: 'fast',
    difficulty: 'hard',
    distanceM: 70_000,
    elevationM: 30,
    capacity: 20,
    requirements: 'Road bike in good order, helmet, lights. No aero bars in the group.',
    cancellationPolicy: 'Cancelled for thunderstorms.',
    meetingPointName: 'Cycle track, main car park',
    meetingPointDetails: 'Row C of the car park, next to the track entrance.',
    meetingDetailsVisibleTo: 'members',
    visibility: 'public',
  },
  {
    clubId: null,
    title: 'Old city temples by folding bike',
    description: 'A slow tour of quiet lanes and temple courtyards with plenty of photo stops.',
    startsAt: bangkok(7, 7, 0),
    area: 'Chiang Mai',
    bikeTypes: ['folding', 'hybrid', 'ebike'],
    terrain: 'road',
    pace: 'relaxed',
    difficulty: 'easy',
    distanceM: 18_000,
    elevationM: 20,
    capacity: 12,
    requirements: 'Any bike in working order. Shoulders and knees covered for temple stops.',
    cancellationPolicy: 'Moved to the following week in heavy rain.',
    meetingPointName: 'Old city, east gate plaza',
    meetingPointDetails: 'Under the big tree on the north side of the plaza.',
    meetingDetailsVisibleTo: 'public',
    visibility: 'public',
  },
  {
    clubId: null,
    title: 'Mountain temple climb',
    description: 'The classic climb, ridden steadily. Regroup at the top, descend carefully.',
    startsAt: bangkok(9, 6, 0),
    area: 'Chiang Mai',
    bikeTypes: ['road', 'gravel'],
    terrain: 'road',
    pace: 'brisk',
    difficulty: 'hard',
    distanceM: 48_000,
    elevationM: 1_150,
    capacity: 15,
    requirements: 'Working brakes, low gears, a wind jacket for the descent.',
    cancellationPolicy: 'Cancelled if the road is wet.',
    meetingPointName: 'University front gate',
    meetingPointDetails: 'Convenience store opposite the front gate.',
    meetingDetailsVisibleTo: 'members',
    visibility: 'public',
  },
  {
    clubId: null,
    title: 'Forest singletrack morning',
    description: 'Flowing trails with a few rooty sections. Intermediate mountain bikers.',
    startsAt: bangkok(11, 7, 30),
    area: 'Chiang Mai',
    bikeTypes: ['mountain'],
    terrain: 'trail',
    pace: 'steady',
    difficulty: 'hard',
    distanceM: 28_000,
    elevationM: 650,
    capacity: 10,
    requirements: 'Mountain bike with working suspension, helmet, gloves, 2 litres of water.',
    cancellationPolicy: 'Cancelled after heavy rain to protect the trails.',
    meetingPointName: 'Trailhead car park',
    meetingPointDetails: 'Lower car park, by the trail map board.',
    meetingDetailsVisibleTo: 'participants',
    visibility: 'public',
  },
  {
    clubId: null,
    title: 'Island coast road',
    description: 'Rolling coastal road with sea views and a beach cafe stop at halfway.',
    startsAt: bangkok(12, 6, 15),
    area: 'Phuket',
    bikeTypes: ['road', 'gravel', 'ebike'],
    terrain: 'road',
    pace: 'steady',
    difficulty: 'moderate',
    distanceM: 55_000,
    elevationM: 620,
    capacity: 18,
    requirements: 'Helmet, lights, sunscreen.',
    cancellationPolicy: 'Cancelled in strong wind or rain.',
    meetingPointName: 'South beach roundabout',
    meetingPointDetails: 'Outside the bakery on the roundabout.',
    meetingDetailsVisibleTo: 'members',
    visibility: 'public',
  },
  {
    clubId: null,
    title: 'Beach town to vineyard',
    description: 'Quiet back roads through pineapple fields to lunch among the vines.',
    startsAt: bangkok(14, 6, 30),
    area: 'Hua Hin',
    bikeTypes: ['road', 'gravel', 'touring'],
    terrain: 'mixed',
    pace: 'steady',
    difficulty: 'moderate',
    distanceM: 84_000,
    elevationM: 480,
    capacity: 14,
    requirements: 'Two bottles and cash for lunch.',
    cancellationPolicy: 'Decided the evening before.',
    meetingPointName: 'Railway station forecourt',
    meetingPointDetails: 'Left of the station entrance, by the clock.',
    meetingDetailsVisibleTo: 'members',
    visibility: 'public',
  },
  {
    clubId: null,
    title: 'National park century',
    description: 'A long day in the hills. Self-supported between two cafe stops.',
    startsAt: bangkok(16, 5, 30),
    area: 'Khao Yai',
    bikeTypes: ['road'],
    terrain: 'road',
    pace: 'brisk',
    difficulty: 'expert',
    distanceM: 162_000,
    elevationM: 2_300,
    capacity: 12,
    requirements: 'Experience riding 100 km or more, lights, food for five hours.',
    cancellationPolicy: 'Shortened route if the forecast is poor.',
    meetingPointName: 'Park gateway town, market square',
    meetingPointDetails: 'North-east corner of the market square.',
    meetingDetailsVisibleTo: 'members',
    visibility: 'public',
  },
  {
    clubId,
    title: 'Beginners: your first group ride',
    description:
      'We explain signals and riding side by side, then ride a short flat loop together.',
    startsAt: bangkok(18, 7, 0),
    area: 'Bangkok',
    bikeTypes: ['road', 'hybrid', 'folding', 'gravel', 'ebike'],
    terrain: 'road',
    pace: 'relaxed',
    difficulty: 'easy',
    distanceM: 20_000,
    elevationM: 15,
    capacity: 25,
    requirements: 'A roadworthy bike and a helmet. That is all.',
    cancellationPolicy: 'Cancelled if it is raining at the start time.',
    meetingPointName: 'Central park, main gate',
    meetingPointDetails: 'By the bicycle rental kiosk just inside the main gate.',
    meetingDetailsVisibleTo: 'public',
    visibility: 'public',
  },
  {
    clubId,
    title: 'Club members: night ride and noodles',
    description: 'An after-dark spin through the old town, ending at a noodle shop.',
    startsAt: bangkok(21, 19, 30),
    area: 'Bangkok',
    bikeTypes: ['road', 'gravel', 'folding', 'hybrid'],
    terrain: 'road',
    pace: 'steady',
    difficulty: 'easy',
    distanceM: 32_000,
    elevationM: 30,
    capacity: 20,
    requirements: 'Front and rear lights are essential.',
    cancellationPolicy: 'Cancelled in rain.',
    meetingPointName: 'Old town, riverside',
    meetingPointDetails: 'Outside the bike shop on the riverside lane.',
    meetingDetailsVisibleTo: 'members',
    visibility: 'members',
  },
  {
    clubId: null,
    title: 'Two-day bikepacking shakedown',
    description: 'An overnight loop on dirt roads with a campsite by a reservoir.',
    startsAt: bangkok(28, 7, 0),
    endsAt: bangkok(29, 15, 0),
    area: 'Kanchanaburi',
    bikeTypes: ['gravel', 'mountain', 'touring'],
    terrain: 'mixed',
    pace: 'relaxed',
    difficulty: 'moderate',
    distanceM: 130_000,
    elevationM: 1_400,
    capacity: 8,
    requirements: 'Camping kit, lights, capacity for 3 litres of water.',
    cancellationPolicy: 'Postponed if storms are forecast.',
    meetingPointName: 'Provincial bus terminal',
    meetingPointDetails: 'Platform 1 end of the terminal.',
    meetingDetailsVisibleTo: 'participants',
    visibility: 'public',
  },
];

const client = postgres(url, { max: 1 });
const db = drizzle(client);
console.log(`Database host: ${new URL(url).hostname}`);

await db.transaction(async (tx) => {
  const removedRides = await tx.delete(rides).where(eq(rides.isSample, true)).returning();
  const removedClubs = await tx.delete(clubs).where(eq(clubs.isSample, true)).returning();
  console.log(
    `Removed ${removedRides.length} sample rides and ${removedClubs.length} sample clubs.`,
  );
  if (args.has('--remove')) return;

  const [club] = await tx
    .insert(clubs)
    .values({
      slug: 'sample-city-riders',
      name: 'Sample City Riders',
      description: 'A made-up club used to demonstrate RideSphere. Not a real organisation.',
      region: 'Bangkok',
      status: 'active',
      isSample: true,
    })
    .returning();
  if (!club) throw new Error('The sample club was not created.');

  const inserted = await tx
    .insert(rides)
    .values(
      sampleRides(club.id).map((ride) => ({
        ...ride,
        timezone: BANGKOK,
        status: 'published' as const,
        isSample: true,
      })),
    )
    .returning();
  console.log(`Added 1 sample club and ${inserted.length} sample rides.`);
});

await client.end();

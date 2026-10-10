import { errorEnvelopeSchema, rideDetailSchema, rideListResponseSchema } from '@ridesphere/shared';
import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../src/app';
import { createAuth } from '../src/auth';
import { withDb } from '../src/db/client';
import { profiles } from '../src/db/schema';
import { decodeCursor, encodeCursor } from '../src/modules/rides/cursor';
import {
  canSeeMeetingDetails,
  canViewRide,
  listableVisibilities,
} from '../src/modules/rides/policy';

vi.mock('../src/db/client');
vi.mock('../src/auth');

const ORGANISER = '11111111-1111-4111-8111-111111111111';
const MEMBER = '22222222-2222-4222-8222-222222222222';
const RIDE_ID = '33333333-3333-4333-8333-333333333333';

const rideRow = {
  id: RIDE_ID,
  title: 'Synthetic sunrise ride',
  startsAt: new Date('2030-01-05T23:00:00.000Z'),
  timezone: 'Asia/Bangkok',
  area: 'Bangkok',
  bikeTypes: ['road', 'gravel'],
  terrain: 'road',
  pace: 'steady',
  difficulty: 'moderate',
  distanceM: 62_340,
  elevationM: 120,
  capacity: 16,
  isSample: true,
  clubSlug: 'sample-city-riders',
  clubName: 'Sample City Riders',
  description: 'A made-up ride.',
  endsAt: null,
  requirements: 'Helmet.',
  cancellationPolicy: 'Cancelled in rain.',
  visibility: 'public',
  status: 'published',
  organiserId: ORGANISER,
  organiserName: 'Synthetic Organiser',
  meetingPointName: 'Park gate',
  meetingPointDetails: 'By the kiosk, 05:45.',
  meetingDetailsVisibleTo: 'members',
};

let rows: (typeof rideRow)[];
const limit = vi.fn();
const getSession = vi.fn();

// Every query-builder method returns the same object, which resolves to `rows` when awaited.
// Profile lookups (made by optionalUser) resolve to "no profile yet".
function fakeDb() {
  let table: unknown;
  const chain: Record<string, unknown> = {};
  for (const method of ['select', 'leftJoin', 'where', 'orderBy']) chain[method] = () => chain;
  chain.from = (t: unknown) => ((table = t), chain);
  chain.limit = (n: number) => (limit(n), chain);
  chain.then = (resolve: (value: unknown) => void) => resolve(table === profiles ? [] : rows);
  return chain;
}

const get = (path: string, asMember?: string) =>
  app.request(
    `http://api.test/api/v1/rides${path}`,
    asMember ? { headers: { Cookie: 'session=synthetic' } } : {},
    env,
  );

beforeEach(() => {
  vi.resetAllMocks();
  rows = [rideRow];
  vi.mocked(withDb).mockImplementation((_config, fn) => fn(fakeDb() as never));
  vi.mocked(createAuth).mockReturnValue({ api: { getSession } } as never);
  getSession.mockResolvedValue({ user: { id: MEMBER } });
});

describe('GET /api/v1/rides', () => {
  it('returns summaries without meeting details or internal fields', async () => {
    const res = await get('');
    expect(res.status).toBe(200);
    const text = await res.text();
    const body = rideListResponseSchema.parse(JSON.parse(text));
    expect(body.items[0]).toMatchObject({
      id: RIDE_ID,
      distanceKm: 62.3,
      club: { slug: 'sample-city-riders', name: 'Sample City Riders' },
      isSample: true,
    });
    expect(body.nextCursor).toBeNull();
    for (const secret of ['kiosk', 'organiserId', ORGANISER, 'status']) {
      expect(text).not.toContain(secret);
    }
  });

  it('asks for one extra row and returns a cursor when there is another page', async () => {
    rows = [rideRow, { ...rideRow, id: '44444444-4444-4444-8444-444444444444' }, rideRow];
    const body = rideListResponseSchema.parse(await (await get('?limit=2')).json());
    expect(limit).toHaveBeenCalledWith(3);
    expect(body.items).toHaveLength(2);
    expect(decodeCursor(body.nextCursor!).id).toBe('44444444-4444-4444-8444-444444444444');
  });

  it.each([
    'pace=warp',
    'bikeType=unicycle',
    'limit=500',
    'limit=0',
    'minDistanceKm=-5',
    'from=yesterday',
    'q=a',
    'sort=price',
    'cursor=not-a-cursor',
  ])('rejects ?%s', async (query) => {
    const res = await get(`?${query}`);
    expect(res.status).toBe(400);
    expect(['VALIDATION_FAILED', 'INVALID_CURSOR']).toContain(
      errorEnvelopeSchema.parse(await res.json()).error.code,
    );
  });
});

describe('GET /api/v1/rides/{id}', () => {
  it('hides exact meeting instructions from a visitor', async () => {
    const body = rideDetailSchema.parse(await (await get(`/${RIDE_ID}`)).json());
    expect(body.meetingPoint).toEqual({
      name: 'Park gate',
      details: null,
      detailsVisibleTo: 'members',
    });
    expect(body.organiser).toEqual({ displayName: 'Synthetic Organiser' });
  });

  it('shows them to a signed-in member', async () => {
    const body = rideDetailSchema.parse(await (await get(`/${RIDE_ID}`, MEMBER)).json());
    expect(body.meetingPoint.details).toBe('By the kiosk, 05:45.');
  });

  it('answers 404 for a ride the viewer may not see, as if it did not exist', async () => {
    rows = [{ ...rideRow, visibility: 'members' }];
    const res = await get(`/${RIDE_ID}`);
    expect(res.status).toBe(404);
    expect(JSON.stringify(await res.json())).not.toContain('Synthetic sunrise');
  });

  it('answers 404 when there is no such ride', async () => {
    rows = [];
    expect((await get(`/${RIDE_ID}`)).status).toBe(404);
  });

  it('rejects a malformed id', async () => {
    expect((await get('/not-a-uuid')).status).toBe(400);
  });
});

describe('ride visibility rules', () => {
  const base = {
    organiserId: ORGANISER,
    visibility: 'public',
    status: 'published',
    meetingDetailsVisibleTo: 'members',
  } as const;
  const visitor = undefined;
  const member = { id: MEMBER };
  const organiser = { id: ORGANISER };

  it('lets anyone open a public ride, members open a members ride, nobody else a private one', () => {
    expect(canViewRide(base, visitor)).toBe(true);
    expect(canViewRide({ ...base, visibility: 'members' }, visitor)).toBe(false);
    expect(canViewRide({ ...base, visibility: 'members' }, member)).toBe(true);
    expect(canViewRide({ ...base, visibility: 'private' }, member)).toBe(false);
    expect(canViewRide({ ...base, visibility: 'private' }, organiser)).toBe(true);
  });

  it('keeps drafts to the organiser', () => {
    expect(canViewRide({ ...base, status: 'draft' }, member)).toBe(false);
    expect(canViewRide({ ...base, status: 'draft' }, organiser)).toBe(true);
  });

  it('discloses meeting details only to the audience the organiser chose', () => {
    expect(canSeeMeetingDetails({ ...base, meetingDetailsVisibleTo: 'public' }, visitor)).toBe(
      true,
    );
    expect(canSeeMeetingDetails(base, visitor)).toBe(false);
    expect(canSeeMeetingDetails(base, member)).toBe(true);
    expect(canSeeMeetingDetails({ ...base, meetingDetailsVisibleTo: 'participants' }, member)).toBe(
      false,
    );
    expect(
      canSeeMeetingDetails({ ...base, meetingDetailsVisibleTo: 'participants' }, organiser),
    ).toBe(true);
  });

  it('never discloses meeting details of a ride the viewer cannot open', () => {
    const hidden = { ...base, visibility: 'members', meetingDetailsVisibleTo: 'public' } as const;
    expect(canSeeMeetingDetails(hidden, visitor)).toBe(false);
  });

  it('never lists private rides', () => {
    expect(listableVisibilities(visitor)).toEqual(['public']);
    expect(listableVisibilities(member)).toEqual(['public', 'members']);
  });
});

describe('ride cursors', () => {
  it('round-trips a position', () => {
    const position = { startsAt: new Date('2030-01-05T23:00:00.000Z'), id: RIDE_ID };
    expect(decodeCursor(encodeCursor(position))).toEqual(position);
  });

  it.each(['', 'not-base64!', btoa('2030-01-05|not-a-uuid'), btoa(`never|${RIDE_ID}`)])(
    'rejects %j',
    (cursor) => {
      expect(() => decodeCursor(cursor)).toThrow('not valid');
    },
  );
});

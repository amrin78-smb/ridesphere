import { errorEnvelopeSchema, meResponseSchema } from '@ridesphere/shared';
import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../src/app';
import { createAuth } from '../src/auth';
import { withDb } from '../src/db/client';
import { profiles, user as authUser } from '../src/db/schema';

vi.mock('../src/db/client');
vi.mock('../src/auth');

type Profile = typeof profiles.$inferSelect;

const USER_ID = '7b0b6a7e-3c1f-4d0e-9d55-0f6f2f1c9a11';
const profile: Profile = {
  userId: USER_ID,
  displayName: 'Synthetic Rider',
  homeArea: null,
  locale: 'en',
  visibility: 'members',
  role: 'member',
  status: 'active',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const getSession = vi.fn();
const set = vi.fn();
let storedProfile: Profile;

const insertValues = vi.fn();
const deleted = vi.fn();
let storedPreferences: unknown[];

// The smallest stand-in for the Drizzle calls these routes make.
const fakeDb = {
  select: () => ({
    from: (table: unknown) => ({
      where: () => Promise.resolve(table === profiles ? [storedProfile] : storedPreferences),
    }),
  }),
  update: () => ({
    set: (changes: Partial<Profile>) => {
      set(changes);
      return {
        where: () => ({ returning: () => Promise.resolve([{ ...storedProfile, ...changes }]) }),
      };
    },
  }),
  insert: () => ({
    values: (values: unknown) => {
      insertValues(values);
      return { onConflictDoUpdate: () => Promise.resolve() };
    },
  }),
  delete: (table: unknown) => ({
    where: () => {
      deleted(table);
      return Promise.resolve();
    },
  }),
  transaction: (fn: (tx: unknown) => Promise<void>) => fn(fakeDb),
};

const signedIn = () =>
  getSession.mockResolvedValue({
    user: { id: USER_ID, email: 'rider@example.test', emailVerified: false, name: 'Synthetic' },
  });

const request = (method: string, body?: unknown, path = '') =>
  app.request(
    `http://api.test/api/v1/me${path}`,
    {
      method,
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }),
    },
    env,
  );

beforeEach(() => {
  vi.resetAllMocks();
  storedProfile = profile;
  storedPreferences = [];
  vi.mocked(withDb).mockImplementation((_config, fn) => fn(fakeDb as never));
  vi.mocked(createAuth).mockReturnValue({ api: { getSession } } as never);
});

describe('GET /api/v1/me', () => {
  it('refuses a request without a session', async () => {
    getSession.mockResolvedValue(null);
    const res = await request('GET');
    expect(res.status).toBe(401);
    expect(errorEnvelopeSchema.parse(await res.json()).error.code).toBe('UNAUTHENTICATED');
  });

  it('returns the member and profile without internal fields', async () => {
    signedIn();
    const res = await request('GET');
    expect(res.status).toBe(200);
    const body: unknown = await res.json();
    expect(meResponseSchema.parse(body).profile.displayName).toBe('Synthetic Rider');
    expect(JSON.stringify(body)).not.toContain('status');
  });

  it.each(['suspended', 'deleted'] as const)('refuses a %s account', async (status) => {
    signedIn();
    storedProfile = { ...profile, status };
    const res = await request('GET');
    expect(res.status).toBe(403);
    expect(errorEnvelopeSchema.parse(await res.json()).error.code).toBe('ACCOUNT_RESTRICTED');
  });
});

describe('PATCH /api/v1/me', () => {
  it('refuses a request without a session before looking at the body', async () => {
    getSession.mockResolvedValue(null);
    const res = await request('PATCH', { displayName: 'New Name' });
    expect(res.status).toBe(401);
    expect(set).not.toHaveBeenCalled();
  });

  it('updates allowed fields', async () => {
    signedIn();
    const res = await request('PATCH', {
      displayName: '  Chiang Mai Climber ',
      homeArea: 'Chiang Mai',
    });
    expect(res.status).toBe(200);
    expect(set).toHaveBeenCalledWith({ displayName: 'Chiang Mai Climber', homeArea: 'Chiang Mai' });
    expect(meResponseSchema.parse(await res.json()).profile.homeArea).toBe('Chiang Mai');
  });

  it.each([
    ['a role', { role: 'admin' }],
    ['an account status', { status: 'active' }],
    ['another user id', { userId: '00000000-0000-4000-8000-000000000000' }],
    ['an unsupported locale', { locale: 'xx' }],
    ['a name that is too short', { displayName: 'A' }],
  ])('rejects %s', async (_label, body) => {
    signedIn();
    const res = await request('PATCH', body);
    expect(res.status).toBe(400);
    expect(errorEnvelopeSchema.parse(await res.json()).error.code).toBe('VALIDATION_FAILED');
    expect(set).not.toHaveBeenCalled();
  });
});

const validPreferences = {
  bikeTypes: ['gravel', 'road'],
  ridingStyles: ['social'],
  languages: ['en', 'th'],
  pace: 'steady',
  experience: 'intermediate',
  distanceMinKm: 30,
  distanceMaxKm: 80,
};

describe('riding preferences', () => {
  it('returns empty preferences for a member who has not set any', async () => {
    signedIn();
    const body = meResponseSchema.parse(await (await request('GET')).json());
    expect(body.preferences).toEqual({
      bikeTypes: [],
      ridingStyles: [],
      languages: [],
      pace: null,
      experience: null,
      distanceMinKm: null,
      distanceMaxKm: null,
    });
  });

  it('saves a full set of preferences for the signed-in member only', async () => {
    signedIn();
    const res = await request('PUT', validPreferences, '/preferences');
    expect(res.status).toBe(200);
    expect(insertValues).toHaveBeenCalledWith({ userId: USER_ID, ...validPreferences });
    expect(meResponseSchema.parse(await res.json()).preferences).toEqual(validPreferences);
  });

  it.each([
    ['an unknown bike type', { bikeTypes: ['unicycle'] }],
    ['a repeated value', { ridingStyles: ['social', 'social'] }],
    ['a reversed distance range', { distanceMinKm: 90, distanceMaxKm: 40 }],
    ['an impossible distance', { distanceMaxKm: 5000 }],
    ['another member id', { userId: '00000000-0000-4000-8000-000000000000' }],
  ])('rejects %s', async (_label, change) => {
    signedIn();
    const res = await request('PUT', { ...validPreferences, ...change }, '/preferences');
    expect(res.status).toBe(400);
    expect(insertValues).not.toHaveBeenCalled();
  });

  it('refuses to save without a session', async () => {
    getSession.mockResolvedValue(null);
    expect((await request('PUT', validPreferences, '/preferences')).status).toBe(401);
    expect(insertValues).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/v1/me', () => {
  it('deletes the account when confirmed', async () => {
    signedIn();
    const res = await request('DELETE', { confirm: 'DELETE' });
    expect(res.status).toBe(204);
    expect(deleted).toHaveBeenCalledWith(authUser);
  });

  it.each([
    ['no confirmation', {}],
    ['the wrong confirmation', { confirm: 'yes' }],
  ])('does nothing with %s', async (_label, body) => {
    signedIn();
    const res = await request('DELETE', body);
    expect(res.status).toBe(400);
    expect(deleted).not.toHaveBeenCalled();
  });

  it('does nothing without a session', async () => {
    getSession.mockResolvedValue(null);
    expect((await request('DELETE', { confirm: 'DELETE' })).status).toBe(401);
    expect(deleted).not.toHaveBeenCalled();
  });
});

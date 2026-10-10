import { errorEnvelopeSchema, meResponseSchema } from '@ridesphere/shared';
import { env } from 'cloudflare:workers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '../src/app';
import { createAuth } from '../src/auth';
import { withDb } from '../src/db/client';
import type { profiles } from '../src/db/schema';

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

// The smallest stand-in for the Drizzle calls these routes make.
const fakeDb = {
  select: () => ({ from: () => ({ where: () => Promise.resolve([storedProfile]) }) }),
  update: () => ({
    set: (changes: Partial<Profile>) => {
      set(changes);
      return {
        where: () => ({ returning: () => Promise.resolve([{ ...storedProfile, ...changes }]) }),
      };
    },
  }),
};

const signedIn = () =>
  getSession.mockResolvedValue({
    user: { id: USER_ID, email: 'rider@example.test', emailVerified: false, name: 'Synthetic' },
  });

const request = (method: string, body?: unknown) =>
  app.request(
    'http://api.test/api/v1/me',
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

import { errorEnvelopeSchema, healthResponseSchema } from '@ridesphere/shared';
import { env } from 'cloudflare:workers';
import { describe, expect, it, vi } from 'vitest';

import { app } from '../src/app';
import { authOptions } from '../src/auth/options';
import { parseConfig } from '../src/config/env';
import { withDb } from '../src/db/client';

vi.mock('../src/db/client');

const get = (path: string, bindings: unknown = env) =>
  app.request(`http://api.test${path}`, {}, bindings as Env);

describe('GET /api/v1/health', () => {
  it('reports ok and the environment', async () => {
    const res = await get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(healthResponseSchema.parse(await res.json())).toEqual({
      status: 'ok',
      environment: 'local',
    });
  });

  it('returns a server-generated request ID header', async () => {
    const res = await get('/api/v1/health');
    expect(res.headers.get('X-Request-Id')).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('GET /api/v1/health/ready', () => {
  it('reports ok when the database answers', async () => {
    vi.mocked(withDb).mockResolvedValueOnce([]);
    const res = await get('/api/v1/health/ready');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', database: 'ok' });
  });

  it('returns 503 with the error envelope when the database is unreachable', async () => {
    vi.mocked(withDb).mockRejectedValueOnce(new Error('connect ECONNREFUSED 10.0.0.1:5432'));
    const res = await get('/api/v1/health/ready');
    expect(res.status).toBe(503);
    const body = errorEnvelopeSchema.parse(await res.json());
    expect(body.error.code).toBe('DATABASE_UNAVAILABLE');
    expect(body.error.requestId).toBe(res.headers.get('X-Request-Id'));
    expect(JSON.stringify(body)).not.toContain('10.0.0.1');
  });
});

describe('GET /', () => {
  it('points visitors at the health check and the specification', async () => {
    const res = await get('/');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ health: '/api/v1/health' });
  });
});

describe('GET /api/v1/config', () => {
  it('reports Google sign-in as off when it is not configured, and reveals nothing else', async () => {
    const res = await get('/api/v1/config');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ auth: { google: false } });
  });
});

describe('error handling', () => {
  it('returns the error envelope for an unknown route', async () => {
    const res = await get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(errorEnvelopeSchema.parse(await res.json()).error.code).toBe('NOT_FOUND');
  });
});

describe('configuration', () => {
  it('rejects an environment with missing or invalid bindings', () => {
    expect(() => parseConfig({ ...env, HYPERDRIVE: undefined })).toThrow(
      'not configured correctly',
    );
    expect(() => parseConfig({ ...env, APP_ENV: 'prod' })).toThrow('not configured correctly');
    expect(() => parseConfig({ ...env, BETTER_AUTH_SECRET: 'too-short' })).toThrow(
      'not configured correctly',
    );
  });

  it('treats a blank or half-configured Google client as not configured', () => {
    expect(parseConfig({ ...env, GOOGLE_CLIENT_ID: '' }).auth.google).toBeUndefined();
    expect(parseConfig({ ...env, GOOGLE_CLIENT_ID: 'id-only' }).auth.google).toBeUndefined();
    expect(
      parseConfig({ ...env, GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' }).auth.google,
    ).toEqual({ clientId: 'id', clientSecret: 'secret' });
  });

  it('accepts the test bindings', () => {
    expect(parseConfig(env).appEnv).toBe('local');
  });

  it('accepts the Expo Go development client everywhere except production', () => {
    const origins = (appEnv: string) =>
      authOptions(parseConfig({ ...env, APP_ENV: appEnv }).auth).trustedOrigins;
    expect(origins('staging')).toContain('exp://');
    expect(origins('production')).toEqual(['ridesphere://']);
  });
});

describe('GET /api/v1/openapi.json', () => {
  it('documents the routes', async () => {
    const res = await get('/api/v1/openapi.json');
    expect(res.status).toBe(200);
    const doc: { paths: Record<string, unknown> } = await res.json();
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining(['/api/v1/health', '/api/v1/health/ready', '/api/v1/me']),
    );
  });
});

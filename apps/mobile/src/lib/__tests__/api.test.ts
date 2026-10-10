import { healthResponseSchema } from '@ridesphere/shared';

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

function loadApi(baseUrl: string | undefined) {
  jest.resetModules();
  if (baseUrl === undefined) delete process.env.EXPO_PUBLIC_API_BASE_URL;
  else process.env.EXPO_PUBLIC_API_BASE_URL = baseUrl;
  // Re-evaluate the module so it reads the base URL set above.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/api') as typeof import('@/lib/api');
}

describe('apiGet', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('fails clearly when no server is configured, without calling the network', async () => {
    const { apiGet } = loadApi(undefined);
    await expect(apiGet('/health', healthResponseSchema)).rejects.toMatchObject({
      kind: 'not-configured',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns validated data from the versioned path', async () => {
    const { apiGet } = loadApi('https://api.example.test/');
    fetchMock.mockReturnValue(json(200, { status: 'ok', environment: 'staging' }));
    await expect(apiGet('/health', healthResponseSchema)).resolves.toEqual({
      status: 'ok',
      environment: 'staging',
    });
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.test/api/v1/health');
  });

  it('surfaces the server error envelope', async () => {
    const { apiGet } = loadApi('https://api.example.test');
    fetchMock.mockReturnValue(
      json(503, {
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Temporarily unavailable.',
          requestId: 'r1',
        },
      }),
    );
    await expect(apiGet('/health', healthResponseSchema)).rejects.toMatchObject({
      kind: 'http',
      message: 'Temporarily unavailable.',
      details: { status: 503, code: 'DATABASE_UNAVAILABLE', requestId: 'r1' },
    });
  });

  it('reports a network failure', async () => {
    const { apiGet } = loadApi('https://api.example.test');
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(apiGet('/health', healthResponseSchema)).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('rejects a response that does not match the contract', async () => {
    const { apiGet } = loadApi('https://api.example.test');
    fetchMock.mockReturnValue(json(200, { status: 'fine' }));
    await expect(apiGet('/health', healthResponseSchema)).rejects.toMatchObject({
      kind: 'invalid-response',
    });
  });
});

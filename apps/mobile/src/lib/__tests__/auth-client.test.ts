import { completeBrowserSignIn, markBrowserSignInStarted } from '@/lib/auth-client';

// Names start with `mock` so Jest lets the hoisted factories below use them.
const mockStore = new Map<string, string>();
const mockNotify = jest.fn();

jest.mock('expo-secure-store', () => ({}));
jest.mock('better-auth/react', () => ({
  createAuthClient: () => ({ $store: { notify: (signal: string) => mockNotify(signal) } }),
}));
jest.mock('@better-auth/expo/client', () => ({
  expoClient: () => ({}),
  getSetCookie: (cookie: string, previous?: string) => `${previous ?? ''}|${cookie}`,
  storageAdapter: () => ({
    getItemAsync: (key: string) => Promise.resolve(mockStore.get(key) ?? null),
    setItemAsync: (key: string, value: string) => Promise.resolve(void mockStore.set(key, value)),
  }),
}));

beforeEach(() => {
  mockStore.clear();
  mockNotify.mockReset();
  jest.useRealTimers();
});

describe('completeBrowserSignIn', () => {
  it('ignores a session link when this device did not start a sign-in', async () => {
    await expect(completeBrowserSignIn('session=attacker')).resolves.toBe(false);
    expect(mockStore.get('ridesphere_cookie')).toBeUndefined();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('stores the session after a sign-in this device started', async () => {
    await markBrowserSignInStarted();
    await expect(completeBrowserSignIn('session=mine')).resolves.toBe(true);
    expect(mockStore.get('ridesphere_cookie')).toContain('session=mine');
    expect(mockNotify).toHaveBeenCalledWith('$sessionSignal');
  });

  it('accepts only one link per sign-in', async () => {
    await markBrowserSignInStarted();
    await completeBrowserSignIn('session=mine');
    await expect(completeBrowserSignIn('session=attacker')).resolves.toBe(false);
    expect(mockStore.get('ridesphere_cookie')).not.toContain('attacker');
  });

  it('ignores a link that arrives long after the sign-in started', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-10T10:00:00Z') });
    await markBrowserSignInStarted();
    jest.setSystemTime(new Date('2026-10-10T10:11:00Z'));
    await expect(completeBrowserSignIn('session=late')).resolves.toBe(false);
  });
});

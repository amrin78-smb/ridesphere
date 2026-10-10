import { useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { useGlobalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { completeBrowserSignIn } from '@/lib/auth-client';
import { debugLog } from '@/lib/debug';

function sessionFromLink(url: string): string | null {
  // Read the raw link rather than router params so the value is decoded exactly once.
  const query = url.split('?')[1]?.split('#')[0];
  return query ? new URLSearchParams(query).get('cookie') : null;
}

/**
 * Finishes a browser sign-in (Google) when the app is opened by the return link.
 * Mounted once at the root so it works whichever screen the link lands on.
 *
 * In Expo Go on Android the return link restarts the app, so the sign-in call that opened
 * the browser is gone and the link is the only place the new session exists. The link is
 * read from both the linking API and the router, because which one has it at startup varies.
 */
export function BrowserSignInReturn() {
  const url = Linking.useLinkingURL();
  const params = useGlobalSearchParams<{ cookie?: string }>();
  const queryClient = useQueryClient();
  const cookie = (url ? sessionFromLink(url) : null) ?? params.cookie ?? null;

  useEffect(() => {
    debugLog('link check', { hasLink: Boolean(url), hasSession: Boolean(cookie) });
    if (!cookie) return;
    void completeBrowserSignIn(cookie).then((accepted) => {
      debugLog('browser sign-in return', { accepted });
      if (accepted) void queryClient.invalidateQueries();
    });
  }, [url, cookie, queryClient]);

  return null;
}

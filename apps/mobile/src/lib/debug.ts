type Details = Record<string, string | number | boolean | null | undefined>;

/**
 * Development-only diagnostics, visible in the `expo start` terminal. Never pass tokens,
 * cookies, emails or other personal data: log facts about them (present, length) instead.
 */
export function debugLog(message: string, details: Details = {}) {
  if (__DEV__) console.log(`[ridesphere] ${message}`, JSON.stringify(details));
}

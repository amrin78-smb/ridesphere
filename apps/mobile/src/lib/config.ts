// EXPO_PUBLIC_* values are compiled into the app and are public. Never put a secret in one.
export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');

export const isApiConfigured = Boolean(apiBaseUrl);

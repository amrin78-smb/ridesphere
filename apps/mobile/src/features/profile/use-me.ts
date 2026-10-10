import { meResponseSchema, type Preferences, type UpdateMeRequest } from '@ridesphere/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiCommand, apiRequest } from '@/lib/api';

const meKey = ['me'] as const;

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: ({ signal }) => apiRequest('/me', meResponseSchema, { authenticated: true, signal }),
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: UpdateMeRequest) =>
      apiRequest('/me', meResponseSchema, { method: 'PATCH', body: changes, authenticated: true }),
    onSuccess: (me) => queryClient.setQueryData(meKey, me),
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: Preferences) =>
      apiRequest('/me/preferences', meResponseSchema, {
        method: 'PUT',
        body: preferences,
        authenticated: true,
      }),
    onSuccess: (me) => queryClient.setQueryData(meKey, me),
  });
}

/** Permanently deletes the account on the server. The caller clears the local session. */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: () =>
      apiCommand('/me', { method: 'DELETE', body: { confirm: 'DELETE' }, authenticated: true }),
  });
}

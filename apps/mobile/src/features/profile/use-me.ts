import { meResponseSchema, type UpdateMeRequest } from '@ridesphere/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';

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

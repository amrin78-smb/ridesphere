import { publicConfigSchema } from '@ridesphere/shared';
import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api';

/** Which sign-in methods the server offers. Optional extras stay hidden if this fails. */
export function usePublicConfig() {
  return useQuery({
    queryKey: ['system', 'config'],
    queryFn: ({ signal }) => apiGet('/config', publicConfigSchema, signal),
    staleTime: 5 * 60_000,
  });
}

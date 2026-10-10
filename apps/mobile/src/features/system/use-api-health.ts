import { healthResponseSchema } from '@ridesphere/shared';
import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api';

export function useApiHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: ({ signal }) => apiGet('/health', healthResponseSchema, signal),
  });
}

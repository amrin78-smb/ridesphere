import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Retry transient failures only. Configuration and contract errors will not fix themselves.
        retry: (failureCount, error) =>
          failureCount < 2 && error instanceof ApiError && error.kind === 'network',
      },
    },
  });
}

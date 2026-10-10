import {
  type BikeType,
  type Difficulty,
  type Pace,
  rideDetailSchema,
  rideListResponseSchema,
  type Terrain,
} from '@ridesphere/shared';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/lib/api';

export type RideFilters = {
  q?: string | undefined;
  bikeType?: BikeType | undefined;
  pace?: Pace | undefined;
  terrain?: Terrain | undefined;
  difficulty?: Difficulty | undefined;
};

/** Builds the query string for GET /rides from the filters that are set. */
export function ridesPath(filters: RideFilters, cursor?: string): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim();
  // The server requires at least two characters; shorter input is not a search yet.
  if (q && q.length >= 2) params.set('q', q);
  for (const key of ['bikeType', 'pace', 'terrain', 'difficulty'] as const) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return query ? `/rides?${query}` : '/rides';
}

export function useRides(filters: RideFilters) {
  return useInfiniteQuery({
    queryKey: ['rides', 'list', filters],
    // The session is sent when there is one, so members also see members-only rides.
    queryFn: ({ pageParam, signal }) =>
      apiRequest(ridesPath(filters, pageParam), rideListResponseSchema, {
        authenticated: true,
        signal,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useRide(id: string) {
  return useQuery({
    queryKey: ['rides', 'detail', id],
    queryFn: ({ signal }) =>
      apiRequest(`/rides/${encodeURIComponent(id)}`, rideDetailSchema, {
        authenticated: true,
        signal,
      }),
  });
}

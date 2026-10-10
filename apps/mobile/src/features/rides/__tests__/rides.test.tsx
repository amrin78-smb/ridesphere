import type { RideDetail } from '@ridesphere/shared';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { formatDistance, formatElevation, formatRideStart } from '@/features/rides/format';
import { RideCard } from '@/features/rides/ride-card';
import { RideDetailView } from '@/features/rides/ride-detail-view';
import { activeFilterCount } from '@/features/rides/ride-filters';
import { ridesPath } from '@/features/rides/use-rides';

jest.mock('@/lib/auth-client', () => ({ authClient: {} }));

const ride: RideDetail = {
  id: '33333333-3333-4333-8333-333333333333',
  title: 'Synthetic sunrise ride',
  startsAt: '2030-01-05T23:00:00.000Z',
  timezone: 'Asia/Bangkok',
  area: 'Bangkok',
  bikeTypes: ['road', 'gravel'],
  terrain: 'road',
  pace: 'steady',
  difficulty: 'moderate',
  distanceKm: 62.3,
  elevationM: 1150,
  capacity: 16,
  club: { slug: 'sample-city-riders', name: 'Sample City Riders' },
  isSample: true,
  description: 'A made-up ride.',
  endsAt: null,
  requirements: 'Helmet.',
  cancellationPolicy: 'Cancelled in rain.',
  visibility: 'public',
  organiser: { displayName: 'Synthetic Organiser' },
  meetingPoint: { name: 'Park gate', details: null, detailsVisibleTo: 'members' },
};

describe('formatting', () => {
  it('shows the start in the ride’s own time zone, not UTC or the device’s', () => {
    // 23:00 UTC on the 5th is 06:00 on the 6th in Bangkok.
    const text = formatRideStart(ride.startsAt, 'Asia/Bangkok');
    expect(text).toContain('Sun');
    expect(text).toContain('6 Jan');
    expect(text).toContain('06:00');
  });

  it('falls back to a labelled UTC time for an unknown zone', () => {
    expect(formatRideStart(ride.startsAt, 'Not/AZone')).toBe('2030-01-05 23:00 UTC');
  });

  it('formats distance and climbing', () => {
    expect(formatDistance(62.3)).toBe('62.3 km');
    expect(formatDistance(25)).toBe('25 km');
    expect(formatElevation(1150)).toBe('1,150 m climbing');
    expect(formatElevation(null)).toBeNull();
  });
});

describe('ridesPath', () => {
  it('has no query string without filters', () => {
    expect(ridesPath({})).toBe('/rides');
  });

  it('includes only the filters that are set, and the cursor', () => {
    expect(ridesPath({ bikeType: 'gravel', pace: 'steady', q: '  canal path ' }, 'abc')).toBe(
      '/rides?q=canal+path&bikeType=gravel&pace=steady&cursor=abc',
    );
  });

  it('does not send a search too short for the server to accept', () => {
    expect(ridesPath({ q: 'a' })).toBe('/rides');
    expect(activeFilterCount({ q: '  ' })).toBe(0);
    expect(activeFilterCount({ q: 'hills', terrain: 'trail' })).toBe(2);
  });
});

describe('RideCard', () => {
  it('shows the essentials, labels sample rides and opens on press', async () => {
    const onPress = jest.fn();
    await render(<RideCard ride={ride} onPress={onPress} />);
    expect(screen.getByText('Synthetic sunrise ride')).toBeTruthy();
    expect(screen.getByText('Bangkok · 62.3 km · Steady · Moderate')).toBeTruthy();
    expect(screen.getByText('Sample')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not label a real ride as a sample', async () => {
    await render(<RideCard ride={{ ...ride, isSample: false }} onPress={jest.fn()} />);
    expect(screen.queryByText('Sample')).toBeNull();
  });
});

describe('RideDetailView', () => {
  it('explains why exact meeting instructions are not shown', async () => {
    await render(<RideDetailView ride={ride} />);
    expect(screen.getByText('Park gate')).toBeTruthy();
    expect(screen.getByText('Sign in to see exactly where to meet.')).toBeTruthy();
  });

  it('shows exact meeting instructions when the server provides them', async () => {
    const withDetails = {
      ...ride,
      meetingPoint: { ...ride.meetingPoint, details: 'By the kiosk, 05:45.' },
    };
    await render(<RideDetailView ride={withDetails} />);
    expect(screen.getByText('By the kiosk, 05:45.')).toBeTruthy();
    expect(screen.queryByText('Sign in to see exactly where to meet.')).toBeNull();
  });

  it('says that organiser-supplied details are not a safety guarantee', async () => {
    await render(<RideDetailView ride={ride} />);
    expect(screen.getByText(/not a guarantee of\s+route safety/)).toBeTruthy();
  });

  it('tells people a sample ride will not take place', async () => {
    await render(<RideDetailView ride={ride} />);
    expect(screen.getByText(/It will not take place/)).toBeTruthy();
  });
});

import { emptyPreferences } from '@ridesphere/shared';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PreferencesEditor } from '@/features/profile/preferences-editor';
import { summarise } from '@/features/profile/profile-view';
import { useUpdatePreferences } from '@/features/profile/use-me';

jest.mock('@/features/profile/use-me', () => ({
  useUpdatePreferences: jest.fn(),
  useMe: jest.fn(),
  useUpdateMe: jest.fn(),
  useDeleteAccount: jest.fn(),
}));
jest.mock('@/lib/auth-client', () => ({ authClient: {} }));

const mutate = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  (useUpdatePreferences as jest.Mock).mockReturnValue({ mutate, isPending: false, isError: false });
});

const press = (role: 'checkbox' | 'radio' | 'button', name: string) =>
  fireEvent.press(screen.getByRole(role, { name }));

describe('PreferencesEditor', () => {
  it('saves what the member selected', async () => {
    await render(<PreferencesEditor initial={emptyPreferences} onDone={jest.fn()} />);
    await press('checkbox', 'Gravel');
    await press('checkbox', 'Road');
    await press('checkbox', 'Road'); // selected, then cleared
    await press('radio', 'Steady (20–25 km/h)');
    await fireEvent.changeText(screen.getByLabelText('Shortest (km)'), '30');
    await fireEvent.changeText(screen.getByLabelText('Longest (km)'), '80');
    await press('button', 'Save preferences');
    expect(mutate.mock.calls[0][0]).toEqual({
      ...emptyPreferences,
      bikeTypes: ['gravel'],
      pace: 'steady',
      distanceMinKm: 30,
      distanceMaxKm: 80,
    });
  });

  it('clears a single-choice answer when it is tapped again', async () => {
    await render(
      <PreferencesEditor initial={{ ...emptyPreferences, pace: 'fast' }} onDone={jest.fn()} />,
    );
    await press('radio', 'Fast (over 30 km/h)');
    await press('button', 'Save preferences');
    expect(mutate.mock.calls[0][0].pace).toBeNull();
  });

  it.each([
    ['90', '40', 'The shortest distance cannot be longer than the longest.'],
    ['abc', '', 'Use whole numbers from 1 to 400, or leave them empty.'],
    ['', '9999', 'Use whole numbers from 1 to 400, or leave them empty.'],
  ])('does not save a distance of %s to %s', async (min, max, message) => {
    await render(<PreferencesEditor initial={emptyPreferences} onDone={jest.fn()} />);
    await fireEvent.changeText(screen.getByLabelText('Shortest (km)'), min);
    await fireEvent.changeText(screen.getByLabelText('Longest (km)'), max);
    await press('button', 'Save preferences');
    expect(screen.getByText(message)).toBeTruthy();
    expect(mutate).not.toHaveBeenCalled();
  });
});

describe('summarise', () => {
  it('says so when nothing is set', () => {
    expect(summarise(emptyPreferences)).toEqual(['Nothing set yet.']);
  });

  it('describes what is set in plain words', () => {
    expect(
      summarise({
        ...emptyPreferences,
        bikeTypes: ['gravel', 'ebike'],
        pace: 'relaxed',
        distanceMaxKm: 60,
        languages: ['en', 'th'],
      }),
    ).toEqual([
      'Bikes: Gravel, E-bike',
      'Pace: Relaxed (under 20 km/h)',
      'Distance: up to 60 km',
      'Languages: English, ไทย',
    ]);
  });
});

import { fireEvent, render, screen } from '@testing-library/react-native';

import { StateView } from '@/components/state-view';

describe('StateView', () => {
  it('shows a loading title', async () => {
    await render(<StateView kind="loading" title="Connecting" />);
    expect(screen.getByText('Connecting')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows an empty state with its message', async () => {
    await render(<StateView kind="empty" title="No rides yet" message="Check back soon." />);
    expect(screen.getByText('No rides yet')).toBeTruthy();
    expect(screen.getByText('Check back soon.')).toBeTruthy();
  });

  it('offers a retry button on errors and calls the handler', async () => {
    const onRetry = jest.fn();
    await render(<StateView kind="error" title="Cannot connect" onRetry={onRetry} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides the retry button when an error cannot be retried', async () => {
    await render(<StateView kind="error" title="Server not configured" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

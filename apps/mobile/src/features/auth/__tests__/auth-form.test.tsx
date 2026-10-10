import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AuthForm } from '@/features/auth/auth-form';
import { authClient } from '@/lib/auth-client';

jest.mock('@/lib/auth-client', () => ({
  authClient: { signIn: { email: jest.fn() }, signUp: { email: jest.fn() } },
}));

const signIn = authClient.signIn.email as unknown as jest.Mock;
const signUp = authClient.signUp.email as unknown as jest.Mock;

async function renderForm() {
  await render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthForm />
    </QueryClientProvider>,
  );
}

async function fill(label: string, value: string) {
  await fireEvent.changeText(screen.getByLabelText(label), value);
}

beforeEach(() => jest.resetAllMocks());

describe('AuthForm', () => {
  it('validates before contacting the server', async () => {
    await renderForm();
    await fill('Email', 'not-an-email');
    await fill('Password', 'short');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
    expect(screen.getByText('Use at least 10 characters.')).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('signs in with the trimmed email', async () => {
    signIn.mockResolvedValue({ data: {}, error: null });
    await renderForm();
    await fill('Email', '  rider@example.test ');
    await fill('Password', 'correct-horse-battery');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(signIn).toHaveBeenCalledWith({
      email: 'rider@example.test',
      password: 'correct-horse-battery',
    });
  });

  it('shows a clear message for wrong credentials', async () => {
    signIn.mockResolvedValue({
      data: null,
      error: { code: 'INVALID_EMAIL_OR_PASSWORD', status: 401, message: 'x' },
    });
    await renderForm();
    await fill('Email', 'rider@example.test');
    await fill('Password', 'wrong-password-here');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('That email and password do not match.')).toBeTruthy();
  });

  it('does not show unknown server messages', async () => {
    signIn.mockResolvedValue({
      data: null,
      error: { code: 'SOMETHING_INTERNAL', status: 500, message: 'stack trace at db.ts:42' },
    });
    await renderForm();
    await fill('Email', 'rider@example.test');
    await fill('Password', 'correct-horse-battery');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeTruthy();
    expect(screen.queryByText(/stack trace/)).toBeNull();
  });

  it('creates an account with a name', async () => {
    signUp.mockResolvedValue({ data: {}, error: null });
    await renderForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Create an account' }));
    await fill('Name', 'Synthetic Rider');
    await fill('Email', 'rider@example.test');
    await fill('Password', 'correct-horse-battery');
    await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
    expect(signUp).toHaveBeenCalledWith({
      name: 'Synthetic Rider',
      email: 'rider@example.test',
      password: 'correct-horse-battery',
    });
  });
});

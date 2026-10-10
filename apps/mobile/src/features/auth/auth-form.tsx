import { credentialsSchema, signUpSchema } from '@ridesphere/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { usePublicConfig } from '@/features/auth/use-public-config';
import { authClient, markBrowserSignInStarted } from '@/lib/auth-client';
import { debugLog } from '@/lib/debug';
import { Spacing } from '@/theme';

type Mode = 'sign-in' | 'sign-up';
type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>;

// Messages for the failures a member can act on. Anything else gets the generic message,
// so server internals are never shown.
const KNOWN_ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'That email and password do not match.',
  USER_ALREADY_EXISTS: 'An account with that email already exists. Try signing in.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'An account with that email already exists. Try signing in.',
  PASSWORD_TOO_SHORT: 'Use at least 10 characters for your password.',
  PASSWORD_TOO_LONG: 'Use at most 128 characters for your password.',
  INVALID_EMAIL: 'Enter a valid email address.',
};

function messageFor(error: { code?: string | undefined; status: number }): string {
  if (error.code && KNOWN_ERRORS[error.code]) return KNOWN_ERRORS[error.code]!;
  if (error.status === 429) return 'Too many attempts. Wait a minute and try again.';
  if (error.status === 0) return 'Could not reach RideSphere. Check your connection.';
  return 'Something went wrong. Please try again.';
}

export function AuthForm() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const googleEnabled = usePublicConfig().data?.auth.google === true;

  const isSignUp = mode === 'sign-up';

  async function submit() {
    setFormError(undefined);
    const input = { name, email: email.trim(), password };
    const parsed = isSignUp ? signUpSchema.safeParse(input) : credentialsSchema.safeParse(input);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        errors[field] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      const result = isSignUp
        ? await authClient.signUp.email(signUpSchema.parse(input))
        : await authClient.signIn.email(credentialsSchema.parse(input));
      if (result.error) {
        setFormError(messageFor(result.error));
        return;
      }
      setPassword('');
      await queryClient.invalidateQueries();
    } catch {
      setFormError('Could not reach RideSphere. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  }

  async function continueWithGoogle() {
    setFormError(undefined);
    setGooglePending(true);
    try {
      // Opens the system browser and returns to the Profile tab when Google is done.
      await markBrowserSignInStarted();
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/profile',
      });
      debugLog('google sign-in call returned', {
        error: result.error ? String(result.error.status) : null,
        hasData: Boolean(result.data),
      });
      if (result.error) {
        setFormError('Google sign-in did not complete. Please try again.');
        return;
      }
      await queryClient.invalidateQueries();
    } catch {
      setFormError('Google sign-in did not complete. Please try again.');
    } finally {
      setGooglePending(false);
    }
  }

  function switchMode() {
    setMode(isSignUp ? 'sign-in' : 'sign-up');
    setFieldErrors({});
    setFormError(undefined);
  }

  return (
    <View style={styles.form}>
      <ThemedText type="subtitle" accessibilityRole="header">
        {isSignUp ? 'Create your account' : 'Sign in'}
      </ThemedText>
      {isSignUp ? (
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          error={fieldErrors.name}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
      ) : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete={isSignUp ? 'new-password' : 'current-password'}
        textContentType={isSignUp ? 'newPassword' : 'password'}
        returnKeyType="go"
        onSubmitEditing={() => void submit()}
      />
      {formError ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {formError}
        </ThemedText>
      ) : null}
      <Button
        label={isSignUp ? 'Create account' : 'Sign in'}
        onPress={() => void submit()}
        loading={submitting}
        disabled={googlePending}
      />
      {googleEnabled ? (
        <Button
          label="Continue with Google"
          onPress={() => void continueWithGoogle()}
          variant="secondary"
          loading={googlePending}
          disabled={submitting}
        />
      ) : null}
      <Button
        label={isSignUp ? 'I already have an account' : 'Create an account'}
        onPress={switchMode}
        variant="secondary"
        disabled={submitting || googlePending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
  },
});

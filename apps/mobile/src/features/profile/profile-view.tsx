import { type Preferences, updateMeRequestSchema } from '@ridesphere/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  bikeTypeLabels,
  experienceLabels,
  languageLabels,
  paceLabels,
  ridingStyleLabels,
} from '@/features/profile/labels';
import { PreferencesEditor } from '@/features/profile/preferences-editor';
import { useDeleteAccount, useMe, useUpdateMe } from '@/features/profile/use-me';
import { authClient } from '@/lib/auth-client';
import { Radius, Spacing } from '@/theme';

export function ProfileView() {
  const queryClient = useQueryClient();
  const me = useMe();
  const updateMe = useUpdateMe();
  const [draft, setDraft] = useState<{ displayName: string; homeArea: string }>();
  const [errors, setErrors] = useState<{ displayName?: string; homeArea?: string }>({});
  const [signingOut, setSigningOut] = useState(false);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const deleteAccount = useDeleteAccount();

  async function signOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      // Drop every cached response so one member's data is never shown to the next.
      queryClient.clear();
      setSigningOut(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete your account?',
      'Your profile, riding preferences and sign-in details will be permanently deleted. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () =>
            deleteAccount.mutate(undefined, {
              // The server session is already gone; this clears the device and cached data.
              onSuccess: () => void signOut(),
            }),
        },
      ],
    );
  }

  if (me.isPending) return <StateView kind="loading" title="Loading your profile" />;

  if (me.isError) {
    return (
      <View style={styles.section}>
        <StateView
          kind="error"
          title="Could not load your profile"
          message={me.error.message}
          onRetry={() => void me.refetch()}
        />
        <Button
          label="Sign out"
          variant="secondary"
          onPress={() => void signOut()}
          loading={signingOut}
        />
      </View>
    );
  }

  const { profile, email, preferences } = me.data;

  function save() {
    if (!draft) return;
    const parsed = updateMeRequestSchema.safeParse({
      displayName: draft.displayName,
      homeArea: draft.homeArea.trim() === '' ? null : draft.homeArea,
    });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'displayName') next.displayName ??= 'Use 2 to 60 characters.';
        if (issue.path[0] === 'homeArea')
          next.homeArea ??= 'Use 2 to 80 characters, or leave it empty.';
      }
      setErrors(next);
      return;
    }
    setErrors({});
    updateMe.mutate(parsed.data, { onSuccess: () => setDraft(undefined) });
  }

  if (editingPreferences) {
    return <PreferencesEditor initial={preferences} onDone={() => setEditingPreferences(false)} />;
  }

  if (draft) {
    return (
      <View style={styles.section}>
        <TextField
          label="Display name"
          value={draft.displayName}
          onChangeText={(displayName) => setDraft({ ...draft, displayName })}
          error={errors.displayName}
        />
        <TextField
          label="Home area"
          value={draft.homeArea}
          onChangeText={(homeArea) => setDraft({ ...draft, homeArea })}
          error={errors.homeArea}
          placeholder="City or district, never an address"
        />
        {updateMe.isError ? (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {updateMe.error.message}
          </ThemedText>
        ) : null}
        <Button label="Save" onPress={save} loading={updateMe.isPending} />
        <Button
          label="Cancel"
          variant="secondary"
          onPress={() => setDraft(undefined)}
          disabled={updateMe.isPending}
        />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="subtitle">{profile.displayName}</ThemedText>
        <ThemedText themeColor="textSecondary">{email}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {profile.homeArea ? `Rides around ${profile.homeArea}` : 'No home area set'}
        </ThemedText>
      </ThemedView>
      <Button
        label="Edit profile"
        onPress={() =>
          setDraft({ displayName: profile.displayName, homeArea: profile.homeArea ?? '' })
        }
      />
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Riding preferences</ThemedText>
        {summarise(preferences).map((line) => (
          <ThemedText key={line} type="small" themeColor="textSecondary">
            {line}
          </ThemedText>
        ))}
      </ThemedView>
      <Button
        label="Edit riding preferences"
        variant="secondary"
        onPress={() => setEditingPreferences(true)}
      />
      <Button
        label="Sign out"
        variant="secondary"
        onPress={() => void signOut()}
        loading={signingOut}
        disabled={deleteAccount.isPending}
      />
      {deleteAccount.isError ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          Your account could not be deleted. {deleteAccount.error.message}
        </ThemedText>
      ) : null}
      <Button
        label="Delete account"
        variant="danger"
        onPress={confirmDeleteAccount}
        loading={deleteAccount.isPending}
        disabled={signingOut}
      />
    </View>
  );
}

/** One short line per preference the member has set. */
export function summarise(preferences: Preferences): string[] {
  const lines: string[] = [];
  const list = <T extends string>(values: T[], labels: Record<T, string>) =>
    values.map((value) => labels[value]).join(', ');

  if (preferences.bikeTypes.length)
    lines.push(`Bikes: ${list(preferences.bikeTypes, bikeTypeLabels)}`);
  if (preferences.ridingStyles.length) {
    lines.push(`Style: ${list(preferences.ridingStyles, ridingStyleLabels)}`);
  }
  if (preferences.pace) lines.push(`Pace: ${paceLabels[preferences.pace]}`);
  if (preferences.experience) lines.push(`Experience: ${experienceLabels[preferences.experience]}`);
  const { distanceMinKm: min, distanceMaxKm: max } = preferences;
  if (min !== null && max !== null) lines.push(`Distance: ${min}–${max} km`);
  else if (min !== null) lines.push(`Distance: from ${min} km`);
  else if (max !== null) lines.push(`Distance: up to ${max} km`);
  if (preferences.languages.length) {
    lines.push(`Languages: ${list(preferences.languages, languageLabels)}`);
  }
  return lines.length ? lines : ['Nothing set yet.'];
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  card: {
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Radius.medium,
  },
});

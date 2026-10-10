import { updateMeRequestSchema } from '@ridesphere/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { StateView } from '@/components/state-view';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useMe, useUpdateMe } from '@/features/profile/use-me';
import { authClient } from '@/lib/auth-client';
import { Radius, Spacing } from '@/theme';

export function ProfileView() {
  const queryClient = useQueryClient();
  const me = useMe();
  const updateMe = useUpdateMe();
  const [draft, setDraft] = useState<{ displayName: string; homeArea: string }>();
  const [errors, setErrors] = useState<{ displayName?: string; homeArea?: string }>({});
  const [signingOut, setSigningOut] = useState(false);

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

  const { profile, email } = me.data;

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
      <Button
        label="Sign out"
        variant="secondary"
        onPress={() => void signOut()}
        loading={signingOut}
      />
    </View>
  );
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

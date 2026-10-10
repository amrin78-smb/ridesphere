import {
  bikeTypes,
  experienceLevels,
  MAX_DISTANCE_KM,
  paces,
  type Preferences,
  ridingStyles,
  spokenLanguages,
  updatePreferencesRequestSchema,
} from '@ridesphere/shared';
import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import {
  bikeTypeLabels,
  experienceLabels,
  languageLabels,
  paceLabels,
  ridingStyleLabels,
} from '@/features/profile/labels';
import { useUpdatePreferences } from '@/features/profile/use-me';
import { Spacing } from '@/theme';

type Props = {
  initial: Preferences;
  onDone: () => void;
};

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <ThemedText type="smallBold" accessibilityRole="header">
        {title}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

const toText = (value: number | null) => (value === null ? '' : String(value));

/** Empty means "not said"; anything else must be a whole number, checked by the schema. */
function toDistance(text: string): number | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : Number(trimmed);
}

export function PreferencesEditor({ initial, onDone }: Props) {
  const update = useUpdatePreferences();
  const [draft, setDraft] = useState(initial);
  const [minText, setMinText] = useState(toText(initial.distanceMinKm));
  const [maxText, setMaxText] = useState(toText(initial.distanceMaxKm));
  const [distanceError, setDistanceError] = useState<string>();

  function save() {
    const parsed = updatePreferencesRequestSchema.safeParse({
      ...draft,
      distanceMinKm: toDistance(minText),
      distanceMaxKm: toDistance(maxText),
    });
    if (!parsed.success) {
      const reversed = parsed.error.issues.some((issue) => issue.code === 'custom');
      setDistanceError(
        reversed
          ? 'The shortest distance cannot be longer than the longest.'
          : `Use whole numbers from 1 to ${MAX_DISTANCE_KM}, or leave them empty.`,
      );
      return;
    }
    setDistanceError(undefined);
    update.mutate(parsed.data, { onSuccess: onDone });
  }

  return (
    <View style={styles.editor}>
      <Group title="Bikes you ride" hint="Choose any that apply.">
        {bikeTypes.map((value) => (
          <Chip
            key={value}
            role="checkbox"
            label={bikeTypeLabels[value]}
            selected={draft.bikeTypes.includes(value)}
            onPress={() => setDraft({ ...draft, bikeTypes: toggled(draft.bikeTypes, value) })}
          />
        ))}
      </Group>

      <Group title="How you like to ride" hint="Choose any that apply.">
        {ridingStyles.map((value) => (
          <Chip
            key={value}
            role="checkbox"
            label={ridingStyleLabels[value]}
            selected={draft.ridingStyles.includes(value)}
            onPress={() => setDraft({ ...draft, ridingStyles: toggled(draft.ridingStyles, value) })}
          />
        ))}
      </Group>

      <Group title="Usual pace" hint="Tap again to clear.">
        {paces.map((value) => (
          <Chip
            key={value}
            role="radio"
            label={paceLabels[value]}
            selected={draft.pace === value}
            onPress={() => setDraft({ ...draft, pace: draft.pace === value ? null : value })}
          />
        ))}
      </Group>

      <Group title="Experience" hint="Your own view. Tap again to clear.">
        {experienceLevels.map((value) => (
          <Chip
            key={value}
            role="radio"
            label={experienceLabels[value]}
            selected={draft.experience === value}
            onPress={() =>
              setDraft({ ...draft, experience: draft.experience === value ? null : value })
            }
          />
        ))}
      </Group>

      <View style={styles.group}>
        <ThemedText type="smallBold" accessibilityRole="header">
          Ride distance you enjoy
        </ThemedText>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextField
              label="Shortest (km)"
              value={minText}
              onChangeText={setMinText}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <View style={styles.rowItem}>
            <TextField
              label="Longest (km)"
              value={maxText}
              onChangeText={setMaxText}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        </View>
        {distanceError ? (
          <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
            {distanceError}
          </ThemedText>
        ) : null}
      </View>

      <Group title="Languages you ride in" hint="Choose any that apply.">
        {spokenLanguages.map((value) => (
          <Chip
            key={value}
            role="checkbox"
            label={languageLabels[value]}
            selected={draft.languages.includes(value)}
            onPress={() => setDraft({ ...draft, languages: toggled(draft.languages, value) })}
          />
        ))}
      </Group>

      {update.isError ? (
        <ThemedText type="small" themeColor="danger" accessibilityRole="alert">
          {update.error.message}
        </ThemedText>
      ) : null}
      <Button label="Save preferences" onPress={save} loading={update.isPending} />
      <Button label="Cancel" variant="secondary" onPress={onDone} disabled={update.isPending} />
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    gap: Spacing.four,
  },
  group: {
    gap: Spacing.two,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rowItem: {
    flex: 1,
  },
});

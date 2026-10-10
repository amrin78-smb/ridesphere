import { bikeTypes, difficulties, paces, terrains } from '@ridesphere/shared';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { bikeTypeLabels } from '@/features/profile/labels';
import { difficultyLabels, paceShortLabels, terrainLabels } from '@/features/rides/labels';
import type { RideFilters } from '@/features/rides/use-rides';
import { Spacing } from '@/theme';

type Props = {
  filters: RideFilters;
  onChange: (filters: RideFilters) => void;
};

type ChoiceKey = 'bikeType' | 'pace' | 'terrain' | 'difficulty';

/** One row of single-choice chips. Tapping the selected chip clears it. */
function ChoiceRow<K extends ChoiceKey>({
  title,
  field,
  values,
  labels,
  filters,
  onChange,
}: Props & {
  title: string;
  field: K;
  values: readonly NonNullable<RideFilters[K]>[];
  labels: Record<NonNullable<RideFilters[K]>, string>;
}) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {title}
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={title}>
          {values.map((value) => (
            <Chip
              key={value}
              role="radio"
              label={labels[value]}
              selected={filters[field] === value}
              onPress={() =>
                onChange({ ...filters, [field]: filters[field] === value ? undefined : value })
              }
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function activeFilterCount(filters: RideFilters): number {
  return [
    filters.q?.trim(),
    filters.bikeType,
    filters.pace,
    filters.terrain,
    filters.difficulty,
  ].filter(Boolean).length;
}

/** Search plus one always-visible filter; the rest stay folded away on small screens. */
export function RideFiltersBar({ filters, onChange }: Props) {
  const [search, setSearch] = useState(filters.q ?? '');
  const [expanded, setExpanded] = useState(false);
  const hidden = [filters.pace, filters.terrain, filters.difficulty].filter(Boolean).length;
  const common = { filters, onChange };

  return (
    <View style={styles.bar}>
      <TextField
        label="Search rides"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={() => onChange({ ...filters, q: search })}
        onBlur={() => onChange({ ...filters, q: search })}
        placeholder="Place, name or word"
        returnKeyType="search"
        autoCorrect={false}
      />
      <ChoiceRow
        title="Bike"
        field="bikeType"
        values={bikeTypes}
        labels={bikeTypeLabels}
        {...common}
      />
      {expanded ? (
        <>
          <ChoiceRow
            title="Pace"
            field="pace"
            values={paces}
            labels={paceShortLabels}
            {...common}
          />
          <ChoiceRow
            title="Surface"
            field="terrain"
            values={terrains}
            labels={terrainLabels}
            {...common}
          />
          <ChoiceRow
            title="Difficulty"
            field="difficulty"
            values={difficulties}
            labels={difficultyLabels}
            {...common}
          />
        </>
      ) : null}
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label={
              expanded ? 'Fewer filters' : hidden ? `More filters (${hidden} set)` : 'More filters'
            }
            variant="secondary"
            onPress={() => setExpanded(!expanded)}
          />
        </View>
        {activeFilterCount(filters) > 0 ? (
          <View style={styles.action}>
            <Button
              label="Clear all"
              variant="secondary"
              onPress={() => {
                setSearch('');
                onChange({});
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.one,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});

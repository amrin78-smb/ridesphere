import type { RideSummary } from '@ridesphere/shared';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatDistance, formatRideStart } from '@/features/rides/format';
import { difficultyLabels, paceShortLabels } from '@/features/rides/labels';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/theme';

/** Marks synthetic demonstration content so it is never mistaken for a real ride. */
export function SampleBadge() {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="small">Sample</ThemedText>
    </View>
  );
}

type RideCardProps = {
  ride: RideSummary;
  onPress: () => void;
};

export function RideCard({ ride, onPress }: RideCardProps) {
  const when = formatRideStart(ride.startsAt, ride.timezone);
  const facts = [
    ride.area,
    formatDistance(ride.distanceKm),
    paceShortLabels[ride.pace],
    difficultyLabels[ride.difficulty],
  ].join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${ride.title}. ${when}. ${facts}.${ride.isSample ? ' Sample ride.' : ''}`}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.titleRow}>
          <ThemedText type="smallBold" style={styles.title}>
            {ride.title}
          </ThemedText>
          {ride.isSample ? <SampleBadge /> : null}
        </View>
        <ThemedText type="small">{when}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {facts}
        </ThemedText>
        {ride.club ? (
          <ThemedText type="small" themeColor="textSecondary">
            {ride.club.name}
          </ThemedText>
        ) : null}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.small,
  },
  pressed: {
    opacity: 0.7,
  },
});

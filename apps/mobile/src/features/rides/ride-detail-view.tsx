import type { RideDetail } from '@ridesphere/shared';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { bikeTypeLabels, paceLabels } from '@/features/profile/labels';
import { formatDistance, formatElevation, formatRideStart } from '@/features/rides/format';
import {
  difficultyLabels,
  meetingDetailsHiddenMessages,
  terrainLabels,
} from '@/features/rides/labels';
import { SampleBadge } from '@/features/rides/ride-card';
import { Radius, Spacing } from '@/theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.section}>
      <ThemedText type="smallBold" accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.factLabel}>
        {label}
      </ThemedText>
      <ThemedText type="small" style={styles.factValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export function RideDetailView({ ride }: { ride: RideDetail }) {
  const elevation = formatElevation(ride.elevationM);
  const { meetingPoint } = ride;

  return (
    <View style={styles.detail}>
      <View style={styles.titleRow}>
        <ThemedText type="subtitle" accessibilityRole="header" style={styles.title}>
          {ride.title}
        </ThemedText>
        {ride.isSample ? <SampleBadge /> : null}
      </View>
      {ride.isSample ? (
        <ThemedText type="small" themeColor="textSecondary">
          This is a made-up ride that shows how RideSphere works. It will not take place.
        </ThemedText>
      ) : null}
      <ThemedText>{formatRideStart(ride.startsAt, ride.timezone)}</ThemedText>
      {ride.endsAt ? (
        <ThemedText type="small" themeColor="textSecondary">
          Until {formatRideStart(ride.endsAt, ride.timezone)}
        </ThemedText>
      ) : null}
      {ride.description ? <ThemedText>{ride.description}</ThemedText> : null}

      <Section title="The ride">
        <Fact label="Area" value={ride.area} />
        <Fact label="Distance" value={formatDistance(ride.distanceKm)} />
        {elevation ? <Fact label="Climbing" value={elevation} /> : null}
        <Fact label="Pace" value={paceLabels[ride.pace]} />
        <Fact label="Difficulty" value={difficultyLabels[ride.difficulty]} />
        <Fact label="Surface" value={terrainLabels[ride.terrain]} />
        {ride.bikeTypes.length ? (
          <Fact label="Bikes" value={ride.bikeTypes.map((b) => bikeTypeLabels[b]).join(', ')} />
        ) : null}
        {ride.capacity !== null ? <Fact label="Places" value={`${ride.capacity} riders`} /> : null}
        <ThemedText type="small" themeColor="textSecondary">
          Distance, pace and difficulty are provided by the organiser. They are not a guarantee of
          route safety or conditions on the day.
        </ThemedText>
      </Section>

      <Section title="Where to meet">
        <ThemedText type="small">{meetingPoint.name}</ThemedText>
        {meetingPoint.details ? (
          <ThemedText type="small">{meetingPoint.details}</ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            {meetingDetailsHiddenMessages[meetingPoint.detailsVisibleTo]}
          </ThemedText>
        )}
      </Section>

      {ride.requirements ? (
        <Section title="What you need">
          <ThemedText type="small">{ride.requirements}</ThemedText>
        </Section>
      ) : null}

      {ride.cancellationPolicy ? (
        <Section title="If plans change">
          <ThemedText type="small">{ride.cancellationPolicy}</ThemedText>
        </Section>
      ) : null}

      {ride.organiser || ride.club ? (
        <Section title="Organised by">
          {ride.club ? <ThemedText type="small">{ride.club.name}</ThemedText> : null}
          {ride.organiser ? (
            <ThemedText type="small">{ride.organiser.displayName}</ThemedText>
          ) : null}
        </Section>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        Joining rides from the app is not available yet.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  detail: {
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  section: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  fact: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  factLabel: {
    width: 88,
  },
  factValue: {
    flex: 1,
  },
});

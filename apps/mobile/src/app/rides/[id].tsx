import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StateView } from '@/components/state-view';
import { RideDetailView } from '@/features/rides/ride-detail-view';
import { useRide } from '@/features/rides/use-rides';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/theme';

export default function RideScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const ride = useRide(id);
  const notFound = ride.error instanceof ApiError && ride.error.details.status === 404;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          paddingLeft: insets.left + Spacing.four,
          paddingRight: insets.right + Spacing.four,
        },
      ]}>
      <View style={styles.inner}>
        {ride.isPending ? (
          <StateView kind="loading" title="Loading ride" />
        ) : ride.isError ? (
          notFound ? (
            <StateView
              kind="empty"
              title="Ride not found"
              message="It may have been removed, or you may need to sign in to see it."
            />
          ) : (
            <StateView
              kind="error"
              title="Could not load this ride"
              message={ride.error.message}
              onRetry={() => void ride.refetch()}
            />
          )
        ) : (
          <RideDetailView ride={ride.data} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
});

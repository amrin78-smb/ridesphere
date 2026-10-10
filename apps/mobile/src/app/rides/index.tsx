import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { StateView } from '@/components/state-view';
import { ThemedText } from '@/components/themed-text';
import { RideCard } from '@/features/rides/ride-card';
import { activeFilterCount, RideFiltersBar } from '@/features/rides/ride-filters';
import { type RideFilters, useRides } from '@/features/rides/use-rides';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/theme';

export default function RidesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filters, setFilters] = useState<RideFilters>({});
  const rides = useRides(filters);
  const items = rides.data?.pages.flatMap((page) => page.items) ?? [];
  const filtered = activeFilterCount(filters) > 0;

  return (
    <FlatList
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Spacing.four,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          paddingLeft: insets.left + Spacing.four,
          paddingRight: insets.right + Spacing.four,
        },
      ]}
      data={items}
      keyExtractor={(ride) => ride.id}
      renderItem={({ item }) => (
        <RideCard
          ride={item}
          onPress={() => router.push({ pathname: '/rides/[id]', params: { id: item.id } })}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={rides.isRefetching && !rides.isFetchingNextPage}
          onRefresh={() => void rides.refetch()}
          tintColor={theme.text}
        />
      }
      onEndReachedThreshold={0.5}
      onEndReached={() => {
        if (rides.hasNextPage && !rides.isFetchingNextPage) void rides.fetchNextPage();
      }}
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText type="title" accessibilityRole="header">
            Rides
          </ThemedText>
          <ThemedText themeColor="textSecondary">Find a ride that suits your pace.</ThemedText>
          <RideFiltersBar filters={filters} onChange={setFilters} />
        </View>
      }
      ListEmptyComponent={
        rides.isPending ? (
          <StateView kind="loading" title="Finding rides" />
        ) : rides.isError ? (
          <StateView
            kind="error"
            title="Could not load rides"
            message={rides.error.message}
            onRetry={() => void rides.refetch()}
          />
        ) : (
          <StateView
            kind="empty"
            title={filtered ? 'No rides match' : 'No upcoming rides yet'}
            message={
              filtered
                ? 'Try removing a filter or searching for something else.'
                : 'Check back soon. New rides appear here as organisers publish them.'
            }
          />
        )
      }
      ListFooterComponent={
        <View style={styles.footer}>
          {rides.isFetchingNextPage ? <ActivityIndicator color={theme.text} /> : null}
          {rides.isFetchNextPageError ? (
            <Button
              label="Could not load more. Try again"
              variant="secondary"
              onPress={() => void rides.fetchNextPage()}
            />
          ) : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  separator: {
    height: Spacing.three,
  },
  footer: {
    paddingTop: Spacing.three,
  },
});

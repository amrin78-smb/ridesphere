import { Screen } from '@/components/screen';
import { ApiStatus } from '@/features/system/api-status';

export default function ExploreScreen() {
  return (
    <Screen title="Explore" subtitle="Your cycling community. Your next adventure.">
      <ApiStatus />
    </Screen>
  );
}

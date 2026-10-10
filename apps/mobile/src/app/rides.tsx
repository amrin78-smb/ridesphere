import { Screen } from '@/components/screen';
import { StateView } from '@/components/state-view';

export default function RidesScreen() {
  return (
    <Screen title="Rides" subtitle="Find a ride that suits your pace.">
      <StateView
        kind="empty"
        title="Not built yet"
        message="Ride discovery arrives in a later increment."
      />
    </Screen>
  );
}

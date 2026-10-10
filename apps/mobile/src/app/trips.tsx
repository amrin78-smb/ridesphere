import { Screen } from '@/components/screen';
import { StateView } from '@/components/state-view';

export default function TripsScreen() {
  return (
    <Screen title="Trips" subtitle="Destinations and organised cycling trips.">
      <StateView kind="empty" title="Not built yet" message="Trips arrive in a later increment." />
    </Screen>
  );
}

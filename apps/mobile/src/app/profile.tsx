import { Screen } from '@/components/screen';
import { StateView } from '@/components/state-view';

export default function ProfileScreen() {
  return (
    <Screen title="Profile" subtitle="Your riding preferences and account.">
      <StateView
        kind="empty"
        title="Not built yet"
        message="Sign-in and profiles arrive in a later increment."
      />
    </Screen>
  );
}

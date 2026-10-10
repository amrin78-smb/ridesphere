import { Screen } from '@/components/screen';
import { StateView } from '@/components/state-view';

export default function CommunityScreen() {
  return (
    <Screen title="Community" subtitle="Stories and conversations from riders.">
      <StateView
        kind="empty"
        title="Not built yet"
        message="Posts and comments arrive in a later increment."
      />
    </Screen>
  );
}

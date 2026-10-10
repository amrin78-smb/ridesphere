import { StateView } from '@/components/state-view';
import { useApiHealth } from '@/features/system/use-api-health';
import { ApiError } from '@/lib/api';

/** Shows whether the app can reach the API. Development aid until real content replaces it. */
export function ApiStatus() {
  const health = useApiHealth();

  if (health.isPending) {
    return <StateView kind="loading" title="Connecting to RideSphere" />;
  }

  if (health.isError) {
    const notConfigured =
      health.error instanceof ApiError && health.error.kind === 'not-configured';
    return (
      <StateView
        kind="error"
        title={notConfigured ? 'Server not configured' : 'Cannot connect'}
        message={
          notConfigured
            ? 'Set EXPO_PUBLIC_API_BASE_URL in apps/mobile/.env and restart the app.'
            : health.error.message
        }
        onRetry={notConfigured ? undefined : () => void health.refetch()}
      />
    );
  }

  return (
    <StateView
      kind="empty"
      title="Connected"
      message={`The RideSphere API is reachable (${health.data.environment}).`}
    />
  );
}

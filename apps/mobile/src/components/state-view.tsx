import { ActivityIndicator, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Radius, Spacing } from '@/theme';

type StateViewProps =
  | { kind: 'loading'; title: string }
  | { kind: 'empty'; title: string; message?: string }
  | { kind: 'error'; title: string; message?: string; onRetry?: () => void };

/** The loading, empty and error states every data-backed screen needs. */
export function StateView(props: StateViewProps) {
  const theme = useTheme();
  const message = props.kind === 'loading' ? undefined : props.message;
  const onRetry = props.kind === 'error' ? props.onRetry : undefined;

  return (
    <ThemedView
      type="backgroundElement"
      style={styles.container}
      accessibilityRole={props.kind === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={props.kind === 'error' ? 'polite' : 'none'}>
      {props.kind === 'loading' ? <ActivityIndicator color={theme.text} /> : null}
      <ThemedText type="smallBold" themeColor={props.kind === 'error' ? 'danger' : 'text'}>
        {props.title}
      </ThemedText>
      {message ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
      {onRetry ? <Button label="Try again" onPress={onRetry} /> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.medium,
  },
  message: {
    textAlign: 'center',
  },
});

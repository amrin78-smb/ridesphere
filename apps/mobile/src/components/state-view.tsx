import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { MinTouchTarget, Radius, Spacing } from '@/theme';

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
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: theme.accent },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.onAccent }}>
            Try again
          </ThemedText>
        </Pressable>
      ) : null}
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
  button: {
    minHeight: MinTouchTarget,
    minWidth: MinTouchTarget,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

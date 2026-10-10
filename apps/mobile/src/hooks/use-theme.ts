/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  // The system can report no preference; treat anything other than dark as light.
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}

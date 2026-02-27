import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ICON_MUTED } from '@/constants/colors';

export default function ExploreScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <IconSymbol name="paperplane.fill" size={64} color={ICON_MUTED} />
        <ThemedText type="title" style={styles.title}>
          Coming Soon
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          We're working on something exciting. Check back later!
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 80,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.8,
  },
});

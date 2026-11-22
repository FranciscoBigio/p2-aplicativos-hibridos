import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
} from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../src/theme/colors';
import { getSession, subscribeAuthChange } from '../src/services/storage';
import LoadingView from '../src/components/LoadingView';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const storedSession = await getSession();
        if (mounted) {
          setSession(storedSession);
        }
      } catch (err) {
        console.warn('[RootLayout] Erro ao ler sessão inicial:', err);
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    bootstrap();
    const unsubscribe = subscribeAuthChange((nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const navigationReady = Boolean(rootNavigationState?.key);

  useEffect(() => {
    if (!isReady || !navigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, isReady, navigationReady, router]);

  return (
    <SafeAreaProvider style={styles.root}>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create" />
        <Stack.Screen name="character/[id]" />
        <Stack.Screen name="details/api-item" />
        <Stack.Screen name="monster/[index]" />
      </Stack>

      {!isReady ? (
        <View style={styles.loadingOverlay}>
          <LoadingView message="Abrindo o Grimório D&D 5e..." />
        </View>
      ) : null}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 99,
  },
});

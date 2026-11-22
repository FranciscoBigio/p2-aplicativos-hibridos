import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../src/theme/colors';
import { getSession, subscribeAuthChange } from '../src/services/storage';
import LoadingView from '../src/components/LoadingView';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const storedSession = await getSession();
      if (mounted) {
        setSession(storedSession);
        setIsReady(true);
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

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments, isReady, router]);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <LoadingView message="Abrindo o Grimório D&D 5e..." />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create" />
        <Stack.Screen name="character/[id]" />
        <Stack.Screen name="details/api-item" />
        <Stack.Screen name="monster/[index]" />
      </Stack>
    </SafeAreaProvider>
  );
}

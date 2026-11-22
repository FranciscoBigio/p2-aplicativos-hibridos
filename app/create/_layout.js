import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../src/theme/colors';

export default function CreateCharacterLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="step1-identity" />
      <Stack.Screen name="step2-attributes" />
    </Stack>
  );
}

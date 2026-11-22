import React from 'react';
import { Tabs, useLocalSearchParams, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../../src/theme/colors';

export default function CharacterDetailLayout() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.card,
          borderBottomColor: COLORS.border,
          borderBottomWidth: 1,
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 15.5,
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginLeft: 12, padding: 4 }}
          >
            <Ionicons name="arrow-back" size={21} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ),
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 54 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
        },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        initialParams={{ id }}
        options={{
          title: 'Ficha',
          headerTitle: 'Visão Geral da Ficha',
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="weapons"
        initialParams={{ id }}
        options={{
          title: 'Armas',
          headerTitle: 'Armas & Ataques',
          tabBarIcon: ({ color }) => (
            <Ionicons name="flash-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        initialParams={{ id }}
        options={{
          title: 'Inventário',
          headerTitle: 'Mochila & Equipamentos',
          tabBarIcon: ({ color }) => (
            <Ionicons name="bag-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="spells"
        initialParams={{ id }}
        options={{
          title: 'Grimório',
          headerTitle: 'Grimório & Magias',
          tabBarIcon: ({ color }) => (
            <Ionicons name="sparkles-outline" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

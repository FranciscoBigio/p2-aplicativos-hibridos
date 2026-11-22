import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../src/theme/colors';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
          fontWeight: '600',
        },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Personagens',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compendium"
        options={{
          title: 'Compêndio',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="monsters"
        options={{
          title: 'Monstros',
          tabBarIcon: ({ color }) => (
            <Ionicons name="skull-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dice"
        options={{
          title: 'Dados',
          tabBarIcon: ({ color }) => (
            <Ionicons name="dice-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/theme/colors';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';

export default function CharactersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Meus Personagens</Text>
          <Text style={styles.subtitle}>Gerencie suas fichas de D&D 5e</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/create/step1-identity')}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <CustomInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar personagem por nome, raça ou classe..."
          icon="search-outline"
          showClear
          style={styles.searchInput}
        />
      </View>

      <View style={styles.placeholderWrap}>
        <Ionicons name="shield-outline" size={52} color={COLORS.textMuted} />
        <Text style={styles.emptyTitle}>Suas fichas aparecerão aqui</Text>
        <Text style={styles.emptySubtitle}>
          Crie um novo personagem passo a passo usando dados reais da API D&D 5e.
        </Text>
        <CustomButton
          title="Criar Novo Personagem"
          icon="add-circle-outline"
          onPress={() => router.push('/create/step1-identity')}
          style={styles.ctaBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  searchInput: {
    marginBottom: SPACING.sm,
  },
  placeholderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaBtn: {
    marginTop: SPACING.md,
  },
});

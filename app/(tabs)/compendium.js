import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/theme/colors';
import CustomInput from '../../src/components/CustomInput';

const CATEGORIES = [
  {
    key: 'spells',
    label: 'Magias',
    icon: 'sparkles-outline',
    color: COLORS.magicLight,
    endpoint: '/api/spells',
    description: 'Consulte escolas, níveis, componentes e efeitos das magias.',
  },
  {
    key: 'equipment',
    label: 'Equipamentos',
    icon: 'hammer-outline',
    color: COLORS.primaryLight,
    endpoint: '/api/equipment',
    description: 'Armas, armaduras, ferramentas e itens de aventura.',
  },
  {
    key: 'races',
    label: 'Raças',
    icon: 'body-outline',
    color: COLORS.success,
    endpoint: '/api/races',
    description: 'Bônus de atributo, traços raciais, idiomas e deslocamento.',
  },
  {
    key: 'classes',
    label: 'Classes',
    icon: 'shield-outline',
    color: COLORS.danger,
    endpoint: '/api/classes',
    description: 'Dado de vida, salvaguardas e proficiências de cada classe.',
  },
];

export default function CompendiumScreen() {
  const [selectedCategory, setSelectedCategory] = useState('spells');
  const [search, setSearch] = useState('');

  const activeCategory =
    CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Compêndio D&D 5e</Text>
        <Text style={styles.subtitle}>
          Explore o acervo oficial de regras e referências
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <CustomInput
          value={search}
          onChangeText={setSearch}
          placeholder={`Pesquisar em ${activeCategory.label}...`}
          icon="search-outline"
          showClear
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat.key === selectedCategory;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.8}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Ionicons
                  name={cat.icon}
                  size={16}
                  color={isActive ? COLORS.white : cat.color}
                />
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.previewWrap}>
        <View style={styles.previewCard}>
          <View style={styles.previewIconWrap}>
            <Ionicons
              name={activeCategory.icon}
              size={30}
              color={activeCategory.color}
            />
          </View>
          <Text style={styles.previewTitle}>{activeCategory.label}</Text>
          <Text style={styles.previewDescription}>
            {activeCategory.description}
          </Text>
          <View style={styles.endpointBadge}>
            <Text style={styles.endpointText}>{activeCategory.endpoint}</Text>
          </View>
        </View>
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
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
  searchWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  searchInput: {
    marginBottom: SPACING.sm,
  },
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  previewWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  previewCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  previewIconWrap: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  previewTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  previewDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  endpointBadge: {
    marginTop: SPACING.xs,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  endpointText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});

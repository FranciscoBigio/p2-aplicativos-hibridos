import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, LAYOUT } from '../../src/theme/colors';
import CustomInput from '../../src/components/CustomInput';
import LoadingView from '../../src/components/LoadingView';
import { fetchCompendiumList } from '../../src/services/dndApi';

const CATEGORIES = [
  {
    key: 'spells',
    label: 'Magias',
    icon: 'sparkles-outline',
    color: COLORS.magicLight,
    badgeBg: COLORS.magicMuted,
  },
  {
    key: 'equipment',
    label: 'Equipamentos',
    icon: 'hammer-outline',
    color: COLORS.primaryLight,
    badgeBg: COLORS.primaryMuted,
  },
  {
    key: 'races',
    label: 'Raças',
    icon: 'body-outline',
    color: COLORS.success,
    badgeBg: COLORS.successMuted,
  },
  {
    key: 'classes',
    label: 'Classes',
    icon: 'shield-outline',
    color: COLORS.danger,
    badgeBg: COLORS.dangerMuted,
  },
];

export default function CompendiumScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('spells');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeCategory =
    CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchCompendiumList(selectedCategory);
      setItems(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        (item.name || '').toLowerCase().includes(q) ||
        (item.index || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  function handleSelectCategory(key) {
    if (key === selectedCategory) return;
    setSelectedCategory(key);
    setSearch('');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Compêndio D&D 5e</Text>
          {!loading && !error ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredItems.length} itens</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          Explore magias, equipamentos, raças e classes em tempo real
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
                onPress={() => handleSelectCategory(cat.key)}
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

      {loading ? (
        <LoadingView message={`Carregando ${activeCategory.label.toLowerCase()} da API D&D 5e...`} />
      ) : error ? (
        <LoadingView error={error} onRetry={loadItems} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.index}
          contentContainerStyle={
            filteredItems.length === 0 ? styles.emptyList : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Tente buscar outro termo em {activeCategory.label}.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/details/api-item',
                  params: {
                    category: selectedCategory,
                    index: item.index,
                    name: item.name,
                  },
                })
              }
            >
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: activeCategory.badgeBg },
                ]}
              >
                <Ionicons
                  name={activeCategory.icon}
                  size={19}
                  color={activeCategory.color}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {activeCategory.label}
                  {item.level !== undefined ? ` • Nível ${item.level}` : ''}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        />
      )}
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
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  countText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  searchWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },
  searchInput: {
    marginBottom: SPACING.sm,
  },
  filterContainer: {
    marginBottom: SPACING.sm,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
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
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  cardSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.xs + 2,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
});

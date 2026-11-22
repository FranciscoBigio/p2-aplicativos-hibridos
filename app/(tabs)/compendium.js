import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZE,
  LAYOUT,
} from '../../src/theme/colors';
import CustomInput from '../../src/components/CustomInput';
import LoadingView from '../../src/components/LoadingView';
import {
  fetchCompendiumList,
  fetchSpellsByClass,
} from '../../src/services/dndApi';

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

const SPELLCASTER_CLASSES = [
  { key: 'all', label: 'Todas as Classes' },
  { key: 'bard', label: 'Bardo' },
  { key: 'cleric', label: 'Clérigo' },
  { key: 'druid', label: 'Druida' },
  { key: 'sorcerer', label: 'Feiticeiro' },
  { key: 'warlock', label: 'Bruxo' },
  { key: 'wizard', label: 'Mago' },
  { key: 'paladin', label: 'Paladino' },
  { key: 'ranger', label: 'Patrulheiro' },
];

function getSpellLevelTitle(level) {
  if (level === 0) return 'Truques (Nível 0)';
  return `${level}º Círculo (Nível ${level})`;
}

export default function CompendiumScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('spells');
  const [selectedSpellClass, setSelectedSpellClass] = useState('all');
  const [collapsedLevels, setCollapsedLevels] = useState({});
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeCategory =
    CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];

  const activeSpellClass =
    SPELLCASTER_CLASSES.find((c) => c.key === selectedSpellClass) ||
    SPELLCASTER_CLASSES[0];

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results =
        selectedCategory === 'spells'
          ? await fetchSpellsByClass(selectedSpellClass)
          : await fetchCompendiumList(selectedCategory);
      setItems(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSpellClass]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = !q
      ? [...items]
      : items.filter(
          (item) =>
            (item.name || '').toLowerCase().includes(q) ||
            (item.index || '').toLowerCase().includes(q)
        );

    if (selectedCategory === 'spells') {
      return base.sort((a, b) => {
        const levelDiff = (Number(a.level) || 0) - (Number(b.level) || 0);
        if (levelDiff !== 0) return levelDiff;
        return (a.name || '').localeCompare(b.name || '', 'pt-BR', {
          sensitivity: 'base',
        });
      });
    }

    return base.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'pt-BR', {
        sensitivity: 'base',
      })
    );
  }, [items, search, selectedCategory]);

  const spellSections = useMemo(() => {
    if (selectedCategory !== 'spells') return [];

    const isSearching = search.trim().length > 0;
    const grouped = new Map();
    filteredItems.forEach((spell) => {
      const lvl = Number(spell.level) || 0;
      if (!grouped.has(lvl)) {
        grouped.set(lvl, []);
      }
      grouped.get(lvl).push(spell);
    });

    return Array.from(grouped.entries())
      .sort(([lvlA], [lvlB]) => lvlA - lvlB)
      .map(([level, list]) => {
        const isCollapsed = !isSearching && Boolean(collapsedLevels[level]);
        return {
          level,
          title: getSpellLevelTitle(level),
          totalCount: list.length,
          isCollapsed,
          data: isCollapsed ? [] : list,
        };
      });
  }, [filteredItems, selectedCategory, collapsedLevels, search]);

  const allSpellLevelsCollapsed = useMemo(() => {
    if (spellSections.length === 0) return false;
    return spellSections.every((sec) => Boolean(collapsedLevels[sec.level]));
  }, [spellSections, collapsedLevels]);

  function handleToggleLevel(level) {
    setCollapsedLevels((prev) => ({
      ...prev,
      [level]: !prev[level],
    }));
  }

  function handleToggleAllLevels() {
    if (allSpellLevelsCollapsed) {
      setCollapsedLevels({});
    } else {
      const next = {};
      spellSections.forEach((sec) => {
        next[sec.level] = true;
      });
      setCollapsedLevels(next);
    }
  }

  function handleSelectCategory(key) {
    if (key === selectedCategory) return;
    setSelectedCategory(key);
    setSearch('');
  }

  function renderCompendiumCard({ item }) {
    const isSpell = selectedCategory === 'spells';
    const levelLabel =
      item.level === 0 ? 'Truque' : `Nv. ${item.level ?? 0}`;

    return (
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
            {isSpell
              ? `${levelLabel}${
                  selectedSpellClass !== 'all'
                    ? ` • ${activeSpellClass.label}`
                    : ''
                }`
              : activeCategory.label}
          </Text>
        </View>
        {isSpell ? (
          <View style={styles.spellLevelPill}>
            <Text style={styles.spellLevelPillText}>{levelLabel}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  }

  const emptyComponent = (
    <View style={styles.emptyWrap}>
      <Ionicons name="search-outline" size={44} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>
      <Text style={styles.emptySubtitle}>
        {selectedCategory === 'spells' && selectedSpellClass !== 'all'
          ? `Nenhuma magia de ${activeSpellClass.label} encontrada para esta busca.`
          : `Tente buscar outro termo em ${activeCategory.label}.`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Compêndio D&D 5e</Text>
          {!loading && !error ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {filteredItems.length}{' '}
                {selectedCategory === 'spells' ? 'magias' : 'itens'}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          {selectedCategory === 'spells'
            ? 'Organizado por nível e ordem alfabética (A–Z)'
            : 'Explore magias, equipamentos, raças e classes em tempo real'}
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

      {selectedCategory === 'spells' ? (
        <View style={styles.classFilterContainer}>
          <View style={styles.classFilterHeader}>
            <Text style={styles.classFilterLabel}>Classe Conjuradora:</Text>
            {!loading && !error && spellSections.length > 0 ? (
              <TouchableOpacity
                style={styles.collapseAllBtn}
                activeOpacity={0.78}
                onPress={handleToggleAllLevels}
              >
                <Ionicons
                  name={
                    allSpellLevelsCollapsed
                      ? 'expand-outline'
                      : 'contract-outline'
                  }
                  size={13}
                  color={COLORS.primaryLight}
                />
                <Text style={styles.collapseAllText}>
                  {allSpellLevelsCollapsed
                    ? 'Expandir níveis'
                    : 'Minimizar todos'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {SPELLCASTER_CLASSES.map((cls) => {
              const isActive = cls.key === selectedSpellClass;
              return (
                <TouchableOpacity
                  key={cls.key}
                  activeOpacity={0.8}
                  style={[
                    styles.classChip,
                    isActive && styles.classChipActive,
                  ]}
                  onPress={() => setSelectedSpellClass(cls.key)}
                >
                  <Text
                    style={[
                      styles.classChipText,
                      isActive && styles.classChipTextActive,
                    ]}
                  >
                    {cls.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {loading ? (
        <LoadingView
          message={
            selectedCategory === 'spells' && selectedSpellClass !== 'all'
              ? `Carregando magias de ${activeSpellClass.label}...`
              : `Carregando ${activeCategory.label.toLowerCase()} da API D&D 5e...`
          }
        />
      ) : error ? (
        <LoadingView error={error} onRetry={loadItems} />
      ) : selectedCategory === 'spells' ? (
        <SectionList
          sections={spellSections}
          keyExtractor={(item) => item.index}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            spellSections.length === 0 ? styles.emptyList : styles.listContent
          }
          ListEmptyComponent={emptyComponent}
          renderSectionHeader={({ section }) => (
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                section.isCollapsed && styles.sectionHeaderCollapsed,
              ]}
              activeOpacity={0.78}
              onPress={() => handleToggleLevel(section.level)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons
                  name={section.isCollapsed ? 'chevron-forward' : 'chevron-down'}
                  size={16}
                  color={COLORS.magicLight}
                />
                <Ionicons name="sparkles" size={14} color={COLORS.magicLight} />
                <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
              </View>
              <Text style={styles.sectionHeaderCount}>
                {section.totalCount}{' '}
                {section.totalCount === 1 ? 'magia' : 'magias'}
              </Text>
            </TouchableOpacity>
          )}
          renderItem={renderCompendiumCard}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.index}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredItems.length === 0 ? styles.emptyList : styles.listContent
          }
          ListEmptyComponent={emptyComponent}
          renderItem={renderCompendiumCard}
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
  classFilterContainer: {
    marginBottom: SPACING.sm,
    gap: SPACING.xs + 2,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },
  classFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  classFilterLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  collapseAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  collapseAllText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  classChip: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
  },
  classChipActive: {
    backgroundColor: COLORS.magic,
    borderColor: COLORS.magicLight,
  },
  classChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  classChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxl,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionHeaderCollapsed: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  sectionHeaderTitle: {
    color: COLORS.magicLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderCount: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
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
    marginBottom: SPACING.sm,
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
  spellLevelPill: {
    backgroundColor: COLORS.magicMuted,
    borderWidth: 1,
    borderColor: COLORS.magic,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  spellLevelPillText: {
    color: COLORS.magicLight,
    fontSize: 10,
    fontWeight: '800',
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

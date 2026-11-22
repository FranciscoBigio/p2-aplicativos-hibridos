import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, LAYOUT } from '../../src/theme/colors';
import CustomInput from '../../src/components/CustomInput';
import LoadingView from '../../src/components/LoadingView';
import { fetchMonsters } from '../../src/services/dndApi';
import {
  getFavoriteMonsters,
  toggleFavoriteMonster,
} from '../../src/services/storage';
import { formatChallengeRating } from '../../src/utils/dndRules';

const MONSTER_FILTERS = [
  { key: 'all', label: 'Todos', icon: 'apps-outline' },
  { key: 'favorites', label: 'Favoritos', icon: 'star' },
  { key: 'low', label: 'ND Baixo 0-4', icon: 'shield-outline' },
  { key: 'mid', label: 'ND Médio 5-10', icon: 'flame-outline' },
  { key: 'high', label: 'ND Alto 11+', icon: 'skull-outline' },
];

export default function MonstersScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [monsters, setMonsters] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFavorites = useCallback(async () => {
    const stored = await getFavoriteMonsters();
    setFavorites(stored);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  const loadMonsters = useCallback(async () => {
    if (filter === 'favorites') {
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const results = await fetchMonsters(filter);
      setMonsters(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadMonsters();
  }, [loadMonsters]);

  const favoriteIndexSet = useMemo(
    () => new Set(favorites.map((f) => f.index)),
    [favorites]
  );

  const displayedMonsters = useMemo(() => {
    const source = filter === 'favorites' ? favorites : monsters;
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.index || '').toLowerCase().includes(q)
    );
  }, [filter, favorites, monsters, search]);

  async function handleToggleFavorite(monster) {
    const result = await toggleFavoriteMonster(monster);
    setFavorites(result.favorites);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Bestiário D&D 5e</Text>
          {!loading && !error ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {displayedMonsters.length} monstros
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          Filtre por Nível de Desafio (ND) e favorite criaturas
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <CustomInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar monstro por nome (ex: Dragon, Goblin)..."
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
          {MONSTER_FILTERS.map((item) => {
            const isActive = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.8}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setFilter(item.key)}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={
                    isActive
                      ? COLORS.white
                      : item.key === 'favorites'
                      ? COLORS.primaryLight
                      : COLORS.textSecondary
                  }
                />
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item.label}
                  {item.key === 'favorites' ? ` (${favorites.length})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <LoadingView message="Invocando bestiário da API D&D 5e..." />
      ) : error ? (
        <LoadingView error={error} onRetry={loadMonsters} />
      ) : (
        <FlatList
          data={displayedMonsters}
          keyExtractor={(item) => item.index}
          contentContainerStyle={
            displayedMonsters.length === 0 ? styles.emptyList : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons
                name={filter === 'favorites' ? 'star-outline' : 'skull-outline'}
                size={46}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {filter === 'favorites'
                  ? 'Nenhum monstro favoritado'
                  : 'Nenhum monstro encontrado'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'favorites'
                  ? 'Toque na estrela de qualquer criatura para salvá-la aqui.'
                  : 'Tente alterar o filtro de ND ou buscar outro nome.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isFav = favoriteIndexSet.has(item.index);
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(`/monster/${item.index}`)}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="skull-outline" size={20} color={COLORS.danger} />
                </View>

                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.cardIndex} numberOfLines={1}>
                    {item.challenge_rating !== undefined &&
                    item.challenge_rating !== null
                      ? `ND ${formatChallengeRating(item.challenge_rating)}${
                          item.type ? ` • ${item.type}` : ''
                        }`
                      : 'Toque para abrir o Stat Block completo'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.starBtn, isFav && styles.starBtnActive]}
                  onPress={() => handleToggleFavorite(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isFav ? 'star' : 'star-outline'}
                    size={20}
                    color={isFav ? COLORS.primaryLight : COLORS.textMuted}
                  />
                </TouchableOpacity>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            );
          }}
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
    backgroundColor: COLORS.dangerMuted,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 3,
  },
  countText: {
    color: COLORS.textPrimary,
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs + 1,
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
    gap: SPACING.sm + 2,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerMuted,
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
  cardIndex: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  starBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starBtnActive: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
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
    lineHeight: 20,
  },
});

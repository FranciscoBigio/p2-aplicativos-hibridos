import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/theme/colors';
import CustomInput from '../../src/components/CustomInput';
import LoadingView from '../../src/components/LoadingView';
import { fetchMonsters } from '../../src/services/dndApi';

export default function MonstersScreen() {
  const router = useRouter();
  const [monsters, setMonsters] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMonsters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchMonsters('all');
      setMonsters(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonsters();
  }, [loadMonsters]);

  const filteredMonsters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return monsters;
    return monsters.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.index || '').toLowerCase().includes(q)
    );
  }, [monsters, search]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Bestiário D&D 5e</Text>
          {!loading && !error ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>
                {filteredMonsters.length} monstros
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>
          Consulte criaturas e Stat Blocks direto da API oficial
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

      {loading ? (
        <LoadingView message="Invocando bestiário da API D&D 5e..." />
      ) : error ? (
        <LoadingView error={error} onRetry={loadMonsters} />
      ) : (
        <FlatList
          data={filteredMonsters}
          keyExtractor={(item) => item.index}
          contentContainerStyle={
            filteredMonsters.length === 0 ? styles.emptyList : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="skull-outline" size={46} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum monstro encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Tente buscar por outro nome em inglês (ex: Wolf, Lich, Beholder).
              </Text>
            </View>
          }
          renderItem={({ item }) => (
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
                  Ver Stat Block completo
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
  },
  searchInput: {
    marginBottom: SPACING.sm,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xxl,
    gap: SPACING.sm,
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

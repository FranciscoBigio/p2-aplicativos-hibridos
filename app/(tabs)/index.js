import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/theme/colors';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';
import LoadingView from '../../src/components/LoadingView';
import {
  getSession,
  getCharacters,
  deleteCharacter,
} from '../../src/services/storage';

export default function CharactersScreen() {
  const router = useRouter();
  const [characters, setCharacters] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCharacters = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const session = await getSession();
      const list = await getCharacters(session?.id);
      setCharacters(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCharacters(false);
    }, [loadCharacters])
  );

  const filteredCharacters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.raceName || '').toLowerCase().includes(q) ||
        (c.className || '').toLowerCase().includes(q) ||
        (c.background || '').toLowerCase().includes(q)
    );
  }, [characters, search]);

  async function performDelete(id) {
    await deleteCharacter(id);
    setCharacters((prev) => prev.filter((item) => item.id !== id));
  }

  function handleDeleteCharacter(character) {
    const message = `Deseja excluir permanentemente a ficha de "${character.name}"?`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        performDelete(character.id);
      }
      return;
    }

    Alert.alert('Excluir Personagem', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => performDelete(character.id),
      },
    ]);
  }

  function renderCharacterCard({ item }) {
    const maxHp = Math.max(1, Number(item.maxHp) || 1);
    const currentHp = Math.max(0, Math.min(maxHp, Number(item.currentHp) ?? maxHp));
    const hpPercent = Math.round((currentHp / maxHp) * 100);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() => router.push(`/character/${item.id}`)}
      >
        <View style={styles.cardTop}>
          <View style={styles.avatarBadge}>
            <Ionicons name="shield-half" size={22} color={COLORS.primary} />
          </View>

          <View style={styles.cardIdentity}>
            <View style={styles.nameRow}>
              <Text style={styles.charName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Nv. {item.level || 1}</Text>
              </View>
            </View>
            <Text style={styles.charMeta} numberOfLines={1}>
              {item.raceName} • {item.className}
              {item.background ? ` • ${item.background}` : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDeleteCharacter(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={19} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.hpSection}>
          <View style={styles.hpLabelRow}>
            <Text style={styles.hpLabel}>Pontos de Vida</Text>
            <Text style={styles.hpValue}>
              {currentHp} / {maxHp} PV
            </Text>
          </View>
          <View style={styles.hpBarTrack}>
            <View style={[styles.hpBarFill, { width: `${hpPercent}%` }]} />
          </View>
        </View>

        <View style={styles.statsFooter}>
          <View style={styles.statPill}>
            <Ionicons name="shield-outline" size={14} color={COLORS.primaryLight} />
            <Text style={styles.statPillText}>CA {item.armorClass ?? 10}</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="walk-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statPillText}>{item.speed ?? 30} ft</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="sparkles-outline" size={14} color={COLORS.magicLight} />
            <Text style={styles.statPillText}>
              {(item.spells || []).length} magias
            </Text>
          </View>
          <View style={styles.openHint}>
            <Text style={styles.openHintText}>Abrir</Text>
            <Ionicons name="chevron-forward" size={15} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Meus Personagens</Text>
          <Text style={styles.subtitle}>
            {characters.length}{' '}
            {characters.length === 1 ? 'ficha salva' : 'fichas salvas'} localmente
          </Text>
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

      {loading ? (
        <LoadingView message="Carregando suas fichas..." />
      ) : (
        <FlatList
          data={filteredCharacters}
          keyExtractor={(item) => item.id}
          renderItem={renderCharacterCard}
          contentContainerStyle={
            filteredCharacters.length === 0
              ? styles.emptyListContainer
              : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadCharacters(true)}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="shield-outline" size={54} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>
                {search.trim()
                  ? 'Nenhum personagem encontrado'
                  : 'Nenhuma ficha criada ainda'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search.trim()
                  ? 'Tente buscar por outro nome, raça ou classe.'
                  : 'Crie seu primeiro personagem passo a passo usando dados reais da API D&D 5e.'}
              </Text>
              {!search.trim() ? (
                <CustomButton
                  title="Criar Novo Personagem"
                  icon="add-circle-outline"
                  onPress={() => router.push('/create/step1-identity')}
                  style={styles.ctaBtn}
                />
              ) : null}
            </View>
          }
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
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarBadge: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIdentity: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  charName: {
    flexShrink: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  levelBadge: {
    backgroundColor: COLORS.primaryMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  levelText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  charMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.dangerMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hpSection: {
    gap: 6,
  },
  hpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hpLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  hpValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  hpBarTrack: {
    height: 7,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.full,
  },
  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  statPillText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  openHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 2,
  },
  openHintText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  emptyWrap: {
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
    textAlign: 'center',
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

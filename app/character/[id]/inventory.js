import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  useFocusEffect,
  useLocalSearchParams,
  useGlobalSearchParams,
  useRouter,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../../src/theme/colors';
import LoadingView from '../../../src/components/LoadingView';
import { getCharacterById, updateCharacter } from '../../../src/services/storage';

const COIN_TYPES = [
  { key: 'gp', label: 'Ouro (PO)', color: COLORS.primaryLight },
  { key: 'sp', label: 'Prata (PP)', color: COLORS.textSecondary },
  { key: 'cp', label: 'Cobre (PC)', color: '#B45309' },
];

export default function CharacterInventoryScreen() {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const characterId = String(localParams.id || globalParams.id || '');

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCharacter = useCallback(async () => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCharacterById(characterId);
      setCharacter(data);
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useFocusEffect(
    useCallback(() => {
      loadCharacter();
    }, [loadCharacter])
  );

  const inventory = character?.inventory || [];
  const coins = character?.coins || { gp: 0, sp: 0, cp: 0 };
  const strScore = character?.attributes?.str ?? 10;
  const maxCarryWeight = strScore * 15;

  const totalWeight = useMemo(() => {
    return inventory.reduce((sum, item) => {
      const w = Number(item.weight) || 0;
      const qty = Number(item.quantity) || 1;
      return sum + w * qty;
    }, 0);
  }, [inventory]);

  const carryPercent = Math.min(
    100,
    Math.round((totalWeight / Math.max(1, maxCarryWeight)) * 100)
  );

  async function persistUpdate(partial) {
    if (!character) return;
    const optimistic = { ...character, ...partial };
    setCharacter(optimistic);
    await updateCharacter(character.id, partial);
  }

  async function handleCoinDelta(coinKey, delta) {
    const currentVal = Number(coins[coinKey]) || 0;
    const nextVal = Math.max(0, currentVal + delta);
    await persistUpdate({
      coins: { ...coins, [coinKey]: nextVal },
    });
  }

  async function handleToggleEquipped(itemId) {
    const updated = inventory.map((item) =>
      item.id === itemId ? { ...item, equipped: !item.equipped } : item
    );
    await persistUpdate({ inventory: updated });
  }

  async function handleQuantityDelta(itemId, delta) {
    const updated = inventory
      .map((item) => {
        if (item.id !== itemId) return item;
        const nextQty = (Number(item.quantity) || 1) + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      })
      .filter(Boolean);
    await persistUpdate({ inventory: updated });
  }

  async function handleRemoveItem(itemId) {
    const updated = inventory.filter((item) => item.id !== itemId);
    await persistUpdate({ inventory: updated });
  }

  if (loading) {
    return <LoadingView message="Carregando inventário..." />;
  }

  if (!character) {
    return (
      <LoadingView
        error="Personagem não encontrado."
        onRetry={() => router.replace('/(tabs)')}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash-outline" size={18} color={COLORS.primaryLight} />
          <Text style={styles.sectionTitle}>Algibeira de Moedas</Text>
        </View>
        <View style={styles.coinsRow}>
          {COIN_TYPES.map((coin) => (
            <View key={coin.key} style={styles.coinCard}>
              <Text style={[styles.coinLabel, { color: coin.color }]}>
                {coin.label}
              </Text>
              <Text style={styles.coinValue}>{coins[coin.key] ?? 0}</Text>
              <View style={styles.coinBtns}>
                <TouchableOpacity
                  style={styles.coinBtn}
                  onPress={() => handleCoinDelta(coin.key, -1)}
                >
                  <Ionicons name="remove" size={15} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.coinBtn}
                  onPress={() => handleCoinDelta(coin.key, 1)}
                >
                  <Ionicons name="add" size={15} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="barbell-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Capacidade de Carga</Text>
          <Text style={styles.weightLabel}>
            {totalWeight.toFixed(1)} / {maxCarryWeight} lb
          </Text>
        </View>
        <View style={styles.carryTrack}>
          <View
            style={[
              styles.carryFill,
              {
                width: `${carryPercent}%`,
                backgroundColor:
                  carryPercent >= 90 ? COLORS.danger : COLORS.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.carryHint}>
          Calculado por Força ({strScore}) × 15 lb
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bag-outline" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>
            Mochila ({inventory.length} itens)
          </Text>
        </View>

        {inventory.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="bag-outline" size={38} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              Sua mochila está vazia. Adicione equipamentos da API D&D 5e!
            </Text>
          </View>
        ) : (
          <View style={styles.itemsList}>
            {inventory.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemTop}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {item.category || 'Equipamento'} • {item.weight || 0} lb un.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.equipBadge,
                      item.equipped && styles.equipBadgeActive,
                    ]}
                    onPress={() => handleToggleEquipped(item.id)}
                  >
                    <Ionicons
                      name={
                        item.equipped
                          ? 'checkmark-circle'
                          : 'ellipse-outline'
                      }
                      size={14}
                      color={
                        item.equipped ? COLORS.success : COLORS.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.equipText,
                        item.equipped && styles.equipTextActive,
                      ]}
                    >
                      {item.equipped ? 'Equipado' : 'Mochila'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.itemFooter}>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleQuantityDelta(item.id, -1)}
                    >
                      <Ionicons
                        name="remove"
                        size={15}
                        color={COLORS.textPrimary}
                      />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>x{item.quantity || 1}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleQuantityDelta(item.id, 1)}
                    >
                      <Ionicons
                        name="add"
                        size={15}
                        color={COLORS.textPrimary}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveItem(item.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={COLORS.danger}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  coinsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  coinCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.sm + 2,
    alignItems: 'center',
    gap: 6,
  },
  coinLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  coinValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  coinBtns: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
  },
  coinBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  carryTrack: {
    height: 8,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  carryFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  carryHint: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  itemsList: {
    gap: SPACING.sm,
  },
  itemCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  itemMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  equipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  equipBadgeActive: {
    backgroundColor: COLORS.successMuted,
    borderColor: COLORS.success,
  },
  equipText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  equipTextActive: {
    color: COLORS.success,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dangerMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

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
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZE,
  LAYOUT,
} from '../../../src/theme/colors';
import LoadingView from '../../../src/components/LoadingView';
import CustomButton from '../../../src/components/CustomButton';
import QuickRollModal from '../../../src/components/QuickRollModal';
import {
  getCharacterById,
  updateCharacter,
  addDiceRoll,
} from '../../../src/services/storage';
import { fetchEquipmentDetail } from '../../../src/services/dndApi';
import {
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
  extractWeaponInfo,
  getWeaponAbilityKey,
  rollDiceExpression,
} from '../../../src/utils/dndRules';

function doubleDiceExpression(expr) {
  return String(expr || '1d4').replace(
    /^(\d+)d(\d+)/i,
    (_, qty, sides) => `${Number(qty) * 2}d${sides}`
  );
}

export default function CharacterWeaponsScreen() {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const characterId = String(localParams.id || globalParams.id || '');

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoll, setActiveRoll] = useState(null);
  const [lastRollConfig, setLastRollConfig] = useState(null);

  const loadCharacterAndHydrate = useCallback(async () => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCharacterById(characterId);
      if (!data) {
        setCharacter(null);
        return;
      }

      const inventory = data.inventory || [];
      const itemsNeedingHydration = inventory.filter(
        (item) =>
          (item.category === 'Weapon' || item.isWeapon) &&
          !item.damageDice &&
          item.index
      );

      if (itemsNeedingHydration.length > 0) {
        const hydratedInventory = await Promise.all(
          inventory.map(async (item) => {
            if (
              (item.category === 'Weapon' || item.isWeapon) &&
              !item.damageDice &&
              item.index
            ) {
              try {
                const detail = await fetchEquipmentDetail(item.index);
                const weaponInfo = extractWeaponInfo(detail);
                return { ...item, ...weaponInfo };
              } catch {
                return item;
              }
            }
            return item;
          })
        );

        const updated = { ...data, inventory: hydratedInventory };
        setCharacter(updated);
        await updateCharacter(data.id, { inventory: hydratedInventory });
      } else {
        setCharacter(data);
      }
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useFocusEffect(
    useCallback(() => {
      loadCharacterAndHydrate();
    }, [loadCharacterAndHydrate])
  );

  const weapons = useMemo(() => {
    const inv = character?.inventory || [];
    return inv
      .filter(
        (item) =>
          item.isWeapon ||
          (item.category || '').toLowerCase() === 'weapon' ||
          Boolean(item.damageDice)
      )
      .sort((a, b) => Number(Boolean(b.equipped)) - Number(Boolean(a.equipped)));
  }, [character]);

  const attributes = character?.attributes || {};
  const profBonus = calculateProficiencyBonus(character?.level || 1);

  async function executeQuickRoll(config) {
    const rolled = rollDiceExpression(config.expression, config.extraModifier || 0);
    const modalData = {
      ...rolled,
      title: config.title,
      subtitle: config.subtitle,
      kind: config.kind,
      followUpAction: config.followUpAction || null,
      critFollowUpAction: config.critFollowUpAction || null,
    };

    setLastRollConfig(config);
    setActiveRoll(modalData);

    await addDiceRoll({
      ...rolled,
      label: `${config.title} • ${character?.name || ''}`,
    });
  }

  async function handleToggleEquipped(itemId) {
    if (!character) return;
    const updatedInventory = (character.inventory || []).map((item) =>
      item.id === itemId ? { ...item, equipped: !item.equipped } : item
    );
    setCharacter({ ...character, inventory: updatedInventory });
    await updateCharacter(character.id, { inventory: updatedInventory });
  }

  if (loading) {
    return <LoadingView message="Preparando arsenal do personagem..." />;
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
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBanner}>
          <View style={styles.headerBannerLeft}>
            <Ionicons name="flash" size={22} color={COLORS.primaryLight} />
            <View style={styles.headerBannerText}>
              <Text style={styles.bannerTitle}>
                Arsenal de {character.name}
              </Text>
              <Text style={styles.bannerSub}>
                Toque em Ataque ou Dano para rolar imediatamente nesta tela
              </Text>
            </View>
          </View>
          <View style={styles.profPill}>
            <Text style={styles.profPillText}>
              Prof. {formatModifier(profBonus)}
            </Text>
          </View>
        </View>

        {weapons.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="hammer-outline" size={46} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma arma no inventário</Text>
            <Text style={styles.emptySub}>
              Adicione armas na aba Inventário usando a API D&D 5e (ex: Longsword, Shortbow, Dagger) para liberar ataques e rolagens de dano aqui!
            </Text>
            <CustomButton
              title="Abrir Inventário"
              icon="bag-outline"
              onPress={() =>
                router.push(`/character/${character.id}/inventory`)
              }
              style={styles.emptyBtn}
            />
          </View>
        ) : (
          <View style={styles.weaponsList}>
            {weapons.map((weapon) => {
              const abilityKey = getWeaponAbilityKey(weapon, attributes);
              const abilityShort = abilityKey === 'dex' ? 'DES' : 'FOR';
              const abilityMod = calculateModifier(attributes[abilityKey] ?? 10);
              const attackBonus = abilityMod + profBonus;
              const damageDice = weapon.damageDice || '1d4';
              const damageFormula = `${damageDice}${
                abilityMod !== 0 ? ` ${formatModifier(abilityMod)}` : ''
              }`;
              const twoHandedFormula = weapon.twoHandedDamageDice
                ? `${weapon.twoHandedDamageDice}${
                    abilityMod !== 0 ? ` ${formatModifier(abilityMod)}` : ''
                  }`
                : null;

              return (
                <View
                  key={weapon.id}
                  style={[
                    styles.weaponCard,
                    weapon.equipped && styles.weaponCardEquipped,
                  ]}
                >
                  <View style={styles.weaponHeader}>
                    <View style={styles.weaponTitleWrap}>
                      <Text style={styles.weaponName}>{weapon.name}</Text>
                      <Text style={styles.weaponMeta}>
                        {weapon.weaponRange || 'Melee'} • Usa {abilityShort} (
                        {formatModifier(abilityMod)})
                        {weapon.damageType ? ` • ${weapon.damageType}` : ''}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.equipChip,
                        weapon.equipped && styles.equipChipActive,
                      ]}
                      onPress={() => handleToggleEquipped(weapon.id)}
                    >
                      <Ionicons
                        name={
                          weapon.equipped
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                        }
                        size={14}
                        color={
                          weapon.equipped ? COLORS.success : COLORS.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.equipChipText,
                          weapon.equipped && styles.equipChipTextActive,
                        ]}
                      >
                        {weapon.equipped ? 'Equipada' : 'Mochila'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {Array.isArray(weapon.properties) &&
                  weapon.properties.length > 0 ? (
                    <View style={styles.propsRow}>
                      {weapon.properties.map((prop, idx) => (
                        <View key={`${prop}_${idx}`} style={styles.propTag}>
                          <Text style={styles.propText}>{prop}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <View style={styles.rollActionsRow}>
                    <TouchableOpacity
                      style={[styles.rollBtn, styles.attackBtn]}
                      activeOpacity={0.78}
                      onPress={() => {
                        const critDice = doubleDiceExpression(damageDice);
                        const critFormula = `${critDice}${
                          abilityMod !== 0 ? ` ${formatModifier(abilityMod)}` : ''
                        }`;
                        executeQuickRoll({
                          expression: '1d20',
                          extraModifier: attackBonus,
                          title: `Ataque • ${weapon.name}`,
                          subtitle: `1d20 + ${abilityShort} + Proficiência`,
                          kind: 'attack',
                          followUpAction: {
                            label: `Rolar Dano (${damageFormula}${
                              weapon.damageType ? ` • ${weapon.damageType}` : ''
                            })`,
                            icon: 'flame',
                            variant: 'danger',
                            onPress: () =>
                              executeQuickRoll({
                                expression: damageDice,
                                extraModifier: abilityMod,
                                title: `Dano • ${weapon.name}`,
                                subtitle: weapon.damageType
                                  ? `Tipo de Dano: ${weapon.damageType}`
                                  : 'Rolagem de Dano',
                                kind: 'damage',
                              }),
                          },
                          critFollowUpAction: {
                            label: `Rolar Dano Crítico (${critFormula})`,
                            icon: 'sparkles',
                            onPress: () =>
                              executeQuickRoll({
                                expression: critDice,
                                extraModifier: abilityMod,
                                title: `Dano Crítico • ${weapon.name}`,
                                subtitle: weapon.damageType
                                  ? `Crítico (Dados Dobrados) • ${weapon.damageType}`
                                  : 'Dano Crítico (Dados Dobrados)',
                                kind: 'damage',
                              }),
                          },
                        });
                      }}
                    >
                      <Ionicons
                        name="dice-outline"
                        size={16}
                        color={COLORS.primaryLight}
                      />
                      <View style={styles.rollBtnTextWrap}>
                        <Text style={styles.rollBtnLabel}>Ataque</Text>
                        <Text style={styles.rollBtnValue}>
                          1d20 {formatModifier(attackBonus)}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.rollBtn, styles.damageBtn]}
                      activeOpacity={0.78}
                      onPress={() =>
                        executeQuickRoll({
                          expression: damageDice,
                          extraModifier: abilityMod,
                          title: `Dano • ${weapon.name}`,
                          subtitle: weapon.damageType
                            ? `Tipo de Dano: ${weapon.damageType}`
                            : 'Rolagem de Dano',
                          kind: 'damage',
                        })
                      }
                    >
                      <Ionicons name="flame" size={16} color={COLORS.danger} />
                      <View style={styles.rollBtnTextWrap}>
                        <Text style={styles.rollBtnLabel}>Dano</Text>
                        <Text style={styles.rollBtnValue}>{damageFormula}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {twoHandedFormula ? (
                    <TouchableOpacity
                      style={styles.twoHandedBtn}
                      activeOpacity={0.78}
                      onPress={() =>
                        executeQuickRoll({
                          expression: weapon.twoHandedDamageDice,
                          extraModifier: abilityMod,
                          title: `Dano (2 Mãos) • ${weapon.name}`,
                          subtitle: weapon.damageType
                            ? `Versátil • ${weapon.damageType}`
                            : 'Dano com Duas Mãos',
                          kind: 'damage',
                        })
                      }
                    >
                      <Ionicons
                        name="flame-outline"
                        size={15}
                        color={COLORS.primaryLight}
                      />
                      <Text style={styles.twoHandedText}>
                        Rolar Dano com Duas Mãos ({twoHandedFormula})
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <QuickRollModal
        visible={Boolean(activeRoll)}
        roll={activeRoll}
        onReroll={() => {
          if (lastRollConfig) executeQuickRoll(lastRollConfig);
        }}
        onClose={() => setActiveRoll(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md + 2,
    gap: SPACING.sm,
  },
  headerBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm + 2,
  },
  headerBannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  bannerSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  profPill: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  profPillText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: SPACING.sm,
  },
  weaponsList: {
    gap: SPACING.md,
  },
  weaponCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  weaponCardEquipped: {
    borderColor: COLORS.primary,
  },
  weaponHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  weaponTitleWrap: {
    flex: 1,
    gap: 2,
  },
  weaponName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  weaponMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  equipChipActive: {
    backgroundColor: COLORS.successMuted,
    borderColor: COLORS.success,
  },
  equipChipText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  equipChipTextActive: {
    color: COLORS.success,
  },
  propsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  propTag: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  propText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  rollActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rollBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
  },
  attackBtn: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  damageBtn: {
    backgroundColor: COLORS.dangerMuted,
    borderColor: COLORS.danger,
  },
  rollBtnTextWrap: {
    alignItems: 'flex-start',
  },
  rollBtnLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rollBtnValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  twoHandedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs + 2,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  twoHandedText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});

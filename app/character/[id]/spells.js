import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  useFocusEffect,
  useLocalSearchParams,
  useGlobalSearchParams,
  useRouter,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, LAYOUT } from '../../../src/theme/colors';
import LoadingView from '../../../src/components/LoadingView';
import CustomButton from '../../../src/components/CustomButton';
import CustomInput from '../../../src/components/CustomInput';
import QuickRollModal from '../../../src/components/QuickRollModal';
import {
  getCharacterById,
  updateCharacter,
  addDiceRoll,
} from '../../../src/services/storage';
import { fetchSpells, fetchSpellDetail } from '../../../src/services/dndApi';
import {
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
  getSpellcastingAbility,
  extractSpellDamageInfo,
  rollDiceExpression,
} from '../../../src/utils/dndRules';

const SPELL_CIRCLES = [1, 2, 3];

function doubleDiceExpression(expr) {
  return String(expr || '1d6').replace(
    /^(\d+)d(\d+)/i,
    (_, qty, sides) => `${Number(qty) * 2}d${sides}`
  );
}

export default function CharacterSpellsScreen() {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const characterId = String(localParams.id || globalParams.id || '');

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [apiSpells, setApiSpells] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiSearch, setApiSearch] = useState('');
  const [learningIndex, setLearningIndex] = useState(null);
  const [activeRoll, setActiveRoll] = useState(null);
  const [lastRollConfig, setLastRollConfig] = useState(null);

  const loadCharacter = useCallback(async () => {
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

      const existingSpells = data.spells || [];
      const needsHydration = existingSpells.some(
        (sp) => sp.damageChecked !== true && sp.index
      );

      if (needsHydration) {
        const hydratedSpells = await Promise.all(
          existingSpells.map(async (sp) => {
            if (sp.damageChecked === true || !sp.index) return sp;
            try {
              const detail = await fetchSpellDetail(sp.index);
              const dmgInfo = extractSpellDamageInfo(detail, data.level || 1);
              return {
                ...sp,
                ...dmgInfo,
                damageChecked: true,
              };
            } catch {
              return sp;
            }
          })
        );
        const updated = { ...data, spells: hydratedSpells };
        setCharacter(updated);
        await updateCharacter(data.id, { spells: hydratedSpells });
      } else {
        setCharacter(data);
      }
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useFocusEffect(
    useCallback(() => {
      loadCharacter();
    }, [loadCharacter])
  );

  const spells = character?.spells || [];
  const spellSlots = character?.spellSlots || {
    1: { max: 2, used: 0 },
    2: { max: 0, used: 0 },
    3: { max: 0, used: 0 },
  };

  const learnedIndexSet = useMemo(
    () => new Set(spells.map((s) => s.index)),
    [spells]
  );

  const sortedSpells = useMemo(() => {
    return [...spells].sort((a, b) => {
      const lvlDiff = (Number(a.level) || 0) - (Number(b.level) || 0);
      if (lvlDiff !== 0) return lvlDiff;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [spells]);

  const filteredApiSpells = useMemo(() => {
    const q = apiSearch.trim().toLowerCase();
    if (!q) return apiSpells;
    return apiSpells.filter(
      (sp) =>
        (sp.name || '').toLowerCase().includes(q) ||
        (sp.index || '').toLowerCase().includes(q)
    );
  }, [apiSpells, apiSearch]);

  async function persistUpdate(partial) {
    if (!character) return;
    const optimistic = { ...character, ...partial };
    setCharacter(optimistic);
    await updateCharacter(character.id, partial);
  }

  async function handleToggleSlot(circle, orbIdx) {
    const current = spellSlots[circle] || { max: 0, used: 0 };
    const isSpent = orbIdx < current.used;
    const nextUsed = isSpent ? orbIdx : orbIdx + 1;
    const clampedUsed = Math.max(0, Math.min(current.max, nextUsed));

    await persistUpdate({
      spellSlots: {
        ...spellSlots,
        [circle]: { ...current, used: clampedUsed },
      },
    });
  }

  async function handleMaxSlotsDelta(circle, delta) {
    const current = spellSlots[circle] || { max: 0, used: 0 };
    const nextMax = Math.max(0, Math.min(6, current.max + delta));
    const nextUsed = Math.min(current.used, nextMax);

    await persistUpdate({
      spellSlots: {
        ...spellSlots,
        [circle]: { max: nextMax, used: nextUsed },
      },
    });
  }

  async function handleRecoverAllSlots() {
    const resetSlots = {};
    SPELL_CIRCLES.forEach((circle) => {
      const current = spellSlots[circle] || { max: 0, used: 0 };
      resetSlots[circle] = { max: current.max, used: 0 };
    });
    await persistUpdate({ spellSlots: resetSlots });
  }

  async function loadApiSpells() {
    setApiLoading(true);
    setApiError(null);
    try {
      const list = await fetchSpells();
      setApiSpells(list);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setApiLoading(false);
    }
  }

  function handleOpenModal() {
    setModalVisible(true);
    setApiSearch('');
    if (apiSpells.length === 0) {
      loadApiSpells();
    }
  }

  async function handleLearnSpell(apiSpell) {
    if (learningIndex || learnedIndexSet.has(apiSpell.index)) return;
    setLearningIndex(apiSpell.index);
    try {
      let level = apiSpell.level ?? 0;
      let school = 'Arcana';
      let casting_time = '1 action';
      let dmgInfo = {
        damageDice: null,
        damageType: null,
        attackType: null,
        isHeal: false,
        damageAtSlotLevel: null,
        damageAtCharLevel: null,
      };

      try {
        const detail = await fetchSpellDetail(apiSpell.index);
        level = detail.level ?? 0;
        school = detail.school?.name || 'Arcana';
        casting_time = detail.casting_time || '1 action';
        dmgInfo = extractSpellDamageInfo(detail, character?.level || 1);
      } catch {
        // Fallback seguro caso o detalhe falhe
      }

      const newSpell = {
        index: apiSpell.index,
        name: apiSpell.name,
        level,
        school,
        casting_time,
        ...dmgInfo,
        damageChecked: true,
      };

      await persistUpdate({ spells: [newSpell, ...spells] });
    } finally {
      setLearningIndex(null);
    }
  }

  async function executeQuickRoll(config) {
    const rolled = rollDiceExpression(
      config.expression,
      config.extraModifier || 0,
      config.spellMod || 0
    );
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

  async function handleForgetSpell(spellIndex) {
    const updated = spells.filter((s) => s.index !== spellIndex);
    await persistUpdate({ spells: updated });
  }

  if (loading) {
    return <LoadingView message="Abrindo grimório..." />;
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
      >
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={18} color={COLORS.magicLight} />
            <Text style={styles.sectionTitle}>Espaços de Magia</Text>
            <TouchableOpacity
              style={styles.recoverBtn}
              onPress={handleRecoverAllSlots}
            >
              <Ionicons name="refresh" size={14} color={COLORS.magicLight} />
              <Text style={styles.recoverText}>Descanso</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.slotsList}>
            {SPELL_CIRCLES.map((circle) => {
              const slot = spellSlots[circle] || { max: 0, used: 0 };
              const available = Math.max(0, slot.max - slot.used);

              return (
                <View key={circle} style={styles.slotRow}>
                  <View style={styles.slotTop}>
                    <Text style={styles.slotCircleTitle}>
                      {circle}º Círculo ({available}/{slot.max} disponíveis)
                    </Text>
                    <View style={styles.maxControls}>
                      <TouchableOpacity
                        style={styles.maxBtn}
                        onPress={() => handleMaxSlotsDelta(circle, -1)}
                      >
                        <Ionicons
                          name="remove"
                          size={14}
                          color={COLORS.textPrimary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.maxBtn}
                        onPress={() => handleMaxSlotsDelta(circle, 1)}
                      >
                        <Ionicons
                          name="add"
                          size={14}
                          color={COLORS.textPrimary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {slot.max === 0 ? (
                    <Text style={styles.noSlotsText}>
                      Sem espaços configurados neste círculo (toque em + para adicionar).
                    </Text>
                  ) : (
                    <View style={styles.orbsRow}>
                      {Array.from({ length: slot.max }).map((_, idx) => {
                        const isSpent = idx < slot.used;
                        return (
                          <TouchableOpacity
                            key={idx}
                            activeOpacity={0.75}
                            onPress={() => handleToggleSlot(circle, idx)}
                            style={[
                              styles.orb,
                              isSpent ? styles.orbSpent : styles.orbAvailable,
                            ]}
                          >
                            <Ionicons
                              name={isSpent ? 'close' : 'sparkles'}
                              size={16}
                              color={
                                isSpent ? COLORS.textMuted : COLORS.white
                              }
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <CustomButton
          title="Aprender Magia da API D&D 5e"
          icon="book-outline"
          variant="magic"
          onPress={handleOpenModal}
        />

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame-outline" size={18} color={COLORS.magicLight} />
            <Text style={styles.sectionTitle}>
              Magias Conhecidas ({sortedSpells.length})
            </Text>
          </View>

          {sortedSpells.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons
                name="sparkles-outline"
                size={40}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyText}>
                Nenhuma magia no grimório ainda. Toque no botão acima para aprender magias direto da API D&D 5e!
              </Text>
            </View>
          ) : (
            <View style={styles.spellsList}>
              {sortedSpells.map((spell) => {
                const spellAbilityKey = getSpellcastingAbility(character.classIndex);
                const spellMod = calculateModifier(
                  character.attributes?.[spellAbilityKey] ?? 10
                );
                const spellAttackBonus =
                  spellMod + calculateProficiencyBonus(character.level || 1);
                const displayDamageDice = spell.damageDice
                  ? String(spell.damageDice).replace(
                      /MOD/gi,
                      String(Math.max(0, spellMod))
                    )
                  : null;

                return (
                  <View key={spell.index} style={styles.spellCard}>
                    <View style={styles.spellTopRow}>
                      <TouchableOpacity
                        style={styles.spellInfo}
                        activeOpacity={0.78}
                        onPress={() =>
                          router.push({
                            pathname: '/details/api-item',
                            params: {
                              category: 'spells',
                              index: spell.index,
                              name: spell.name,
                            },
                          })
                        }
                      >
                        <View style={styles.spellHeaderRow}>
                          <View style={styles.levelBadge}>
                            <Text style={styles.levelBadgeText}>
                              {spell.level === 0 ? 'Truque' : `Nv. ${spell.level}`}
                            </Text>
                          </View>
                          <Text style={styles.spellName} numberOfLines={1}>
                            {spell.name}
                          </Text>
                        </View>
                        <Text style={styles.spellMeta} numberOfLines={1}>
                          {spell.school || 'Arcana'} •{' '}
                          {spell.casting_time || '1 action'} • Toque para detalhes
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.forgetBtn}
                        onPress={() => handleForgetSpell(spell.index)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={COLORS.danger}
                        />
                      </TouchableOpacity>
                    </View>

                    {spell.damageDice || spell.attackType ? (
                      <View style={styles.spellRollRow}>
                        {spell.attackType ? (
                          <TouchableOpacity
                            style={[styles.spellRollBtn, styles.spellAttackBtn]}
                            activeOpacity={0.78}
                            onPress={() => {
                              const critDice = spell.damageDice
                                ? doubleDiceExpression(spell.damageDice)
                                : null;
                              const damageFollowUp = spell.damageDice
                                ? {
                                    label: `Rolar ${
                                      spell.isHeal ? 'Cura' : 'Dano'
                                    } (${displayDamageDice}${
                                      !spell.isHeal && spell.damageType
                                        ? ` • ${spell.damageType}`
                                        : ''
                                    })`,
                                    icon: spell.isHeal ? 'heart' : 'flame',
                                    variant: spell.isHeal ? 'primary' : 'danger',
                                    onPress: () =>
                                      executeQuickRoll({
                                        expression: spell.damageDice,
                                        spellMod,
                                        title: `${
                                          spell.isHeal ? 'Cura' : 'Dano'
                                        } • ${spell.name}`,
                                        subtitle: spell.isHeal
                                          ? 'Pontos de Vida Restaurados'
                                          : spell.damageType
                                          ? `Tipo de Dano: ${spell.damageType}`
                                          : 'Dano Mágico',
                                        kind: spell.isHeal ? 'heal' : 'damage',
                                      }),
                                  }
                                : null;
                              const critFollowUp =
                                critDice && !spell.isHeal
                                  ? {
                                      label: `Rolar Dano Crítico (${critDice})`,
                                      icon: 'sparkles',
                                      onPress: () =>
                                        executeQuickRoll({
                                          expression: critDice,
                                          spellMod,
                                          title: `Dano Crítico • ${spell.name}`,
                                          subtitle: spell.damageType
                                            ? `Crítico (Dados Dobrados) • ${spell.damageType}`
                                            : 'Dano Crítico (Dados Dobrados)',
                                          kind: 'damage',
                                        }),
                                    }
                                  : null;

                              executeQuickRoll({
                                expression: '1d20',
                                extraModifier: spellAttackBonus,
                                title: `Ataque Mágico • ${spell.name}`,
                                subtitle: `Ataque ${spell.attackType} (${spellAbilityKey.toUpperCase()} + Prof.)`,
                                kind: 'attack',
                                followUpAction: damageFollowUp,
                                critFollowUpAction: critFollowUp,
                              });
                            }}
                          >
                            <Ionicons
                              name="dice-outline"
                              size={15}
                              color={COLORS.magicLight}
                            />
                            <Text style={styles.spellRollText}>
                              Ataque 1d20 {formatModifier(spellAttackBonus)}
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {spell.damageDice ? (
                          <TouchableOpacity
                            style={[
                              styles.spellRollBtn,
                              spell.isHeal
                                ? styles.spellHealBtn
                                : styles.spellDamageBtn,
                            ]}
                            activeOpacity={0.78}
                            onPress={() =>
                              executeQuickRoll({
                                expression: spell.damageDice,
                                spellMod,
                                title: `${
                                  spell.isHeal ? 'Cura' : 'Dano'
                                } • ${spell.name}`,
                                subtitle: spell.isHeal
                                  ? 'Pontos de Vida Restaurados'
                                  : spell.damageType
                                  ? `Tipo de Dano: ${spell.damageType}`
                                  : 'Dano Mágico',
                                kind: spell.isHeal ? 'heal' : 'damage',
                              })
                            }
                          >
                            <Ionicons
                              name={spell.isHeal ? 'heart' : 'flame'}
                              size={15}
                              color={
                                spell.isHeal ? COLORS.success : COLORS.danger
                              }
                            />
                            <Text style={styles.spellRollText}>
                              {spell.isHeal ? 'Cura' : 'Dano'} {displayDamageDice}
                              {!spell.isHeal && spell.damageType
                                ? ` (${spell.damageType})`
                                : ''}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aprender Magias (API)</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <CustomInput
              value={apiSearch}
              onChangeText={setApiSearch}
              placeholder="Buscar magia (ex: Fireball, Cure Wounds, Shield)..."
              icon="search-outline"
              showClear
            />

            {apiLoading ? (
              <LoadingView message="Buscando magias da API D&D 5e..." />
            ) : apiError ? (
              <LoadingView error={apiError} onRetry={loadApiSpells} />
            ) : (
              <FlatList
                data={filteredApiSpells}
                keyExtractor={(item) => item.index}
                contentContainerStyle={styles.modalList}
                ListEmptyComponent={
                  <Text style={styles.modalEmptyText}>
                    Nenhuma magia encontrada para esta busca.
                  </Text>
                }
                renderItem={({ item }) => {
                  const isLearned = learnedIndexSet.has(item.index);
                  const isLearning = learningIndex === item.index;

                  return (
                    <View style={styles.apiRow}>
                      <View style={styles.apiSpellInfo}>
                        <Text style={styles.apiSpellName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.level !== undefined ? (
                          <Text style={styles.apiSpellMeta}>
                            {item.level === 0 ? 'Truque' : `Nível ${item.level}`}
                          </Text>
                        ) : null}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.apiLearnBtn,
                          isLearned && styles.apiLearnBtnDone,
                        ]}
                        disabled={isLearned || Boolean(learningIndex)}
                        onPress={() => handleLearnSpell(item)}
                      >
                        {isLearning ? (
                          <ActivityIndicator size="small" color={COLORS.white} />
                        ) : isLearned ? (
                          <>
                            <Ionicons
                              name="checkmark"
                              size={15}
                              color={COLORS.success}
                            />
                            <Text style={styles.apiLearnTextDone}>Aprendida</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="add" size={16} color={COLORS.white} />
                            <Text style={styles.apiLearnText}>Aprender</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

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
    color: COLORS.magicLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  recoverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.magicMuted,
    borderWidth: 1,
    borderColor: COLORS.magic,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
  },
  recoverText: {
    color: COLORS.magicLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  slotsList: {
    gap: SPACING.md,
  },
  slotRow: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  slotTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  slotCircleTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  maxControls: {
    flexDirection: 'row',
    gap: 6,
  },
  maxBtn: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSlotsText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
  },
  orbsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  orb: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  orbAvailable: {
    backgroundColor: COLORS.magic,
    borderColor: COLORS.magicLight,
  },
  orbSpent: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.borderLight,
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
    lineHeight: 20,
  },
  spellsList: {
    gap: SPACING.sm,
  },
  spellCard: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  spellTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  spellRollRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  spellRollBtn: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 7,
  },
  spellAttackBtn: {
    backgroundColor: COLORS.magicMuted,
    borderColor: COLORS.magic,
  },
  spellDamageBtn: {
    backgroundColor: COLORS.dangerMuted,
    borderColor: COLORS.danger,
  },
  spellHealBtn: {
    backgroundColor: COLORS.successMuted,
    borderColor: COLORS.success,
  },
  spellRollText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  spellInfo: {
    flex: 1,
    gap: 4,
  },
  spellHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelBadge: {
    backgroundColor: COLORS.magicMuted,
    borderWidth: 1,
    borderColor: COLORS.magic,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  levelBadgeText: {
    color: COLORS.magicLight,
    fontSize: 10,
    fontWeight: '800',
  },
  spellName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  spellMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  forgetBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.dangerMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '82%',
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalList: {
    gap: SPACING.xs + 2,
    paddingBottom: SPACING.xl,
  },
  modalEmptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  apiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  apiSpellInfo: {
    flex: 1,
  },
  apiSpellName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  apiSpellMeta: {
    color: COLORS.magicLight,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  apiLearnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.magic,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 7,
    minWidth: 96,
    justifyContent: 'center',
  },
  apiLearnBtnDone: {
    backgroundColor: COLORS.successMuted,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  apiLearnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  apiLearnTextDone: {
    color: COLORS.success,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});

import React, { useState, useCallback } from 'react';
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
import StatBox from '../../../src/components/StatBox';
import { getCharacterById, updateCharacter } from '../../../src/services/storage';
import {
  ATTRIBUTES,
  SKILLS,
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
} from '../../../src/utils/dndRules';

export default function CharacterOverviewScreen() {
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

  if (loading) {
    return <LoadingView message="Abrindo ficha do personagem..." />;
  }

  if (!character) {
    return (
      <LoadingView
        error="Personagem não encontrado no armazenamento local."
        onRetry={() => router.replace('/(tabs)')}
      />
    );
  }

  const attributes = character.attributes || {};
  const profBonus = calculateProficiencyBonus(character.level || 1);
  const initiative = calculateModifier(attributes.dex ?? 10);
  const maxHp = Math.max(1, Number(character.maxHp) || 1);
  const currentHp = Math.max(0, Math.min(maxHp, Number(character.currentHp) ?? maxHp));
  const hpPercent = Math.round((currentHp / maxHp) * 100);
  const hpColor =
    hpPercent > 50 ? COLORS.success : hpPercent > 25 ? COLORS.primary : COLORS.danger;

  async function handleHpChange(nextHp) {
    const clamped = Math.max(0, Math.min(maxHp, nextHp));
    setCharacter((prev) => (prev ? { ...prev, currentHp: clamped } : prev));
    await updateCharacter(character.id, { currentHp: clamped });
  }

  const savingThrows = character.savingThrows || [];
  const proficientSkills = character.proficientSkills || [];

  async function handleToggleSavingThrow(attrKey) {
    const exists = savingThrows.includes(attrKey);
    const next = exists
      ? savingThrows.filter((k) => k !== attrKey)
      : [...savingThrows, attrKey];
    setCharacter((prev) => (prev ? { ...prev, savingThrows: next } : prev));
    await updateCharacter(character.id, { savingThrows: next });
  }

  async function handleToggleSkill(skillId) {
    const exists = proficientSkills.includes(skillId);
    const next = exists
      ? proficientSkills.filter((id) => id !== skillId)
      : [...proficientSkills, skillId];
    setCharacter((prev) => (prev ? { ...prev, proficientSkills: next } : prev));
    await updateCharacter(character.id, { proficientSkills: next });
  }

  function openRoll(modValue, label) {
    router.push({
      pathname: '/(tabs)/dice',
      params: {
        sides: '20',
        modifier: String(modValue),
        label,
      },
    });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroAvatar}>
            <Ionicons name="shield-half" size={28} color={COLORS.primary} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{character.name}</Text>
            <Text style={styles.heroSub}>
              {character.raceName} • {character.className}
            </Text>
            <Text style={styles.heroBg}>
              Antecedente: {character.background || 'Aventureiro'}
            </Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelLabel}>NÍVEL</Text>
            <Text style={styles.levelValue}>{character.level || 1}</Text>
          </View>
        </View>
      </View>

      <View style={styles.vitalsGrid}>
        <View style={styles.vitalCard}>
          <Ionicons name="shield" size={18} color={COLORS.primary} />
          <Text style={styles.vitalValue}>{character.armorClass ?? 10}</Text>
          <Text style={styles.vitalLabel}>CA</Text>
        </View>
        <View style={styles.vitalCard}>
          <Ionicons name="flash" size={18} color={COLORS.primaryLight} />
          <Text style={styles.vitalValue}>{formatModifier(initiative)}</Text>
          <Text style={styles.vitalLabel}>Iniciativa</Text>
        </View>
        <View style={styles.vitalCard}>
          <Ionicons name="ribbon" size={18} color={COLORS.magicLight} />
          <Text style={styles.vitalValue}>{formatModifier(profBonus)}</Text>
          <Text style={styles.vitalLabel}>Proficiência</Text>
        </View>
        <View style={styles.vitalCard}>
          <Ionicons name="walk" size={18} color={COLORS.success} />
          <Text style={styles.vitalValue}>{character.speed ?? 30}ft</Text>
          <Text style={styles.vitalLabel}>Desloc.</Text>
        </View>
      </View>

      <View style={styles.hpCard}>
        <View style={styles.hpHeader}>
          <View style={styles.hpTitleRow}>
            <Ionicons name="heart" size={18} color={COLORS.danger} />
            <Text style={styles.hpTitle}>Pontos de Vida</Text>
          </View>
          <Text style={styles.hpCounter}>
            {currentHp} / {maxHp} PV
          </Text>
        </View>

        <View style={styles.hpTrack}>
          <View
            style={[
              styles.hpFill,
              { width: `${hpPercent}%`, backgroundColor: hpColor },
            ]}
          />
        </View>

        <View style={styles.hpButtonsRow}>
          <TouchableOpacity
            style={[styles.hpBtn, styles.hpBtnDamage]}
            onPress={() => handleHpChange(currentHp - 5)}
          >
            <Text style={styles.hpBtnText}>-5</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.hpBtn, styles.hpBtnDamage]}
            onPress={() => handleHpChange(currentHp - 1)}
          >
            <Text style={styles.hpBtnText}>-1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.hpBtn, styles.hpBtnHeal]}
            onPress={() => handleHpChange(currentHp + 1)}
          >
            <Text style={styles.hpBtnText}>+1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.hpBtn, styles.hpBtnHeal]}
            onPress={() => handleHpChange(currentHp + 5)}
          >
            <Text style={styles.hpBtnText}>+5</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.hpBtn, styles.hpBtnRest]}
            onPress={() => handleHpChange(maxHp)}
          >
            <Text style={styles.hpBtnRestText}>Máx</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="barbell-outline" size={17} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Atributos</Text>
          <Text style={styles.sectionHint}>Toque para rolar d20</Text>
        </View>
        <View style={styles.attrGrid}>
          {ATTRIBUTES.map((attr) => {
            const score = attributes[attr.key] ?? 10;
            const mod = calculateModifier(score);
            return (
              <StatBox
                key={attr.key}
                short={attr.short}
                label={attr.label}
                score={score}
                onPress={() =>
                  openRoll(mod, `Teste de ${attr.label} • ${character.name}`)
                }
              />
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={17} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Salvaguardas</Text>
          <Text style={styles.sectionHint}>Toque para proficiência</Text>
        </View>
        <View style={styles.savesGrid}>
          {ATTRIBUTES.map((attr) => {
            const isProf = savingThrows.includes(attr.key);
            const total =
              calculateModifier(attributes[attr.key] ?? 10) +
              (isProf ? profBonus : 0);
            return (
              <TouchableOpacity
                key={attr.key}
                style={[styles.saveChip, isProf && styles.saveChipActive]}
                activeOpacity={0.78}
                onPress={() => handleToggleSavingThrow(attr.key)}
              >
                <Ionicons
                  name={isProf ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={isProf ? COLORS.primaryLight : COLORS.textMuted}
                />
                <Text style={styles.saveName}>{attr.short}</Text>
                <TouchableOpacity
                  onPress={() =>
                    openRoll(total, `Salvaguarda ${attr.label} • ${character.name}`)
                  }
                  style={styles.saveModPill}
                >
                  <Text style={styles.saveModText}>{formatModifier(total)}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list-outline" size={17} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Perícias (18)</Text>
          <Text style={styles.sectionHint}>Toque para alternar</Text>
        </View>
        <View style={styles.skillsList}>
          {SKILLS.map((skill) => {
            const isProf = proficientSkills.includes(skill.id);
            const attrInfo = ATTRIBUTES.find((a) => a.key === skill.ability);
            const total =
              calculateModifier(attributes[skill.ability] ?? 10) +
              (isProf ? profBonus : 0);

            return (
              <View key={skill.id} style={styles.skillRow}>
                <TouchableOpacity
                  style={styles.skillToggleArea}
                  activeOpacity={0.75}
                  onPress={() => handleToggleSkill(skill.id)}
                >
                  <Ionicons
                    name={isProf ? 'checkmark-circle' : 'ellipse-outline'}
                    size={18}
                    color={isProf ? COLORS.primaryLight : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.skillName,
                      isProf && styles.skillNameActive,
                    ]}
                  >
                    {skill.name}
                  </Text>
                  <Text style={styles.skillAttrTag}>
                    ({attrInfo?.short || skill.ability.toUpperCase()})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.skillModBtn,
                    isProf && styles.skillModBtnActive,
                  ]}
                  onPress={() =>
                    openRoll(total, `${skill.name} • ${character.name}`)
                  }
                >
                  <Text
                    style={[
                      styles.skillModText,
                      isProf && styles.skillModTextActive,
                    ]}
                  >
                    {formatModifier(total)}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {Array.isArray(character.traits) && character.traits.length > 0 ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star-outline" size={17} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Traços Raciais</Text>
          </View>
          <View style={styles.traitsWrap}>
            {character.traits.map((trait, idx) => (
              <View key={`${trait}_${idx}`} style={styles.traitBadge}>
                <Text style={styles.traitText}>{trait}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
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
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroAvatar: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  heroSub: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  heroBg: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  levelBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    alignItems: 'center',
  },
  levelLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  levelValue: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  vitalValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  vitalLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hpCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  hpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  hpTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  hpCounter: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  hpTrack: {
    height: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  hpButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
  },
  hpBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hpBtnDamage: {
    backgroundColor: COLORS.dangerMuted,
    borderColor: COLORS.danger,
  },
  hpBtnHeal: {
    backgroundColor: COLORS.successMuted,
    borderColor: COLORS.success,
  },
  hpBtnRest: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  hpBtnText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  hpBtnRestText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
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
    letterSpacing: 0.6,
    flex: 1,
  },
  sectionHint: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  savesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  saveChip: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs + 2,
  },
  saveChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  saveName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  saveModPill: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  saveModText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  skillsList: {
    gap: 6,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 4,
    gap: SPACING.sm,
  },
  skillToggleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  skillName: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  skillNameActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  skillAttrTag: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  skillModBtn: {
    minWidth: 42,
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
  },
  skillModBtnActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  skillModText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  skillModTextActive: {
    color: COLORS.primaryLight,
  },
  traitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  traitBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
  },
  traitText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, LAYOUT } from '../../src/theme/colors';
import LoadingView from '../../src/components/LoadingView';
import CustomButton from '../../src/components/CustomButton';
import { fetchMonsterDetail } from '../../src/services/dndApi';
import {
  isMonsterFavorite,
  toggleFavoriteMonster,
} from '../../src/services/storage';
import {
  ATTRIBUTES,
  calculateModifier,
  formatModifier,
  formatChallengeRating,
} from '../../src/utils/dndRules';

function formatArmorClass(ac) {
  if (Array.isArray(ac) && ac.length > 0) {
    const first = ac[0];
    return `${first.value}${first.type ? ` (${first.type})` : ''}`;
  }
  if (typeof ac === 'number') return String(ac);
  return '10';
}

function formatSpeed(speed) {
  if (!speed || typeof speed !== 'object') return '—';
  return Object.entries(speed)
    .map(([mode, val]) => `${mode}: ${val}`)
    .join(' • ');
}

function formatSenses(senses) {
  if (!senses || typeof senses !== 'object') return null;
  const entries = Object.entries(senses).map(
    ([key, val]) => `${key.replace(/_/g, ' ')}: ${val}`
  );
  return entries.length > 0 ? entries.join(' • ') : null;
}

function formatProficiencies(proficiencies) {
  if (!Array.isArray(proficiencies) || proficiencies.length === 0) return null;
  return proficiencies
    .map((p) => `${p.proficiency?.name || ''} ${formatModifier(p.value)}`)
    .join(' • ');
}

function DetailLine({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function FeatureSection({
  title,
  icon,
  accentColor = COLORS.primary,
  items,
  onRollAttack,
}) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={17} color={accentColor} />
        <Text style={[styles.sectionTitle, { color: accentColor }]}>{title}</Text>
      </View>
      <View style={styles.featureList}>
        {items.map((entry, idx) => (
          <View key={`${entry.name}_${idx}`} style={styles.featureItem}>
            <View style={styles.featureNameRow}>
              <Text style={styles.featureName}>{entry.name}</Text>
              {entry.attack_bonus !== undefined ? (
                <TouchableOpacity
                  style={styles.attackBadge}
                  activeOpacity={0.78}
                  onPress={() => onRollAttack?.(entry)}
                >
                  <Ionicons name="dice-outline" size={13} color={COLORS.textPrimary} />
                  <Text style={styles.attackBadgeText}>
                    {formatModifier(entry.attack_bonus)} acerto
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
            {entry.desc ? (
              <Text style={styles.featureDesc}>{entry.desc}</Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MonsterDetailScreen() {
  const router = useRouter();
  const { index } = useLocalSearchParams();
  const [monster, setMonster] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMonster = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, favStatus] = await Promise.all([
        fetchMonsterDetail(String(index)),
        isMonsterFavorite(String(index)),
      ]);
      setMonster(data);
      setIsFavorite(favStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [index]);

  useEffect(() => {
    if (index) {
      loadMonster();
    }
  }, [index, loadMonster]);

  async function handleToggleFavorite() {
    if (!monster) return;
    const res = await toggleFavoriteMonster({
      index: monster.index,
      name: monster.name,
      challenge_rating: monster.challenge_rating,
      type: monster.type,
    });
    setIsFavorite(res.isFavorite);
  }

  function handleQuickRoll(modifierValue, label) {
    router.push({
      pathname: '/(tabs)/dice',
      params: {
        sides: '20',
        modifier: String(modifierValue),
        label,
      },
    });
  }

  const profText = formatProficiencies(monster?.proficiencies);
  const sensesText = formatSenses(monster?.senses);
  const vulnText =
    Array.isArray(monster?.damage_vulnerabilities) &&
    monster.damage_vulnerabilities.length > 0
      ? monster.damage_vulnerabilities.join(', ')
      : null;
  const resistText =
    Array.isArray(monster?.damage_resistances) &&
    monster.damage_resistances.length > 0
      ? monster.damage_resistances.join(', ')
      : null;
  const dmgImmText =
    Array.isArray(monster?.damage_immunities) &&
    monster.damage_immunities.length > 0
      ? monster.damage_immunities.join(', ')
      : null;
  const condImmText =
    Array.isArray(monster?.condition_immunities) &&
    monster.condition_immunities.length > 0
      ? monster.condition_immunities.map((c) => c.name).join(', ')
      : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topEyebrow}>Bestiário D&D 5e • Stat Block</Text>
          <Text style={styles.topTitle} numberOfLines={1}>
            {monster?.name || 'Monstro'}
          </Text>
        </View>
        {monster ? (
          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={[styles.iconBtn, isFavorite && styles.favIconBtnActive]}
          >
            <Ionicons
              name={isFavorite ? 'star' : 'star-outline'}
              size={21}
              color={isFavorite ? COLORS.primaryLight : COLORS.textPrimary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <LoadingView message="Carregando Stat Block completo..." />
      ) : error ? (
        <LoadingView error={error} onRetry={loadMonster} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerCard}>
            <Text style={styles.monsterName}>{monster.name}</Text>
            <Text style={styles.monsterMeta}>
              {monster.size} {monster.type}
              {monster.subtype ? ` (${monster.subtype})` : ''}, {monster.alignment}
            </Text>

            <View style={styles.crRow}>
              <View style={styles.crBadge}>
                <Text style={styles.crText}>
                  ND {formatChallengeRating(monster.challenge_rating)}
                </Text>
              </View>
              <Text style={styles.xpText}>
                {(monster.xp ?? 0).toLocaleString('pt-BR')} XP
              </Text>
            </View>
          </View>

          <View style={styles.quickActionsRow}>
            <CustomButton
              title={isFavorite ? 'Favoritado' : 'Favoritar'}
              icon={isFavorite ? 'star' : 'star-outline'}
              variant={isFavorite ? 'primary' : 'secondary'}
              size="sm"
              onPress={handleToggleFavorite}
              style={styles.quickActionBtn}
            />
            <CustomButton
              title={`Rolar Iniciativa (${formatModifier(
                calculateModifier(monster.dexterity ?? 10)
              )})`}
              icon="dice-outline"
              variant="outline"
              size="sm"
              onPress={() =>
                handleQuickRoll(
                  calculateModifier(monster.dexterity ?? 10),
                  `Iniciativa • ${monster.name}`
                )
              }
              style={styles.quickActionBtn}
            />
          </View>

          <View style={styles.vitalsRow}>
            <View style={styles.vitalCard}>
              <Ionicons name="shield-outline" size={20} color={COLORS.primary} />
              <Text style={styles.vitalLabel}>Classe de Armadura</Text>
              <Text style={styles.vitalValue}>
                {formatArmorClass(monster.armor_class)}
              </Text>
            </View>

            <View style={styles.vitalCard}>
              <Ionicons name="heart-outline" size={20} color={COLORS.danger} />
              <Text style={styles.vitalLabel}>Pontos de Vida</Text>
              <Text style={styles.vitalValue}>
                {monster.hit_points}
                {monster.hit_dice ? ` (${monster.hit_dice})` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.speedCard}>
            <Ionicons name="walk-outline" size={18} color={COLORS.primaryLight} />
            <Text style={styles.speedLabel}>Deslocamento:</Text>
            <Text style={styles.speedValue}>{formatSpeed(monster.speed)}</Text>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="barbell-outline" size={17} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Atributos</Text>
            </View>
            <View style={styles.attrGrid}>
              {ATTRIBUTES.map((attr) => {
                const score = monster[attr.monsterKey] ?? 10;
                const mod = calculateModifier(score);
                return (
                  <View key={attr.key} style={styles.attrBox}>
                    <Text style={styles.attrShort}>{attr.short}</Text>
                    <Text style={styles.attrScore}>{score}</Text>
                    <Text style={styles.attrMod}>{formatModifier(mod)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye-outline" size={17} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>
                Defesas, Sentidos e Proficiências
              </Text>
            </View>
            <DetailLine label="Proficiências" value={profText} />
            <DetailLine label="Vulnerabilidades a Dano" value={vulnText} />
            <DetailLine label="Resistências a Dano" value={resistText} />
            <DetailLine label="Imunidades a Dano" value={dmgImmText} />
            <DetailLine label="Imunidades a Condições" value={condImmText} />
            <DetailLine label="Sentidos" value={sensesText} />
            <DetailLine
              label="Idiomas"
              value={monster.languages || 'Nenhum'}
            />
          </View>

          <FeatureSection
            title="Habilidades Especiais"
            icon="sparkles-outline"
            accentColor={COLORS.magicLight}
            items={monster.special_abilities}
          />

          <FeatureSection
            title="Ações"
            icon="flash-outline"
            accentColor={COLORS.danger}
            items={monster.actions}
            onRollAttack={(action) =>
              handleQuickRoll(
                action.attack_bonus ?? 0,
                `${action.name} • ${monster.name}`
              )
            }
          />

          <FeatureSection
            title="Reações"
            icon="return-up-back-outline"
            accentColor={COLORS.primaryLight}
            items={monster.reactions}
          />

          <FeatureSection
            title="Ações Lendárias"
            icon="trophy-outline"
            accentColor={COLORS.primary}
            items={monster.legendary_actions}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favIconBtnActive: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickActionBtn: {
    flex: 1,
  },
  topTitleWrap: {
    flex: 1,
  },
  topEyebrow: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    padding: SPACING.lg,
    gap: 6,
  },
  monsterName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  monsterMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
  },
  crRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
  },
  crBadge: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
  },
  crText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  xpText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 4,
  },
  vitalLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  vitalValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  speedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.xs + 2,
  },
  speedLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  speedValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    flexShrink: 1,
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
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  attrBox: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    gap: 2,
  },
  attrShort: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  attrScore: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  attrMod: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  detailLine: {
    gap: 2,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  featureList: {
    gap: SPACING.md,
  },
  featureItem: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 6,
  },
  featureNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  featureName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  attackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dangerMuted,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  },
  attackBadgeText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  featureDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
});

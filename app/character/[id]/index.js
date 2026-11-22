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
import { getCharacterById } from '../../../src/services/storage';
import {
  ATTRIBUTES,
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
          <Ionicons name="heart" size={18} color={COLORS.danger} />
          <Text style={styles.vitalValue}>
            {character.currentHp ?? character.maxHp}/{character.maxHp}
          </Text>
          <Text style={styles.vitalLabel}>PV Atual</Text>
        </View>
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
                  router.push({
                    pathname: '/(tabs)/dice',
                    params: {
                      sides: '20',
                      modifier: String(mod),
                      label: `Teste de ${attr.label} • ${character.name}`,
                    },
                  })
                }
              />
            );
          })}
        </View>
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
});

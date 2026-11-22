import React, { useState } from 'react';
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
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/theme/colors';
import CustomButton from '../../src/components/CustomButton';
import {
  ATTRIBUTES,
  POINT_BUY_BUDGET,
  POINT_BUY_COSTS,
  calculateModifier,
  formatModifier,
  calculatePointBuySpent,
} from '../../src/utils/dndRules';

const INITIAL_ATTRIBUTES = {
  str: 8,
  dex: 8,
  con: 8,
  int: 8,
  wis: 8,
  cha: 8,
};

const STANDARD_ARRAY_PRESET = {
  str: 15,
  dex: 14,
  con: 13,
  int: 12,
  wis: 10,
  cha: 8,
};

export default function Step2AttributesScreen() {
  const router = useRouter();
  const { name, background, raceName, className } = useLocalSearchParams();
  const [baseAttributes, setBaseAttributes] = useState(INITIAL_ATTRIBUTES);

  const spentPoints = calculatePointBuySpent(baseAttributes);
  const remainingPoints = POINT_BUY_BUDGET - spentPoints;

  function adjustAttribute(key, delta) {
    setBaseAttributes((prev) => {
      const current = prev[key];
      const next = current + delta;
      if (next < 8 || next > 15) return prev;

      const currentCost = POINT_BUY_COSTS[current] ?? 0;
      const nextCost = POINT_BUY_COSTS[next] ?? 0;
      const diff = nextCost - currentCost;

      if (diff > remainingPoints) return prev;
      return { ...prev, [key]: next };
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={styles.stepBadge}>Passo 2 de 2</Text>
          <Text style={styles.topTitle} numberOfLines={1}>
            Atributos • {name || 'Novo Herói'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <Text style={styles.heroTitle}>{name || 'Aventureiro'}</Text>
          <Text style={styles.heroSub}>
            {raceName || 'Raça'} • {className || 'Classe'} • {background || 'Herói'}
          </Text>
        </View>

        <View style={styles.budgetCard}>
          <View style={styles.budgetInfo}>
            <Text style={styles.budgetLabel}>Pontos Restantes (Point Buy)</Text>
            <Text style={styles.budgetValue}>
              {remainingPoints} / {POINT_BUY_BUDGET}
            </Text>
          </View>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setBaseAttributes(STANDARD_ARRAY_PRESET)}
            >
              <Text style={styles.presetText}>Padrão</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetBtn}
              onPress={() => setBaseAttributes(INITIAL_ATTRIBUTES)}
            >
              <Text style={styles.presetText}>Zerar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.attributesList}>
          {ATTRIBUTES.map((attr) => {
            const baseVal = baseAttributes[attr.key];
            const mod = calculateModifier(baseVal);
            const nextStepCost =
              baseVal < 15
                ? (POINT_BUY_COSTS[baseVal + 1] ?? 0) -
                  (POINT_BUY_COSTS[baseVal] ?? 0)
                : null;
            const canIncrease =
              baseVal < 15 && nextStepCost !== null && nextStepCost <= remainingPoints;
            const canDecrease = baseVal > 8;

            return (
              <View key={attr.key} style={styles.attrRow}>
                <View style={styles.attrInfo}>
                  <Text style={styles.attrShort}>{attr.short}</Text>
                  <Text style={styles.attrName}>{attr.label}</Text>
                </View>

                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[
                      styles.stepBtn,
                      !canDecrease && styles.stepBtnDisabled,
                    ]}
                    disabled={!canDecrease}
                    onPress={() => adjustAttribute(attr.key, -1)}
                  >
                    <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>

                  <Text style={styles.baseValue}>{baseVal}</Text>

                  <TouchableOpacity
                    style={[
                      styles.stepBtn,
                      !canIncrease && styles.stepBtnDisabled,
                    ]}
                    disabled={!canIncrease}
                    onPress={() => adjustAttribute(attr.key, 1)}
                  >
                    <Ionicons name="add" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modBadge}>
                  <Text style={styles.modText}>{formatModifier(mod)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <CustomButton
          title="Salvar Personagem"
          icon="checkmark-circle-outline"
          size="lg"
          onPress={() => {}}
        />
      </ScrollView>
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitleWrap: {
    flex: 1,
  },
  stepBadge: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  },
  summaryCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  heroSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 4,
  },
  budgetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  budgetValue: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    marginTop: 2,
  },
  presetRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
  },
  presetBtn: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
  },
  presetText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  attributesList: {
    gap: SPACING.sm,
  },
  attrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  attrInfo: {
    flex: 1,
  },
  attrShort: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  attrName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.35,
  },
  baseValue: {
    minWidth: 26,
    textAlign: 'center',
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  modBadge: {
    minWidth: 44,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  modText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
});

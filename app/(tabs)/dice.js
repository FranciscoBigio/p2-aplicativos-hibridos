import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/theme/colors';
import CustomButton from '../../src/components/CustomButton';
import { formatModifier } from '../../src/utils/dndRules';

const DICE_OPTIONS = [4, 6, 8, 10, 12, 20, 100];

export default function DiceScreen() {
  const [selectedDie, setSelectedDie] = useState(20);
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);

  const formula = `${quantity}d${selectedDie}${
    modifier !== 0 ? ` ${formatModifier(modifier)}` : ''
  }`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Rolador de Dados</Text>
          <Text style={styles.subtitle}>
            Escolha os dados poliedrais, quantidade e modificador
          </Text>
        </View>

        <View style={styles.resultBox}>
          <Text style={styles.formulaText}>{formula}</Text>
          <Text style={styles.resultPlaceholder}>—</Text>
          <Text style={styles.resultHint}>Pronto para rolar</Text>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>Dados Poliedrais</Text>
          <View style={styles.diceGrid}>
            {DICE_OPTIONS.map((sides) => {
              const active = selectedDie === sides;
              return (
                <TouchableOpacity
                  key={sides}
                  activeOpacity={0.8}
                  style={[styles.dieCard, active && styles.dieCardActive]}
                  onPress={() => setSelectedDie(sides)}
                >
                  <Ionicons
                    name="dice-outline"
                    size={22}
                    color={active ? COLORS.white : COLORS.primary}
                  />
                  <Text style={[styles.dieText, active && styles.dieTextActive]}>
                    d{sides}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.controlCard}>
            <Text style={styles.controlLabel}>Quantidade</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQuantity((q) => Math.min(20, q + 1))}
              >
                <Ionicons name="add" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.controlCard}>
            <Text style={styles.controlLabel}>Modificador</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setModifier((m) => Math.max(-20, m - 1))}
              >
                <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{formatModifier(modifier)}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setModifier((m) => Math.min(30, m + 1))}
              >
                <Ionicons name="add" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <CustomButton
          title={`Rolar ${formula}`}
          icon="dice"
          size="lg"
          onPress={() => {}}
        />

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.historyTitle}>Histórico de Rolagens</Text>
          </View>
          <Text style={styles.historyEmpty}>
            As últimas rolagens aparecerão aqui.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    gap: 2,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  resultBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  formulaText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  resultPlaceholder: {
    color: COLORS.textPrimary,
    fontSize: 54,
    fontWeight: '900',
  },
  resultHint: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  sectionBlock: {
    gap: SPACING.sm,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  diceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  dieCard: {
    flexBasis: '22%',
    flexGrow: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dieCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  dieText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  dieTextActive: {
    color: COLORS.white,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  controlCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  controlLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  historyCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  historyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  historyEmpty: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
});

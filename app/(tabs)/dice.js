import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, LAYOUT } from '../../src/theme/colors';
import CustomButton from '../../src/components/CustomButton';
import { formatModifier } from '../../src/utils/dndRules';
import {
  getDiceHistory,
  addDiceRoll,
  clearDiceHistory,
} from '../../src/services/storage';

const DICE_OPTIONS = [4, 6, 8, 10, 12, 20, 100];

function formatTime(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function DiceScreen() {
  const params = useLocalSearchParams();
  const [selectedDie, setSelectedDie] = useState(20);
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [rollLabel, setRollLabel] = useState('');
  const [lastRoll, setLastRoll] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (params.sides) {
      const parsed = Number(params.sides);
      if (DICE_OPTIONS.includes(parsed)) setSelectedDie(parsed);
    }
    if (params.modifier !== undefined) {
      const parsedMod = Number(params.modifier);
      if (!Number.isNaN(parsedMod)) setModifier(parsedMod);
    }
    if (params.label) {
      setRollLabel(String(params.label));
    }
  }, [params.sides, params.modifier, params.label]);

  const loadHistory = useCallback(async () => {
    const stored = await getDiceHistory();
    setHistory(stored);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const formula = `${quantity}d${selectedDie}${
    modifier !== 0 ? ` ${formatModifier(modifier)}` : ''
  }`;

  async function handleRoll() {
    const rolls = [];
    for (let i = 0; i < quantity; i += 1) {
      rolls.push(Math.floor(Math.random() * selectedDie) + 1);
    }

    const subtotal = rolls.reduce((acc, val) => acc + val, 0);
    const total = subtotal + modifier;

    const isCritSuccess = selectedDie === 20 && quantity === 1 && rolls[0] === 20;
    const isCritFail = selectedDie === 20 && quantity === 1 && rolls[0] === 1;

    const entry = {
      formula,
      sides: selectedDie,
      quantity,
      modifier,
      rolls,
      subtotal,
      total,
      isCritSuccess,
      isCritFail,
      label: rollLabel || null,
    };

    setLastRoll(entry);
    const updatedHistory = await addDiceRoll(entry);
    setHistory(updatedHistory);
  }

  async function executeClearHistory() {
    await clearDiceHistory();
    setHistory([]);
  }

  function handleClearHistory() {
    const message = 'Deseja apagar todo o histórico de rolagens salvo?';

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        executeClearHistory();
      }
      return;
    }

    Alert.alert('Limpar Histórico', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: executeClearHistory },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Rolador de Dados</Text>
          <Text style={styles.subtitle}>
            {rollLabel
              ? `Atalho ativo: ${rollLabel}`
              : 'Escolha os dados poliedrais, quantidade e modificador'}
          </Text>
        </View>

        <View
          style={[
            styles.resultBox,
            lastRoll?.isCritSuccess && styles.resultCritSuccess,
            lastRoll?.isCritFail && styles.resultCritFail,
          ]}
        >
          <Text style={styles.formulaText}>
            {lastRoll ? lastRoll.formula : formula}
          </Text>

          {lastRoll?.isCritSuccess ? (
            <View style={styles.critBadgeSuccess}>
              <Ionicons name="sparkles" size={14} color={COLORS.primaryLight} />
              <Text style={styles.critBadgeSuccessText}>
                ACERTO CRÍTICO! (20 NATURAL)
              </Text>
            </View>
          ) : null}

          {lastRoll?.isCritFail ? (
            <View style={styles.critBadgeFail}>
              <Ionicons name="skull" size={14} color={COLORS.danger} />
              <Text style={styles.critBadgeFailText}>
                FALHA CRÍTICA! (1 NATURAL)
              </Text>
            </View>
          ) : null}

          <Text
            style={[
              styles.resultValue,
              lastRoll?.isCritSuccess && { color: COLORS.primaryLight },
              lastRoll?.isCritFail && { color: COLORS.danger },
            ]}
          >
            {lastRoll ? lastRoll.total : '—'}
          </Text>

          <Text style={styles.resultHint}>
            {lastRoll
              ? `Dados: [${lastRoll.rolls.join(', ')}]${
                  lastRoll.modifier !== 0
                    ? ` ${formatModifier(lastRoll.modifier)}`
                    : ''
                }`
              : 'Toque no botão abaixo para rolar'}
          </Text>
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
            <View style={styles.controlLabelRow}>
              <Text style={styles.controlLabel}>Modificador</Text>
              {modifier !== 0 ? (
                <TouchableOpacity onPress={() => setModifier(0)}>
                  <Text style={styles.resetModText}>zerar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
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
          onPress={handleRoll}
        />

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.historyHeaderLeft}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              <Text style={styles.historyTitle}>
                Histórico ({history.length})
              </Text>
            </View>
            {history.length > 0 ? (
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.clearText}>Limpar</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {history.length === 0 ? (
            <Text style={styles.historyEmpty}>
              Nenhuma rolagem registrada ainda. Role um dado para iniciar o histórico!
            </Text>
          ) : (
            <View style={styles.historyList}>
              {history.slice(0, 15).map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <View style={styles.historyInfo}>
                    <View style={styles.historyFormulaRow}>
                      <Text style={styles.historyFormula}>{item.formula}</Text>
                      {item.isCritSuccess ? (
                        <Text style={styles.tagCritSuccess}>CRÍTICO</Text>
                      ) : null}
                      {item.isCritFail ? (
                        <Text style={styles.tagCritFail}>FALHA</Text>
                      ) : null}
                    </View>
                    <Text style={styles.historyMeta}>
                      [{item.rolls?.join(', ')}]
                      {item.label ? ` • ${item.label}` : ''}
                      {item.timestamp ? ` • ${formatTime(item.timestamp)}` : ''}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.historyTotalBadge,
                      item.isCritSuccess && styles.historyTotalCritSuccess,
                      item.isCritFail && styles.historyTotalCritFail,
                    ]}
                  >
                    <Text style={styles.historyTotalText}>{item.total}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
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
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  resultCritSuccess: {
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primaryMuted,
  },
  resultCritFail: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerMuted,
  },
  formulaText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  critBadgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  critBadgeSuccessText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  critBadgeFail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  critBadgeFailText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  resultValue: {
    color: COLORS.textPrimary,
    fontSize: 58,
    fontWeight: '900',
  },
  resultHint: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
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
  controlLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  controlLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  resetModText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
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
    gap: SPACING.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  historyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  clearText: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  historyEmpty: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  historyList: {
    gap: SPACING.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyFormulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  historyFormula: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  tagCritSuccess: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  tagCritFail: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: COLORS.dangerMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  historyMeta: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  historyTotalBadge: {
    minWidth: 42,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  historyTotalCritSuccess: {
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primaryMuted,
  },
  historyTotalCritFail: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerMuted,
  },
  historyTotalText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
});

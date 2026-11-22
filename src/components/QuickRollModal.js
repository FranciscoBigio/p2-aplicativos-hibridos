import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../theme/colors';
import CustomButton from './CustomButton';
import { formatModifier } from '../utils/dndRules';

export default function QuickRollModal({
  visible,
  roll,
  onReroll,
  onClose,
}) {
  if (!roll) return null;

  const isDamage = roll.kind === 'damage';
  const isHeal = roll.kind === 'heal';

  const accentColor = roll.isCritSuccess
    ? COLORS.primaryLight
    : roll.isCritFail
    ? COLORS.danger
    : isHeal
    ? COLORS.success
    : isDamage
    ? COLORS.danger
    : COLORS.primaryLight;

  const iconName = isHeal ? 'heart' : isDamage ? 'flame' : 'dice';
  const followUp = roll.followUpAction || null;
  const critFollowUp = roll.isCritSuccess ? roll.critFollowUpAction || null : null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            roll.isCritSuccess && styles.cardCritSuccess,
            roll.isCritFail && styles.cardCritFail,
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name={iconName} size={20} color={accentColor} />
              <Text style={styles.title} numberOfLines={1}>
                {roll.title}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeIconBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {roll.subtitle ? (
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{roll.subtitle}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.resultPanel}>
            <Text style={styles.formulaText}>{roll.formula}</Text>

            {roll.isCritSuccess ? (
              <View style={styles.critBannerSuccess}>
                <Ionicons name="sparkles" size={14} color={COLORS.primaryLight} />
                <Text style={styles.critTextSuccess}>
                  ACERTO CRÍTICO! (20 NATURAL)
                </Text>
              </View>
            ) : null}

            {roll.isCritFail ? (
              <View style={styles.critBannerFail}>
                <Ionicons name="skull" size={14} color={COLORS.danger} />
                <Text style={styles.critTextFail}>
                  FALHA CRÍTICA! (1 NATURAL)
                </Text>
              </View>
            ) : null}

            <Text style={[styles.totalText, { color: accentColor }]}>
              {roll.total}
            </Text>

            <Text style={styles.breakdownText}>
              Dados: [{(roll.rolls || []).join(', ')}]
              {roll.modifier !== 0 ? ` ${formatModifier(roll.modifier)}` : ''}
            </Text>
          </View>

          {critFollowUp ? (
            <CustomButton
              title={critFollowUp.label}
              icon={critFollowUp.icon || 'sparkles'}
              variant="primary"
              onPress={critFollowUp.onPress}
            />
          ) : null}

          {followUp ? (
            <CustomButton
              title={followUp.label}
              icon={followUp.icon || 'flame'}
              variant={followUp.variant || 'danger'}
              onPress={followUp.onPress}
            />
          ) : null}

          <View style={styles.actionsRow}>
            <CustomButton
              title="Rolar Novamente"
              icon="refresh"
              variant={
                followUp
                  ? 'secondary'
                  : isHeal
                  ? 'primary'
                  : isDamage
                  ? 'danger'
                  : 'primary'
              }
              onPress={onReroll}
              style={styles.actionBtn}
            />
            <CustomButton
              title="Fechar"
              variant="secondary"
              onPress={onClose}
              style={styles.closeBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  cardCritSuccess: {
    borderColor: COLORS.primaryLight,
  },
  cardCritFail: {
    borderColor: COLORS.danger,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
  },
  typeBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  typeBadgeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  resultPanel: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  formulaText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  critBannerSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
  },
  critTextSuccess: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  critBannerFail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dangerMuted,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
  },
  critTextFail: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  totalText: {
    fontSize: 46,
    fontWeight: '900',
  },
  breakdownText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
  },
  closeBtn: {
    minWidth: 96,
  },
});

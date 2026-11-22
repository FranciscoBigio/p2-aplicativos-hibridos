import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../theme/colors';
import { calculateModifier, formatModifier } from '../utils/dndRules';

export default function StatBox({ label, short, score = 10, onPress }) {
  const mod = calculateModifier(score);
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={styles.box}
      activeOpacity={0.78}
      onPress={onPress}
    >
      <Text style={styles.short}>{short}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.score}>{score}</Text>
      <View style={styles.modBadge}>
        <Text style={styles.modText}>{formatModifier(mod)}</Text>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  box: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.xs + 2,
    alignItems: 'center',
    gap: 2,
  },
  short: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  score: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    marginVertical: 2,
  },
  modBadge: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 2,
  },
  modText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
});

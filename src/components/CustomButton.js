import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE } from '../theme/colors';

const VARIANT_STYLES = {
  primary: {
    container: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    text: { color: COLORS.white },
  },
  secondary: {
    container: { backgroundColor: COLORS.card, borderColor: COLORS.borderLight },
    text: { color: COLORS.textPrimary },
  },
  danger: {
    container: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
    text: { color: COLORS.white },
  },
  magic: {
    container: { backgroundColor: COLORS.magic, borderColor: COLORS.magic },
    text: { color: COLORS.white },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderColor: COLORS.primary },
    text: { color: COLORS.primary },
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderColor: 'transparent' },
    text: { color: COLORS.textSecondary },
  },
};

export default function CustomButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const palette = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        size === 'sm' && styles.sizeSm,
        size === 'lg' && styles.sizeLg,
        palette.container,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text.color} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons
              name={icon}
              size={size === 'sm' ? 16 : 18}
              color={palette.text.color}
            />
          ) : null}
          <Text
            style={[
              styles.text,
              size === 'sm' && styles.textSm,
              palette.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 41,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeSm: {
    minHeight: 34,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  },
  sizeLg: {
    minHeight: 46,
    paddingHorizontal: SPACING.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  text: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSm: {
    fontSize: FONT_SIZE.sm,
  },
  disabled: {
    opacity: 0.55,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, LAYOUT } from '../../src/theme/colors';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';
import { resetUserPassword } from '../../src/services/storage';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setError('');
    setSuccess('');

    if (!email.trim() || !newPassword) {
      setError('Informe o e-mail cadastrado e a nova senha.');
      return;
    }
    if (newPassword.length < 4) {
      setError('A nova senha deve ter pelo menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação de senha não confere.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetUserPassword({ email, newPassword });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess('Senha redefinida com sucesso! Você já pode fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            <Text style={styles.backText}>Voltar ao Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="key-outline" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Redefinir Senha</Text>
            <Text style={styles.subtitle}>
              Localize seu e-mail salvo no dispositivo e defina uma nova senha de acesso.
            </Text>
          </View>

          <View style={styles.card}>
            <CustomInput
              label="E-mail Cadastrado"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label="Nova Senha"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 4 caracteres"
              icon="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
            />

            <CustomInput
              label="Confirmar Nova Senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a nova senha"
              icon="shield-checkmark-outline"
              secureTextEntry
              autoCapitalize="none"
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={16} color={COLORS.danger} />
                <Text style={styles.bannerText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.success} />
                <Text style={styles.bannerText}>{success}</Text>
              </View>
            ) : null}

            <CustomButton
              title="Atualizar Senha"
              icon="refresh-outline"
              onPress={handleReset}
              loading={loading}
              size="lg"
            />

            {success ? (
              <CustomButton
                title="Ir para o Login"
                variant="secondary"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.loginBtn}
              />
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: LAYOUT.maxAuthWidth,
    alignSelf: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.title,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.dangerMuted,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.successMuted,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  bannerText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
  },
  loginBtn: {
    marginTop: SPACING.md,
  },
});

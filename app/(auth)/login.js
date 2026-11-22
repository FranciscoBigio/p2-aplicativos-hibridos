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
import { loginUser, loginDemoAccount } from '../../src/services/storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleDemoLogin() {
    setError('');
    setDemoLoading(true);
    try {
      await loginDemoAccount();
      router.replace('/(tabs)');
    } catch {
      setError('Não foi possível iniciar a conta de demonstração.');
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Informe seu e-mail e sua senha para entrar.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUser({ email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace('/(tabs)');
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
          <View style={styles.brandBox}>
            <View style={styles.emblem}>
              <Ionicons name="shield-half" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Grimório D&D 5e</Text>
            <Text style={styles.subtitle}>
              Fichas, Magias e Bestiário na palma da mão
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Entrar na Guilda</Text>

            <CustomInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="aventureiro@email.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Sua senha secreta"
              icon="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={16} color={COLORS.danger} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Entrar"
              icon="log-in-outline"
              onPress={handleLogin}
              loading={loading}
              size="lg"
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou teste agora</Text>
              <View style={styles.dividerLine} />
            </View>

            <CustomButton
              title="Entrar com Conta Demo"
              icon="sparkles-outline"
              variant="outline"
              onPress={handleDemoLogin}
              loading={demoLoading}
            />
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Ainda não tem conta?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Criar conta</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    padding: SPACING.xl,
    width: '100%',
    maxWidth: LAYOUT.maxAuthWidth,
    alignSelf: 'center',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  emblem: {
    width: 78,
    height: 78,
    borderRadius: RADIUS.xl,
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
    letterSpacing: 0.4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: SPACING.lg,
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
  errorBannerText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    marginTop: SPACING.xl,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});

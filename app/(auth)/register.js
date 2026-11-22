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
import { registerUser } from '../../src/services/storage';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha todos os campos para criar sua conta.');
      return;
    }
    if (!email.includes('@')) {
      setError('Informe um endereço de e-mail válido.');
      return;
    }
    if (password.length < 4) {
      setError('A senha deve conter pelo menos 4 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({ name, email, password });
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            <Text style={styles.backText}>Voltar ao Login</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Novo Aventureiro</Text>
            <Text style={styles.subtitle}>
              Crie sua conta local para salvar fichas, grimórios e favoritos.
            </Text>
          </View>

          <View style={styles.card}>
            <CustomInput
              label="Nome do Jogador"
              value={name}
              onChangeText={setName}
              placeholder="Ex: Francisco"
              icon="person-outline"
            />

            <CustomInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <CustomInput
              label="Senha"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 4 caracteres"
              icon="lock-closed-outline"
              secureTextEntry
              autoCapitalize="none"
            />

            <CustomInput
              label="Confirmar Senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a senha"
              icon="shield-checkmark-outline"
              secureTextEntry
              autoCapitalize="none"
            />

            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={16} color={COLORS.danger} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <CustomButton
              title="Criar Conta"
              icon="person-add-outline"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.submitBtn}
            />
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
  errorBannerText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
});

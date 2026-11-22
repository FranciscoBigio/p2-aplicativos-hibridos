import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/theme/colors';
import CustomButton from '../../src/components/CustomButton';
import {
  getSession,
  getCharacters,
  getFavoriteMonsters,
  getDiceHistory,
  seedDemoData,
  logoutUser,
} from '../../src/services/storage';
import { formatChallengeRating } from '../../src/utils/dndRules';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    characters: 0,
    favoriteMonsters: 0,
    diceRolls: 0,
  });
  const [favorites, setFavorites] = useState([]);
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadProfileData = useCallback(async () => {
    const session = await getSession();
    setUser(session);

    const [chars, favMonsters, history] = await Promise.all([
      getCharacters(session?.id),
      getFavoriteMonsters(),
      getDiceHistory(),
    ]);

    setFavorites(favMonsters);
    setStats({
      characters: chars.length,
      favoriteMonsters: favMonsters.length,
      diceRolls: history.length,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  async function executeResetDemo() {
    if (!user?.id) return;
    setResetting(true);
    setStatusMessage('');
    try {
      await seedDemoData(user.id);
      await loadProfileData();
      setStatusMessage('Personagens e monstros de demonstração restaurados!');
    } finally {
      setResetting(false);
    }
  }

  function handleResetDemo() {
    const message =
      'Deseja recriar os 2 personagens de exemplo (Mago Elfo e Guerreiro Anão) e monstros favoritos nesta conta?';

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        executeResetDemo();
      }
      return;
    }

    Alert.alert('Restaurar Dados Demo', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Restaurar', onPress: executeResetDemo },
    ]);
  }

  async function executeLogout() {
    await logoutUser();
    router.replace('/(auth)/login');
  }

  function handleLogout() {
    const message = 'Tem certeza que deseja encerrar sua sessão?';

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) {
        executeLogout();
      }
      return;
    }

    Alert.alert('Sair da Conta', message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: executeLogout },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Perfil do Jogador</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="shield-half" size={34} color={COLORS.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Aventureiro'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Sessão local'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={22} color={COLORS.primary} />
            <Text style={styles.statValue}>{stats.characters}</Text>
            <Text style={styles.statLabel}>Fichas</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={22} color={COLORS.primaryLight} />
            <Text style={styles.statValue}>{stats.favoriteMonsters}</Text>
            <Text style={styles.statLabel}>Monstros Fav.</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="dice" size={22} color={COLORS.magicLight} />
            <Text style={styles.statValue}>{stats.diceRolls}</Text>
            <Text style={styles.statLabel}>Rolagens</Text>
          </View>
        </View>

        {statusMessage ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.successText}>{statusMessage}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="skull-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Monstros Favoritos</Text>
          </View>

          {favorites.length === 0 ? (
            <Text style={styles.emptyFavText}>
              Você ainda não favoritou nenhum monstro no Bestiário.
            </Text>
          ) : (
            <View style={styles.favList}>
              {favorites.slice(0, 8).map((monster) => (
                <TouchableOpacity
                  key={monster.index}
                  style={styles.favRow}
                  activeOpacity={0.78}
                  onPress={() => router.push(`/monster/${monster.index}`)}
                >
                  <View style={styles.favInfo}>
                    <Text style={styles.favName}>{monster.name}</Text>
                    {monster.challenge_rating !== null &&
                    monster.challenge_rating !== undefined ? (
                      <Text style={styles.favMeta}>
                        ND {formatChallengeRating(monster.challenge_rating)}
                        {monster.type ? ` • ${monster.type}` : ''}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.actionsWrap}>
          <CustomButton
            title="Restaurar Dados Demo"
            icon="refresh-outline"
            variant="secondary"
            loading={resetting}
            onPress={handleResetDemo}
          />
          <CustomButton
            title="Sair da Conta (Logout)"
            icon="log-out-outline"
            variant="danger"
            onPress={handleLogout}
          />
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
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.successMuted,
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  successText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
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
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  emptyFavText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  favList: {
    gap: SPACING.xs + 2,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  favInfo: {
    flex: 1,
  },
  favName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  favMeta: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  actionsWrap: {
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
});

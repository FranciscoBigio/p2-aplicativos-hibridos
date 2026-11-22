import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/theme/colors';
import CustomInput from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';
import LoadingView from '../../src/components/LoadingView';
import { fetchRaces, fetchClasses } from '../../src/services/dndApi';

const BACKGROUND_SUGGESTIONS = [
  'Acólito',
  'Criminoso',
  'Herói do Povo',
  'Nobre',
  'Sábio',
  'Soldado',
  'Forasteiro',
];

export default function Step1IdentityScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [background, setBackground] = useState('Herói do Povo');
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState('');

  const loadApiOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [racesList, classesList] = await Promise.all([
        fetchRaces(),
        fetchClasses(),
      ]);
      setRaces(racesList);
      setClasses(classesList);
      if (racesList.length > 0) setSelectedRace(racesList[0]);
      if (classesList.length > 0) setSelectedClass(classesList[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApiOptions();
  }, [loadApiOptions]);

  function handleNextStep() {
    setFormError('');
    if (!name.trim()) {
      setFormError('Informe o nome do seu personagem para continuar.');
      return;
    }
    if (!selectedRace || !selectedClass) {
      setFormError('Selecione uma Raça e uma Classe da API D&D 5e.');
      return;
    }

    router.push({
      pathname: '/create/step2-attributes',
      params: {
        name: name.trim(),
        background: background.trim() || 'Aventureiro',
        raceIndex: selectedRace.index,
        raceName: selectedRace.name,
        classIndex: selectedClass.index,
        className: selectedClass.name,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={styles.stepBadge}>Passo 1 de 2</Text>
          <Text style={styles.topTitle}>Identidade do Personagem</Text>
        </View>
      </View>

      {loading ? (
        <LoadingView message="Carregando Raças e Classes da API D&D 5e..." />
      ) : error ? (
        <LoadingView error={error} onRetry={loadApiOptions} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Identidade</Text>

            <CustomInput
              label="Nome do Personagem"
              value={name}
              onChangeText={setName}
              placeholder="Ex: Lyra Lâmina-do-Crepúsculo"
              icon="person-outline"
            />

            <CustomInput
              label="Antecedente"
              value={background}
              onChangeText={setBackground}
              placeholder="Ex: Sábio, Soldado, Nobre..."
              icon="bookmark-outline"
            />

            <View style={styles.suggestionsWrap}>
              {BACKGROUND_SUGGESTIONS.map((bg) => {
                const active = background === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.miniChip, active && styles.miniChipActive]}
                    onPress={() => setBackground(bg)}
                  >
                    <Text
                      style={[
                        styles.miniChipText,
                        active && styles.miniChipTextActive,
                      ]}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Raça (API D&D 5e)</Text>
            <View style={styles.optionGrid}>
              {races.map((race) => {
                const active = selectedRace?.index === race.index;
                return (
                  <TouchableOpacity
                    key={race.index}
                    style={[styles.optionCard, active && styles.optionCardActive]}
                    onPress={() => setSelectedRace(race)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {race.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Classe (API D&D 5e)</Text>
            <View style={styles.optionGrid}>
              {classes.map((cls) => {
                const active = selectedClass?.index === cls.index;
                return (
                  <TouchableOpacity
                    key={cls.index}
                    style={[styles.optionCard, active && styles.optionCardActive]}
                    onPress={() => setSelectedClass(cls)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {cls.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {formError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="warning-outline" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <CustomButton
            title="Avançar para Atributos"
            icon="arrow-forward"
            size="lg"
            onPress={handleNextStep}
          />
        </ScrollView>
      )}
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  miniChip: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
  },
  miniChipActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  miniChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  miniChipTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  optionCard: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  optionText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.dangerMuted,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  errorText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
  },
});

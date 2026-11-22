import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  useFocusEffect,
  useLocalSearchParams,
  useGlobalSearchParams,
  useRouter,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  COLORS,
  SPACING,
  RADIUS,
  FONT_SIZE,
  LAYOUT,
} from '../../../src/theme/colors';
import LoadingView from '../../../src/components/LoadingView';
import StatBox from '../../../src/components/StatBox';
import CustomButton from '../../../src/components/CustomButton';
import QuickRollModal from '../../../src/components/QuickRollModal';
import {
  getCharacterById,
  updateCharacter,
  addDiceRoll,
} from '../../../src/services/storage';
import {
  fetchClassLevels,
  fetchTraitDetail,
  fetchFeatureDetail,
} from '../../../src/services/dndApi';
import {
  ATTRIBUTES,
  SKILLS,
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
  rollDiceExpression,
} from '../../../src/utils/dndRules';

function slugifyIndex(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeTraits(rawTraits) {
  if (!Array.isArray(rawTraits)) return [];
  return rawTraits
    .map((t) => {
      if (typeof t === 'string') {
        return { index: slugifyIndex(t), name: t };
      }
      if (t && t.name) {
        return { index: t.index || slugifyIndex(t.name), name: t.name };
      }
      return null;
    })
    .filter(Boolean);
}

function extractFeaturesUpToLevel(levelsData, maxLevel) {
  if (!Array.isArray(levelsData)) return [];
  const collected = [];
  const seen = new Set();

  levelsData
    .filter((lvl) => Number(lvl.level) <= maxLevel)
    .sort((a, b) => Number(a.level) - Number(b.level))
    .forEach((lvl) => {
      (lvl.features || []).forEach((feat) => {
        if (feat?.index && !seen.has(feat.index)) {
          seen.add(feat.index);
          collected.push({
            index: feat.index,
            name: feat.name,
            level: Number(lvl.level),
          });
        }
      });
    });

  return collected;
}

function extractSpellSlotsFromLevel(levelEntry, currentSlots = {}) {
  const sc = levelEntry?.spellcasting;
  if (!sc) return currentSlots;

  const updated = { ...currentSlots };
  for (let circle = 1; circle <= 9; circle += 1) {
    const key = `spell_slots_level_${circle}`;
    if (sc[key] !== undefined) {
      const nextMax = Number(sc[key]) || 0;
      if (nextMax > 0 || updated[circle]) {
        const prevUsed = updated[circle]?.used || 0;
        updated[circle] = {
          max: nextMax,
          used: Math.min(prevUsed, nextMax),
        };
      }
    }
  }
  return updated;
}

export default function CharacterOverviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const characterId = String(localParams.id || globalParams.id || '');

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal de rolagem imediata
  const [activeRoll, setActiveRoll] = useState(null);
  const [lastRollConfig, setLastRollConfig] = useState(null);

  // Modal de descrição (Traços Raciais & Habilidades de Classe)
  const [descModal, setDescModal] = useState({
    visible: false,
    title: '',
    badge: '',
    loading: false,
    error: null,
    paragraphs: [],
  });

  // Modal de Evolução (Level Up)
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [levelUpLoading, setLevelUpLoading] = useState(false);
  const [levelUpError, setLevelUpError] = useState(null);
  const [nextLevelData, setNextLevelData] = useState(null);
  const [hasAsi, setHasAsi] = useState(false);
  const [asiBonuses, setAsiBonuses] = useState({
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
  });
  const [hpMode, setHpMode] = useState('fixed'); // 'fixed' | 'roll'
  const [rolledHpDie, setRolledHpDie] = useState(null);
  const [savingLevelUp, setSavingLevelUp] = useState(false);
  const [expandedNewFeature, setExpandedNewFeature] = useState(null);
  const [newFeatureDescMap, setNewFeatureDescMap] = useState({});
  const [loadingNewFeatureIdx, setLoadingNewFeatureIdx] = useState(null);

  const loadCharacter = useCallback(async () => {
    if (!characterId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getCharacterById(characterId);
      if (!data) {
        setCharacter(null);
        return;
      }

      if (!Array.isArray(data.features) && data.classIndex) {
        try {
          const levelsData = await fetchClassLevels(data.classIndex);
          const features = extractFeaturesUpToLevel(levelsData, data.level || 1);
          const hydrated = { ...data, features };
          setCharacter(hydrated);
          await updateCharacter(data.id, { features });
        } catch {
          setCharacter(data);
        }
      } else {
        setCharacter(data);
      }
    } finally {
      setLoading(false);
    }
  }, [characterId]);

  useFocusEffect(
    useCallback(() => {
      loadCharacter();
    }, [loadCharacter])
  );

  async function executeQuickRoll(config) {
    const rolled = rollDiceExpression('1d20', config.modifier);
    setLastRollConfig(config);
    setActiveRoll({
      ...rolled,
      title: config.title,
      subtitle: config.subtitle,
      kind: 'check',
    });
    await addDiceRoll({
      ...rolled,
      label: `${config.title} • ${character?.name || ''}`,
    });
  }

  function openRoll(modValue, title, subtitle = 'Teste de d20') {
    executeQuickRoll({
      modifier: modValue,
      title,
      subtitle,
    });
  }

  async function handleOpenTraitOrFeature(kind, item) {
    const badge =
      kind === 'trait'
        ? 'Traço Racial'
        : `Habilidade de Classe${item.level ? ` • Nível ${item.level}` : ''}`;

    setDescModal({
      visible: true,
      title: item.name,
      badge,
      loading: true,
      error: null,
      paragraphs: [],
    });

    try {
      const detail =
        kind === 'trait'
          ? await fetchTraitDetail(item.index)
          : await fetchFeatureDetail(item.index);

      const descArray = Array.isArray(detail?.desc)
        ? detail.desc
        : detail?.desc
        ? [String(detail.desc)]
        : ['Sem descrição detalhada registrada na API D&D 5e.'];

      setDescModal((prev) => ({
        ...prev,
        title: detail?.name || prev.title,
        loading: false,
        paragraphs: descArray,
      }));
    } catch (err) {
      setDescModal((prev) => ({
        ...prev,
        loading: false,
        error:
          err?.message ||
          'Não foi possível carregar a descrição na API D&D 5e.',
      }));
    }
  }

  async function handleOpenLevelUp() {
    if (!character || (character.level || 1) >= 20) return;

    const currentLevel = character.level || 1;
    const targetLevel = currentLevel + 1;

    setLevelUpVisible(true);
    setLevelUpLoading(true);
    setLevelUpError(null);
    setNextLevelData(null);
    setHpMode('fixed');
    setRolledHpDie(null);
    setExpandedNewFeature(null);
    setAsiBonuses({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });

    try {
      const levelsData = await fetchClassLevels(character.classIndex || 'fighter');
      const prevEntry = levelsData.find((l) => Number(l.level) === currentLevel);
      const nextEntry = levelsData.find((l) => Number(l.level) === targetLevel);

      const prevAsi = Number(prevEntry?.ability_score_bonuses) || 0;
      const nextAsi = Number(nextEntry?.ability_score_bonuses) || 0;
      const grantsAsi =
        nextAsi > prevAsi ||
        [4, 8, 12, 16, 19].includes(targetLevel);

      setNextLevelData(nextEntry || { level: targetLevel, features: [] });
      setHasAsi(grantsAsi);
    } catch (err) {
      setLevelUpError(
        err?.message ||
          'Não foi possível carregar os dados de evolução da API D&D 5e.'
      );
    } finally {
      setLevelUpLoading(false);
    }
  }

  function handleAdjustAsi(attrKey, delta) {
    const totalSpent = Object.values(asiBonuses).reduce((a, b) => a + b, 0);
    const currentAttrVal =
      (character?.attributes?.[attrKey] ?? 10) + (asiBonuses[attrKey] || 0);

    if (delta > 0) {
      if (totalSpent >= 2 || currentAttrVal >= 20) return;
      setAsiBonuses((prev) => ({ ...prev, [attrKey]: (prev[attrKey] || 0) + 1 }));
    } else if (delta < 0) {
      if ((asiBonuses[attrKey] || 0) <= 0) return;
      setAsiBonuses((prev) => ({ ...prev, [attrKey]: (prev[attrKey] || 0) - 1 }));
    }
  }

  function handleRollLevelUpHp() {
    const hitDie = Number(character?.hitDie) || 8;
    const roll = Math.floor(Math.random() * hitDie) + 1;
    setRolledHpDie(roll);
    setHpMode('roll');
  }

  async function handleToggleLevelUpFeaturePreview(feat) {
    if (expandedNewFeature === feat.index) {
      setExpandedNewFeature(null);
      return;
    }

    setExpandedNewFeature(feat.index);
    if (newFeatureDescMap[feat.index]) return;

    setLoadingNewFeatureIdx(feat.index);
    try {
      const detail = await fetchFeatureDetail(feat.index);
      const paragraphs = Array.isArray(detail?.desc)
        ? detail.desc
        : detail?.desc
        ? [String(detail.desc)]
        : ['Sem descrição detalhada na API D&D 5e.'];
      setNewFeatureDescMap((prev) => ({ ...prev, [feat.index]: paragraphs }));
    } catch {
      setNewFeatureDescMap((prev) => ({
        ...prev,
        [feat.index]: ['Não foi possível carregar a descrição agora.'],
      }));
    } finally {
      setLoadingNewFeatureIdx(null);
    }
  }

  async function handleConfirmLevelUp() {
    if (!character) return;
    setSavingLevelUp(true);
    try {
      const currentLevel = character.level || 1;
      const nextLevel = Math.min(20, currentLevel + 1);
      const hitDie = Number(character.hitDie) || 8;

      const oldAttrs = character.attributes || {};
      const nextAttrs = {};
      ATTRIBUTES.forEach((attr) => {
        nextAttrs[attr.key] =
          (oldAttrs[attr.key] ?? 10) + (hasAsi ? asiBonuses[attr.key] || 0 : 0);
      });

      const oldConMod = calculateModifier(oldAttrs.con ?? 10);
      const nextConMod = calculateModifier(nextAttrs.con ?? 10);
      const conModIncrease = Math.max(0, nextConMod - oldConMod);

      const oldDexMod = calculateModifier(oldAttrs.dex ?? 10);
      const nextDexMod = calculateModifier(nextAttrs.dex ?? 10);
      const dexModDiff = nextDexMod - oldDexMod;

      const fixedDieGain = Math.floor(hitDie / 2) + 1;
      const dieGain =
        hpMode === 'roll' && rolledHpDie !== null ? rolledHpDie : fixedDieGain;
      const levelHpGain = Math.max(1, dieGain + nextConMod);
      const retroactiveConHp = conModIncrease * currentLevel;
      const totalHpGain = levelHpGain + retroactiveConHp;

      const nextMaxHp = (Number(character.maxHp) || 1) + totalHpGain;
      const nextCurrentHp = Math.min(
        nextMaxHp,
        (Number(character.currentHp) ?? Number(character.maxHp) ?? 1) + totalHpGain
      );
      const nextAc = (Number(character.armorClass) || 10) + dexModDiff;

      const existingFeatures = Array.isArray(character.features)
        ? character.features
        : [];
      const existingSet = new Set(existingFeatures.map((f) => f.index));
      const newFeatures = (nextLevelData?.features || [])
        .filter((f) => f?.index && !existingSet.has(f.index))
        .map((f) => ({
          index: f.index,
          name: f.name,
          level: nextLevel,
        }));
      const mergedFeatures = [...existingFeatures, ...newFeatures];

      const nextSpellSlots = extractSpellSlotsFromLevel(
        nextLevelData,
        character.spellSlots || {}
      );

      const partialUpdate = {
        level: nextLevel,
        attributes: nextAttrs,
        maxHp: nextMaxHp,
        currentHp: nextCurrentHp,
        armorClass: nextAc,
        features: mergedFeatures,
        spellSlots: nextSpellSlots,
      };

      const updatedChar = { ...character, ...partialUpdate };
      setCharacter(updatedChar);
      await updateCharacter(character.id, partialUpdate);
      setLevelUpVisible(false);
    } finally {
      setSavingLevelUp(false);
    }
  }

  if (loading) {
    return <LoadingView message="Abrindo ficha do personagem..." />;
  }

  if (!character) {
    return (
      <LoadingView
        error="Personagem não encontrado no armazenamento local."
        onRetry={() => router.replace('/(tabs)')}
      />
    );
  }

  const attributes = character.attributes || {};
  const currentLevel = character.level || 1;
  const profBonus = calculateProficiencyBonus(currentLevel);
  const initiative = calculateModifier(attributes.dex ?? 10);
  const maxHp = Math.max(1, Number(character.maxHp) || 1);
  const currentHp = Math.max(
    0,
    Math.min(maxHp, Number(character.currentHp) ?? maxHp)
  );
  const hpPercent = Math.round((currentHp / maxHp) * 100);
  const hpColor =
    hpPercent > 50
      ? COLORS.success
      : hpPercent > 25
      ? COLORS.primary
      : COLORS.danger;

  async function handleHpChange(nextHp) {
    const clamped = Math.max(0, Math.min(maxHp, nextHp));
    setCharacter((prev) => (prev ? { ...prev, currentHp: clamped } : prev));
    await updateCharacter(character.id, { currentHp: clamped });
  }

  const savingThrows = character.savingThrows || [];
  const proficientSkills = character.proficientSkills || [];
  const normalizedTraits = normalizeTraits(character.traits);
  const learnedFeatures = Array.isArray(character.features)
    ? character.features
    : [];

  async function handleToggleSavingThrow(attrKey) {
    const exists = savingThrows.includes(attrKey);
    const next = exists
      ? savingThrows.filter((k) => k !== attrKey)
      : [...savingThrows, attrKey];
    setCharacter((prev) => (prev ? { ...prev, savingThrows: next } : prev));
    await updateCharacter(character.id, { savingThrows: next });
  }

  async function handleToggleSkill(skillId) {
    const exists = proficientSkills.includes(skillId);
    const next = exists
      ? proficientSkills.filter((id) => id !== skillId)
      : [...proficientSkills, skillId];
    setCharacter((prev) => (prev ? { ...prev, proficientSkills: next } : prev));
    await updateCharacter(character.id, { proficientSkills: next });
  }

  // Prévia de ganho de PV no Modal de Evolução
  const hitDie = Number(character.hitDie) || 8;
  const asiSpent = Object.values(asiBonuses).reduce((a, b) => a + b, 0);
  const previewConScore = (attributes.con ?? 10) + (hasAsi ? asiBonuses.con : 0);
  const previewConMod = calculateModifier(previewConScore);
  const previewFixedHp = Math.max(1, Math.floor(hitDie / 2) + 1 + previewConMod);
  const previewRolledHp =
    rolledHpDie !== null ? Math.max(1, rolledHpDie + previewConMod) : null;
  const previewRetroConHp =
    Math.max(0, previewConMod - calculateModifier(attributes.con ?? 10)) *
    currentLevel;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroAvatar}>
              <Ionicons name="shield-half" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{character.name}</Text>
              <Text style={styles.heroSub}>
                {character.raceName} • {character.className}
              </Text>
              <Text style={styles.heroBg}>
                Antecedente: {character.background || 'Aventureiro'}
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelLabel}>NÍVEL</Text>
              <Text style={styles.levelValue}>{currentLevel}</Text>
            </View>
          </View>

          {currentLevel < 20 ? (
            <TouchableOpacity
              style={styles.levelUpBannerBtn}
              activeOpacity={0.8}
              onPress={handleOpenLevelUp}
            >
              <Ionicons name="arrow-up-circle" size={18} color={COLORS.primaryLight} />
              <Text style={styles.levelUpBannerText}>
                Evoluir Personagem (Subir para Nível {currentLevel + 1})
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primaryLight} />
            </TouchableOpacity>
          ) : (
            <View style={styles.maxLevelPill}>
              <Ionicons name="trophy" size={15} color={COLORS.primaryLight} />
              <Text style={styles.maxLevelText}>Nível Máximo (20) Alcançado</Text>
            </View>
          )}
        </View>

        <View style={styles.vitalsGrid}>
          <View style={styles.vitalCard}>
            <Ionicons name="shield" size={18} color={COLORS.primary} />
            <Text style={styles.vitalValue}>{character.armorClass ?? 10}</Text>
            <Text style={styles.vitalLabel}>CA</Text>
          </View>
          <TouchableOpacity
            style={styles.vitalCard}
            activeOpacity={0.78}
            onPress={() =>
              openRoll(initiative, 'Iniciativa', 'Ordem de Combate (1d20 + DES)')
            }
          >
            <Ionicons name="flash" size={18} color={COLORS.primaryLight} />
            <Text style={styles.vitalValue}>{formatModifier(initiative)}</Text>
            <Text style={styles.vitalLabel}>Iniciativa</Text>
          </TouchableOpacity>
          <View style={styles.vitalCard}>
            <Ionicons name="ribbon" size={18} color={COLORS.magicLight} />
            <Text style={styles.vitalValue}>{formatModifier(profBonus)}</Text>
            <Text style={styles.vitalLabel}>Proficiência</Text>
          </View>
          <View style={styles.vitalCard}>
            <Ionicons name="walk" size={18} color={COLORS.success} />
            <Text style={styles.vitalValue}>{character.speed ?? 30}ft</Text>
            <Text style={styles.vitalLabel}>Desloc.</Text>
          </View>
        </View>

        <View style={styles.hpCard}>
          <View style={styles.hpHeader}>
            <View style={styles.hpTitleRow}>
              <Ionicons name="heart" size={18} color={COLORS.danger} />
              <Text style={styles.hpTitle}>Pontos de Vida</Text>
            </View>
            <Text style={styles.hpCounter}>
              {currentHp} / {maxHp} PV
            </Text>
          </View>

          <View style={styles.hpTrack}>
            <View
              style={[
                styles.hpFill,
                { width: `${hpPercent}%`, backgroundColor: hpColor },
              ]}
            />
          </View>

          <View style={styles.hpButtonsRow}>
            <TouchableOpacity
              style={[styles.hpBtn, styles.hpBtnDamage]}
              onPress={() => handleHpChange(currentHp - 5)}
            >
              <Text style={styles.hpBtnText}>-5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.hpBtn, styles.hpBtnDamage]}
              onPress={() => handleHpChange(currentHp - 1)}
            >
              <Text style={styles.hpBtnText}>-1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.hpBtn, styles.hpBtnHeal]}
              onPress={() => handleHpChange(currentHp + 1)}
            >
              <Text style={styles.hpBtnText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.hpBtn, styles.hpBtnHeal]}
              onPress={() => handleHpChange(currentHp + 5)}
            >
              <Text style={styles.hpBtnText}>+5</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.hpBtn, styles.hpBtnRest]}
              onPress={() => handleHpChange(maxHp)}
            >
              <Text style={styles.hpBtnRestText}>Máx</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="barbell-outline" size={17} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Atributos</Text>
            <Text style={styles.sectionHint}>Toque para rolar d20</Text>
          </View>
          <View style={styles.attrGrid}>
            {ATTRIBUTES.map((attr) => {
              const score = attributes[attr.key] ?? 10;
              const mod = calculateModifier(score);
              return (
                <StatBox
                  key={attr.key}
                  short={attr.short}
                  label={attr.label}
                  score={score}
                  onPress={() =>
                    openRoll(
                      mod,
                      `Teste de ${attr.label}`,
                      `Atributo ${attr.short} (${formatModifier(mod)})`
                    )
                  }
                />
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color={COLORS.primary}
            />
            <Text style={styles.sectionTitle}>Salvaguardas</Text>
            <Text style={styles.sectionHint}>Toque no bônus p/ rolar</Text>
          </View>
          <View style={styles.savesGrid}>
            {ATTRIBUTES.map((attr) => {
              const isProf = savingThrows.includes(attr.key);
              const total =
                calculateModifier(attributes[attr.key] ?? 10) +
                (isProf ? profBonus : 0);
              return (
                <View
                  key={attr.key}
                  style={[styles.saveChip, isProf && styles.saveChipActive]}
                >
                  <TouchableOpacity
                    style={styles.saveToggleArea}
                    activeOpacity={0.75}
                    onPress={() => handleToggleSavingThrow(attr.key)}
                  >
                    <Ionicons
                      name={isProf ? 'checkmark-circle' : 'ellipse-outline'}
                      size={17}
                      color={isProf ? COLORS.primaryLight : COLORS.textMuted}
                    />
                    <Text style={styles.saveName}>{attr.short}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.78}
                    onPress={() =>
                      openRoll(
                        total,
                        `Salvaguarda • ${attr.label}`,
                        isProf
                          ? `${attr.short} + Proficiência (${formatModifier(total)})`
                          : `Teste de Resistência (${formatModifier(total)})`
                      )
                    }
                    style={[
                      styles.saveModPill,
                      isProf && styles.saveModPillActive,
                    ]}
                  >
                    <Ionicons
                      name="dice-outline"
                      size={13}
                      color={isProf ? COLORS.primaryLight : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.saveModText,
                        isProf && styles.saveModTextActive,
                      ]}
                    >
                      {formatModifier(total)}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={17} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Perícias (18)</Text>
            <Text style={styles.sectionHint}>Toque no bônus p/ rolar</Text>
          </View>
          <View style={styles.skillsList}>
            {SKILLS.map((skill) => {
              const isProf = proficientSkills.includes(skill.id);
              const attrInfo = ATTRIBUTES.find((a) => a.key === skill.ability);
              const total =
                calculateModifier(attributes[skill.ability] ?? 10) +
                (isProf ? profBonus : 0);

              return (
                <View key={skill.id} style={styles.skillRow}>
                  <TouchableOpacity
                    style={styles.skillToggleArea}
                    activeOpacity={0.75}
                    onPress={() => handleToggleSkill(skill.id)}
                  >
                    <Ionicons
                      name={isProf ? 'checkmark-circle' : 'ellipse-outline'}
                      size={18}
                      color={isProf ? COLORS.primaryLight : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.skillName,
                        isProf && styles.skillNameActive,
                      ]}
                    >
                      {skill.name}
                    </Text>
                    <Text style={styles.skillAttrTag}>
                      ({attrInfo?.short || skill.ability.toUpperCase()})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.skillModBtn,
                      isProf && styles.skillModBtnActive,
                    ]}
                    activeOpacity={0.78}
                    onPress={() =>
                      openRoll(
                        total,
                        `Perícia • ${skill.name}`,
                        `${attrInfo?.short || skill.ability.toUpperCase()}${
                          isProf ? ' + Proficiência' : ''
                        } (${formatModifier(total)})`
                      )
                    }
                  >
                    <Ionicons
                      name="dice-outline"
                      size={13}
                      color={isProf ? COLORS.primaryLight : COLORS.textSecondary}
                    />
                    <Text
                      style={[
                        styles.skillModText,
                        isProf && styles.skillModTextActive,
                      ]}
                    >
                      {formatModifier(total)}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {normalizedTraits.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={17} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Traços Raciais</Text>
              <Text style={styles.sectionHint}>Toque para descrição</Text>
            </View>
            <View style={styles.traitsWrap}>
              {normalizedTraits.map((trait, idx) => (
                <TouchableOpacity
                  key={`${trait.index}_${idx}`}
                  style={styles.traitBadge}
                  activeOpacity={0.78}
                  onPress={() => handleOpenTraitOrFeature('trait', trait)}
                >
                  <Text style={styles.traitText}>{trait.name}</Text>
                  <Ionicons
                    name="information-circle-outline"
                    size={14}
                    color={COLORS.primaryLight}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {learnedFeatures.length > 0 ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="ribbon-outline" size={17} color={COLORS.magicLight} />
              <Text style={styles.sectionTitle}>
                Habilidades de Classe ({learnedFeatures.length})
              </Text>
              <Text style={styles.sectionHint}>Toque para descrição</Text>
            </View>
            <View style={styles.featuresList}>
              {learnedFeatures.map((feat, idx) => (
                <TouchableOpacity
                  key={`${feat.index}_${idx}`}
                  style={styles.featureRow}
                  activeOpacity={0.78}
                  onPress={() => handleOpenTraitOrFeature('feature', feat)}
                >
                  <View style={styles.featureLevelBadge}>
                    <Text style={styles.featureLevelText}>
                      Nv. {feat.level || 1}
                    </Text>
                  </View>
                  <Text style={styles.featureName} numberOfLines={1}>
                    {feat.name}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Modal de Rolagem Imediata */}
      <QuickRollModal
        visible={Boolean(activeRoll)}
        roll={activeRoll}
        onReroll={() => {
          if (lastRollConfig) executeQuickRoll(lastRollConfig);
        }}
        onClose={() => setActiveRoll(null)}
      />

      {/* Modal de Descrição de Traço Racial / Habilidade */}
      <Modal
        visible={descModal.visible}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setDescModal((prev) => ({ ...prev, visible: false }))
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.descModalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleCol}>
                <Text style={styles.descBadge}>{descModal.badge}</Text>
                <Text style={styles.modalTitle}>{descModal.title}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() =>
                  setDescModal((prev) => ({ ...prev, visible: false }))
                }
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {descModal.loading ? (
              <View style={styles.descLoadingWrap}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.descLoadingText}>
                  Consultando descrição na API D&D 5e...
                </Text>
              </View>
            ) : descModal.error ? (
              <View style={styles.descErrorWrap}>
                <Ionicons
                  name="alert-circle-outline"
                  size={30}
                  color={COLORS.danger}
                />
                <Text style={styles.descErrorText}>{descModal.error}</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.descScroll}
                contentContainerStyle={styles.descScrollContent}
              >
                {descModal.paragraphs.map((p, idx) => (
                  <Text key={idx} style={styles.descParagraph}>
                    {p}
                  </Text>
                ))}
              </ScrollView>
            )}

            <CustomButton
              title="Fechar"
              variant="secondary"
              onPress={() =>
                setDescModal((prev) => ({ ...prev, visible: false }))
              }
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Evolução de Personagem (Level Up) */}
      <Modal
        visible={levelUpVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLevelUpVisible(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <View
            style={[
              styles.levelUpCard,
              { paddingBottom: Math.max(insets.bottom, SPACING.lg) },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleCol}>
                <Text style={styles.descBadge}>Evolução D&D 5e</Text>
                <Text style={styles.modalTitle}>
                  Subir para Nível {currentLevel + 1}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setLevelUpVisible(false)}
              >
                <Ionicons name="close" size={20} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {levelUpLoading ? (
              <LoadingView message="Buscando benefícios do novo nível na API D&D 5e..." />
            ) : levelUpError ? (
              <LoadingView error={levelUpError} onRetry={handleOpenLevelUp} />
            ) : (
              <ScrollView
                contentContainerStyle={styles.levelUpScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.levelSummaryRow}>
                  <View style={styles.levelSummaryPill}>
                    <Text style={styles.levelSummaryLabel}>Nível</Text>
                    <Text style={styles.levelSummaryVal}>
                      {currentLevel} → {currentLevel + 1}
                    </Text>
                  </View>
                  <View style={styles.levelSummaryPill}>
                    <Text style={styles.levelSummaryLabel}>Proficiência</Text>
                    <Text style={styles.levelSummaryVal}>
                      {formatModifier(calculateProficiencyBonus(currentLevel + 1))}
                    </Text>
                  </View>
                  <View style={styles.levelSummaryPill}>
                    <Text style={styles.levelSummaryLabel}>Dado de Vida</Text>
                    <Text style={styles.levelSummaryVal}>d{hitDie}</Text>
                  </View>
                </View>

                <View style={styles.levelBlock}>
                  <Text style={styles.levelBlockTitle}>
                    Ganho de Pontos de Vida (PV)
                  </Text>
                  <View style={styles.hpChoiceRow}>
                    <TouchableOpacity
                      style={[
                        styles.hpChoiceCard,
                        hpMode === 'fixed' && styles.hpChoiceCardActive,
                      ]}
                      onPress={() => setHpMode('fixed')}
                    >
                      <Text style={styles.hpChoiceTitle}>Média Fixa</Text>
                      <Text style={styles.hpChoiceValue}>
                        +{previewFixedHp} PV
                      </Text>
                      <Text style={styles.hpChoiceMeta}>
                        {Math.floor(hitDie / 2) + 1} + CON ({formatModifier(previewConMod)})
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.hpChoiceCard,
                        hpMode === 'roll' && styles.hpChoiceCardActive,
                      ]}
                      onPress={handleRollLevelUpHp}
                    >
                      <Text style={styles.hpChoiceTitle}>Rolar 1d{hitDie}</Text>
                      <Text style={styles.hpChoiceValue}>
                        {previewRolledHp !== null
                          ? `+${previewRolledHp} PV`
                          : 'Toque p/ rolar'}
                      </Text>
                      <Text style={styles.hpChoiceMeta}>
                        {rolledHpDie !== null
                          ? `Dado [${rolledHpDie}] + CON (${formatModifier(previewConMod)})`
                          : `1d${hitDie} + CON`}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {previewRetroConHp > 0 ? (
                    <Text style={styles.retroHpNote}>
                      + {previewRetroConHp} PV extras retroativos pelo aumento de Constituição!
                    </Text>
                  ) : null}
                </View>

                {hasAsi ? (
                  <View style={styles.levelBlock}>
                    <View style={styles.asiHeaderRow}>
                      <Text style={styles.levelBlockTitle}>
                        Aumento de Atributo (ASI)
                      </Text>
                      <Text style={styles.asiRemaining}>
                        Restam {2 - asiSpent} pts
                      </Text>
                    </View>
                    <Text style={styles.asiHint}>
                      Distribua até +2 pontos em seus atributos (máximo 20).
                    </Text>

                    <View style={styles.asiList}>
                      {ATTRIBUTES.map((attr) => {
                        const baseVal = attributes[attr.key] ?? 10;
                        const bonus = asiBonuses[attr.key] || 0;
                        const totalVal = baseVal + bonus;
                        return (
                          <View key={attr.key} style={styles.asiRow}>
                            <Text style={styles.asiAttrName}>
                              {attr.short} • {attr.label}
                            </Text>
                            <View style={styles.asiControls}>
                              <TouchableOpacity
                                style={[
                                  styles.asiBtn,
                                  bonus <= 0 && styles.asiBtnDisabled,
                                ]}
                                disabled={bonus <= 0}
                                onPress={() => handleAdjustAsi(attr.key, -1)}
                              >
                                <Ionicons
                                  name="remove"
                                  size={16}
                                  color={COLORS.textPrimary}
                                />
                              </TouchableOpacity>
                              <Text style={styles.asiScore}>
                                {totalVal}
                                {bonus > 0 ? ` (+${bonus})` : ''}
                              </Text>
                              <TouchableOpacity
                                style={[
                                  styles.asiBtn,
                                  (asiSpent >= 2 || totalVal >= 20) &&
                                    styles.asiBtnDisabled,
                                ]}
                                disabled={asiSpent >= 2 || totalVal >= 20}
                                onPress={() => handleAdjustAsi(attr.key, 1)}
                              >
                                <Ionicons
                                  name="add"
                                  size={16}
                                  color={COLORS.textPrimary}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                <View style={styles.levelBlock}>
                  <Text style={styles.levelBlockTitle}>
                    Novas Habilidades Desbloqueadas
                  </Text>
                  {Array.isArray(nextLevelData?.features) &&
                  nextLevelData.features.length > 0 ? (
                    <View style={styles.featuresList}>
                      {nextLevelData.features.map((feat) => {
                        const isOpen = expandedNewFeature === feat.index;
                        const isFetching = loadingNewFeatureIdx === feat.index;
                        const descLines = newFeatureDescMap[feat.index] || [];
                        return (
                          <View key={feat.index} style={styles.newFeatureBox}>
                            <TouchableOpacity
                              style={styles.newFeatureHeader}
                              activeOpacity={0.78}
                              onPress={() => handleToggleLevelUpFeaturePreview(feat)}
                            >
                              <Ionicons
                                name="sparkles"
                                size={15}
                                color={COLORS.primaryLight}
                              />
                              <Text style={styles.featureName}>{feat.name}</Text>
                              <Ionicons
                                name={isOpen ? 'chevron-up' : 'chevron-down'}
                                size={17}
                                color={COLORS.primaryLight}
                              />
                            </TouchableOpacity>
                            {isOpen ? (
                              <View style={styles.newFeatureBody}>
                                {isFetching ? (
                                  <ActivityIndicator
                                    size="small"
                                    color={COLORS.primary}
                                  />
                                ) : (
                                  descLines.map((line, i) => (
                                    <Text key={i} style={styles.newFeatureDesc}>
                                      {line}
                                    </Text>
                                  ))
                                )}
                              </View>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.noNewFeaturesText}>
                      Progressão de nível, PV e espaços de magia (sem nova habilidade nomeada neste nível).
                    </Text>
                  )}
                </View>

                <CustomButton
                  title={`Confirmar Evolução para Nível ${currentLevel + 1}`}
                  icon="arrow-up-circle-outline"
                  size="lg"
                  loading={savingLevelUp}
                  onPress={handleConfirmLevelUp}
                />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroAvatar: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  heroSub: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  heroBg: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  levelBadge: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    alignItems: 'center',
  },
  levelLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  levelValue: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
  },
  levelUpBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  levelUpBannerText: {
    flex: 1,
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  maxLevelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.xs + 2,
  },
  maxLevelText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 4,
  },
  vitalValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  vitalLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hpCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  hpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  hpTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  hpCounter: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  hpTrack: {
    height: 10,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  hpButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
  },
  hpBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hpBtnDamage: {
    backgroundColor: COLORS.dangerMuted,
    borderColor: COLORS.danger,
  },
  hpBtnHeal: {
    backgroundColor: COLORS.successMuted,
    borderColor: COLORS.success,
  },
  hpBtnRest: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  hpBtnText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  hpBtnRestText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
  },
  sectionHint: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
  },
  attrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  savesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  saveChip: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 4,
    gap: SPACING.xs + 2,
  },
  saveChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  saveToggleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    paddingVertical: 2,
  },
  saveName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  saveModPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  saveModPillActive: {
    borderColor: COLORS.primary,
  },
  saveModText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  saveModTextActive: {
    color: COLORS.primaryLight,
  },
  skillsList: {
    gap: 6,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 4,
    gap: SPACING.sm,
  },
  skillToggleArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  skillName: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  skillNameActive: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  skillAttrTag: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  skillModBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 54,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
  },
  skillModBtnActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  skillModText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  skillModTextActive: {
    color: COLORS.primaryLight,
  },
  traitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  traitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 7,
  },
  traitText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  featuresList: {
    gap: SPACING.xs + 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  featureLevelBadge: {
    backgroundColor: COLORS.magicMuted,
    borderWidth: 1,
    borderColor: COLORS.magic,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  featureLevelText: {
    color: COLORS.magicLight,
    fontSize: 10,
    fontWeight: '800',
  },
  featureName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  descModalCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '78%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  modalTitleCol: {
    flex: 1,
    gap: 2,
  },
  descBadge: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  descLoadingWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  descLoadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  descErrorWrap: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  descErrorText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  descScroll: {
    maxHeight: 340,
  },
  descScrollContent: {
    gap: SPACING.sm + 2,
  },
  descParagraph: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  levelUpCard: {
    height: '86%',
    width: '100%',
    maxWidth: LAYOUT.maxContentWidth,
    alignSelf: 'center',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  levelUpScroll: {
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  levelSummaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  levelSummaryPill: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: 2,
  },
  levelSummaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  levelSummaryVal: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  levelBlock: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm + 2,
  },
  levelBlockTitle: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hpChoiceRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  hpChoiceCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  hpChoiceCardActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  hpChoiceTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  hpChoiceValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
  },
  hpChoiceMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  retroHpNote: {
    color: COLORS.success,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  asiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  asiRemaining: {
    color: COLORS.success,
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  asiHint: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
  },
  asiList: {
    gap: SPACING.xs + 2,
  },
  asiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  asiAttrName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  asiControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  asiBtn: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  asiBtnDisabled: {
    opacity: 0.35,
  },
  asiScore: {
    minWidth: 54,
    textAlign: 'center',
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  noNewFeaturesText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  newFeatureBox: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  newFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  newFeatureBody: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xs + 2,
  },
  newFeatureDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs + 1,
    lineHeight: 19,
  },
});

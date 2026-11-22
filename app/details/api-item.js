import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZE, LAYOUT } from '../../src/theme/colors';
import LoadingView from '../../src/components/LoadingView';
import CustomButton from '../../src/components/CustomButton';
import QuickRollModal from '../../src/components/QuickRollModal';
import { fetchCompendiumDetail } from '../../src/services/dndApi';
import { addDiceRoll } from '../../src/services/storage';
import {
  extractSpellDamageInfo,
  extractWeaponInfo,
  rollDiceExpression,
} from '../../src/utils/dndRules';

const CATEGORY_LABELS = {
  spells: 'Magia',
  equipment: 'Equipamento',
  races: 'Raça',
  classes: 'Classe',
};

function InfoRow({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        {icon ? <Ionicons name={icon} size={17} color={COLORS.primary} /> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function TagList({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <View style={styles.tagWrap}>
      {items.map((label, idx) => (
        <View key={`${label}_${idx}`} style={styles.tag}>
          <Text style={styles.tagText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function renderSpellDetails(item, onQuickRoll) {
  const levelLabel = item.level === 0 ? 'Truque (Nível 0)' : `Nível ${item.level}`;
  const components = Array.isArray(item.components)
    ? item.components.join(', ')
    : '—';
  const dmgInfo = extractSpellDamageInfo(item, 1);

  return (
    <>
      <View style={styles.badgeRow}>
        <View style={[styles.pill, { backgroundColor: COLORS.magicMuted, borderColor: COLORS.magic }]}>
          <Text style={[styles.pillText, { color: COLORS.magicLight }]}>{levelLabel}</Text>
        </View>
        {item.school?.name ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{item.school.name}</Text>
          </View>
        ) : null}
        {item.concentration ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Concentração</Text>
          </View>
        ) : null}
        {item.ritual ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>Ritual</Text>
          </View>
        ) : null}
      </View>

      {dmgInfo.damageDice ? (
        <CustomButton
          title={`Rolar ${dmgInfo.isHeal ? 'Cura' : 'Dano'} (${dmgInfo.damageDice}${
            !dmgInfo.isHeal && dmgInfo.damageType ? ` • ${dmgInfo.damageType}` : ''
          })`}
          icon={dmgInfo.isHeal ? 'heart' : 'flame'}
          variant={dmgInfo.isHeal ? 'primary' : 'danger'}
          onPress={() =>
            onQuickRoll({
              expression: dmgInfo.damageDice,
              title: `${dmgInfo.isHeal ? 'Cura' : 'Dano'} • ${item.name}`,
              subtitle: dmgInfo.isHeal
                ? 'Pontos de Vida Restaurados'
                : dmgInfo.damageType
                ? `Tipo de Dano: ${dmgInfo.damageType}`
                : 'Dano Mágico',
              kind: dmgInfo.isHeal ? 'heal' : 'damage',
            })
          }
        />
      ) : null}

      <SectionCard title="Propriedades da Magia" icon="sparkles-outline">
        <InfoRow label="Tempo de Conjuração" value={item.casting_time} />
        <InfoRow label="Alcance" value={item.range} />
        <InfoRow label="Duração" value={item.duration} />
        <InfoRow label="Componentes" value={components} />
        <InfoRow label="Material" value={item.material} />
        {dmgInfo.damageType ? (
          <InfoRow
            label={dmgInfo.isHeal ? 'Efeito' : 'Tipo de Dano'}
            value={
              dmgInfo.damageDice
                ? `${dmgInfo.damageDice} (${dmgInfo.damageType})`
                : dmgInfo.damageType
            }
          />
        ) : null}
      </SectionCard>

      {Array.isArray(item.desc) && item.desc.length > 0 ? (
        <SectionCard title="Descrição" icon="document-text-outline">
          {item.desc.map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </SectionCard>
      ) : null}

      {Array.isArray(item.higher_level) && item.higher_level.length > 0 ? (
        <SectionCard title="Em Níveis Superiores" icon="trending-up-outline">
          {item.higher_level.map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </SectionCard>
      ) : null}

      {Array.isArray(item.classes) && item.classes.length > 0 ? (
        <SectionCard title="Classes Conjuradoras" icon="people-outline">
          <TagList items={item.classes.map((c) => c.name)} />
        </SectionCard>
      ) : null}
    </>
  );
}

function renderEquipmentDetails(item, onQuickRoll) {
  const cost = item.cost ? `${item.cost.quantity} ${item.cost.unit}` : null;
  const weaponInfo = extractWeaponInfo(item);
  const damage = item.damage
    ? `${item.damage.damage_dice} (${item.damage.damage_type?.name || ''})`
    : null;
  const twoHanded = item.two_handed_damage
    ? `${item.two_handed_damage.damage_dice} (${item.two_handed_damage.damage_type?.name || ''})`
    : null;
  const armorClass = item.armor_class
    ? `${item.armor_class.base}${
        item.armor_class.dex_bonus
          ? item.armor_class.max_bonus
            ? ` + DES (máx. ${item.armor_class.max_bonus})`
            : ' + DES'
          : ''
      }`
    : null;

  return (
    <>
      {weaponInfo.damageDice ? (
        <CustomButton
          title={`Rolar Dano (${weaponInfo.damageDice}${
            weaponInfo.damageType ? ` • ${weaponInfo.damageType}` : ''
          })`}
          icon="flame"
          variant="danger"
          onPress={() =>
            onQuickRoll({
              expression: weaponInfo.damageDice,
              title: `Dano • ${item.name}`,
              subtitle: weaponInfo.damageType
                ? `Tipo de Dano: ${weaponInfo.damageType}`
                : 'Dano da Arma',
              kind: 'damage',
            })
          }
        />
      ) : null}

      <SectionCard title="Especificações" icon="hammer-outline">
        <InfoRow label="Categoria" value={item.equipment_category?.name} />
        <InfoRow label="Subcategoria" value={item.weapon_category || item.armor_category || item.gear_category?.name} />
        <InfoRow label="Custo" value={cost} />
        <InfoRow
          label="Peso"
          value={item.weight !== undefined ? `${item.weight} lb` : null}
        />
        <InfoRow label="Dano" value={damage} />
        <InfoRow label="Dano (Duas Mãos)" value={twoHanded} />
        <InfoRow label="Alcance" value={item.weapon_range} />
        <InfoRow label="Classe de Armadura" value={armorClass} />
        <InfoRow
          label="Força Mínima"
          value={item.str_minimum ? String(item.str_minimum) : null}
        />
        {item.stealth_disadvantage ? (
          <InfoRow label="Furtividade" value="Desvantagem" />
        ) : null}
      </SectionCard>

      {Array.isArray(item.properties) && item.properties.length > 0 ? (
        <SectionCard title="Propriedades" icon="pricetag-outline">
          <TagList items={item.properties.map((p) => p.name)} />
        </SectionCard>
      ) : null}

      {Array.isArray(item.desc) && item.desc.length > 0 ? (
        <SectionCard title="Descrição" icon="document-text-outline">
          {item.desc.map((paragraph, i) => (
            <Text key={i} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </SectionCard>
      ) : null}
    </>
  );
}

function renderRaceDetails(item) {
  const bonuses = Array.isArray(item.ability_bonuses)
    ? item.ability_bonuses.map(
        (b) => `${b.ability_score?.name || ''} +${b.bonus}`
      )
    : [];

  return (
    <>
      <SectionCard title="Características Raciais" icon="body-outline">
        <InfoRow label="Deslocamento" value={item.speed ? `${item.speed} ft` : null} />
        <InfoRow label="Tamanho" value={item.size} />
        <InfoRow label="Idade" value={item.age} />
        <InfoRow label="Tendência" value={item.alignment} />
        <InfoRow label="Descrição de Tamanho" value={item.size_description} />
      </SectionCard>

      {bonuses.length > 0 ? (
        <SectionCard title="Bônus de Atributos" icon="arrow-up-circle-outline">
          <TagList items={bonuses} />
        </SectionCard>
      ) : null}

      {Array.isArray(item.traits) && item.traits.length > 0 ? (
        <SectionCard title="Traços Raciais" icon="star-outline">
          <TagList items={item.traits.map((t) => t.name)} />
        </SectionCard>
      ) : null}

      {Array.isArray(item.languages) && item.languages.length > 0 ? (
        <SectionCard title="Idiomas" icon="chatbubble-ellipses-outline">
          <TagList items={item.languages.map((l) => l.name)} />
          {item.language_desc ? (
            <Text style={styles.paragraph}>{item.language_desc}</Text>
          ) : null}
        </SectionCard>
      ) : null}
    </>
  );
}

function renderClassDetails(item) {
  return (
    <>
      <SectionCard title="Resumo da Classe" icon="shield-outline">
        <InfoRow label="Dado de Vida" value={item.hit_die ? `d${item.hit_die}` : null} />
        <InfoRow
          label="Atributo de Conjuração"
          value={item.spellcasting?.spellcasting_ability?.name || 'Não conjurador inicial'}
        />
      </SectionCard>

      {Array.isArray(item.saving_throws) && item.saving_throws.length > 0 ? (
        <SectionCard title="Testes de Resistência (Salvaguardas)" icon="checkmark-shield-outline">
          <TagList items={item.saving_throws.map((s) => s.name)} />
        </SectionCard>
      ) : null}

      {Array.isArray(item.proficiencies) && item.proficiencies.length > 0 ? (
        <SectionCard title="Proficiências" icon="ribbon-outline">
          <TagList items={item.proficiencies.map((p) => p.name)} />
        </SectionCard>
      ) : null}

      {Array.isArray(item.proficiency_choices) && item.proficiency_choices.length > 0 ? (
        <SectionCard title="Escolhas de Perícias" icon="list-outline">
          {item.proficiency_choices.map((choice, idx) => (
            <Text key={idx} style={styles.paragraph}>
              • {choice.desc || `Escolha ${choice.choose} opção(ões)`}
            </Text>
          ))}
        </SectionCard>
      ) : null}

      {Array.isArray(item.subclasses) && item.subclasses.length > 0 ? (
        <SectionCard title="Subclasses" icon="git-branch-outline">
          <TagList items={item.subclasses.map((sc) => sc.name)} />
        </SectionCard>
      ) : null}
    </>
  );
}

export default function ApiItemDetailScreen() {
  const router = useRouter();
  const { category, index, name } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRoll, setActiveRoll] = useState(null);
  const [lastRollConfig, setLastRollConfig] = useState(null);

  async function executeQuickRoll(config) {
    const rolled = rollDiceExpression(config.expression, config.extraModifier || 0, 0);
    setLastRollConfig(config);
    setActiveRoll({
      ...rolled,
      title: config.title,
      subtitle: config.subtitle,
      kind: config.kind,
    });
    await addDiceRoll({
      ...rolled,
      label: config.title,
    });
  }

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompendiumDetail(String(category), String(index));
      setItem(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category, index]);

  useEffect(() => {
    if (category && index) {
      loadDetail();
    }
  }, [category, index, loadDetail]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={styles.categoryBadge}>
            {CATEGORY_LABELS[category] || 'Compêndio'}
          </Text>
          <Text style={styles.topTitle} numberOfLines={1}>
            {item?.name || name || 'Detalhes'}
          </Text>
        </View>
      </View>

      {loading ? (
        <LoadingView message="Buscando detalhes na API D&D 5e..." />
      ) : error ? (
        <LoadingView error={error} onRetry={loadDetail} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroCard}>
            <Text style={styles.heroName}>{item?.name}</Text>
            <Text style={styles.heroIndex}>
              {CATEGORY_LABELS[category] || 'Item'} • Índice: {item?.index}
            </Text>
          </View>

          {category === 'spells' && renderSpellDetails(item, executeQuickRoll)}
          {category === 'equipment' && renderEquipmentDetails(item, executeQuickRoll)}
          {category === 'races' && renderRaceDetails(item)}
          {category === 'classes' && renderClassDetails(item)}
        </ScrollView>
      )}

      <QuickRollModal
        visible={Boolean(activeRoll)}
        roll={activeRoll}
        onReroll={() => {
          if (lastRollConfig) executeQuickRoll(lastRollConfig);
        }}
        onClose={() => setActiveRoll(null)}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
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
  categoryBadge: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  },
  heroName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  heroIndex: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  pill: {
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  pillText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: SPACING.sm + 2,
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
  },
  infoRow: {
    gap: 2,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    lineHeight: 21,
  },
  paragraph: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  tag: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
  },
  tagText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});

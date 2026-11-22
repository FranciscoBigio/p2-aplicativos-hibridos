export const ATTRIBUTES = [
  { key: 'str', apiKey: 'STR', monsterKey: 'strength', label: 'Força', short: 'FOR' },
  { key: 'dex', apiKey: 'DEX', monsterKey: 'dexterity', label: 'Destreza', short: 'DES' },
  { key: 'con', apiKey: 'CON', monsterKey: 'constitution', label: 'Constituição', short: 'CON' },
  { key: 'int', apiKey: 'INT', monsterKey: 'intelligence', label: 'Inteligência', short: 'INT' },
  { key: 'wis', apiKey: 'WIS', monsterKey: 'wisdom', label: 'Sabedoria', short: 'SAB' },
  { key: 'cha', apiKey: 'CHA', monsterKey: 'charisma', label: 'Carisma', short: 'CAR' },
];

export const SKILLS = [
  { id: 'acrobatics', name: 'Acrobacia', ability: 'dex' },
  { id: 'animal-handling', name: 'Lidar com Animais', ability: 'wis' },
  { id: 'arcana', name: 'Arcanismo', ability: 'int' },
  { id: 'athletics', name: 'Atletismo', ability: 'str' },
  { id: 'deception', name: 'Enganação', ability: 'cha' },
  { id: 'history', name: 'História', ability: 'int' },
  { id: 'insight', name: 'Intuição', ability: 'wis' },
  { id: 'intimidation', name: 'Intimidação', ability: 'cha' },
  { id: 'investigation', name: 'Investigação', ability: 'int' },
  { id: 'medicine', name: 'Medicina', ability: 'wis' },
  { id: 'nature', name: 'Natureza', ability: 'int' },
  { id: 'perception', name: 'Percepção', ability: 'wis' },
  { id: 'performance', name: 'Atuação', ability: 'cha' },
  { id: 'persuasion', name: 'Persuasão', ability: 'cha' },
  { id: 'religion', name: 'Religião', ability: 'int' },
  { id: 'sleight-of-hand', name: 'Prestidigitação', ability: 'dex' },
  { id: 'stealth', name: 'Furtividade', ability: 'dex' },
  { id: 'survival', name: 'Sobrevivência', ability: 'wis' },
];

export const POINT_BUY_BUDGET = 27;

export const POINT_BUY_COSTS = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export function calculateModifier(score) {
  const numeric = Number(score);
  if (Number.isNaN(numeric)) return 0;
  return Math.floor((numeric - 10) / 2);
}

export function formatModifier(mod) {
  const numeric = Number(mod) || 0;
  return numeric >= 0 ? `+${numeric}` : `${numeric}`;
}

export function calculateProficiencyBonus(level = 1) {
  const numericLevel = Math.max(1, Number(level) || 1);
  return Math.ceil(numericLevel / 4) + 1;
}

export function calculateInitialHP(hitDie = 8, conScore = 10) {
  const die = Number(hitDie) || 8;
  const conMod = calculateModifier(conScore);
  return Math.max(1, die + conMod);
}

export function calculateBaseAC(dexScore = 10) {
  return 10 + calculateModifier(dexScore);
}

export function calculatePointBuySpent(attributes = {}) {
  return ATTRIBUTES.reduce((total, attr) => {
    const val = Number(attributes[attr.key] ?? 8);
    return total + (POINT_BUY_COSTS[val] ?? 0);
  }, 0);
}

export function extractRacialBonuses(raceDetail) {
  const bonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  if (!raceDetail || !Array.isArray(raceDetail.ability_bonuses)) {
    return bonuses;
  }

  raceDetail.ability_bonuses.forEach((item) => {
    const apiIdx = item?.ability_score?.index?.toLowerCase();
    if (apiIdx && Object.prototype.hasOwnProperty.call(bonuses, apiIdx)) {
      bonuses[apiIdx] += Number(item.bonus) || 0;
    }
  });

  return bonuses;
}

export function getDefaultSpellSlots(classIndex) {
  const idx = (classIndex || '').toLowerCase();
  if (['wizard', 'cleric', 'bard', 'druid', 'sorcerer'].includes(idx)) {
    return {
      1: { max: 2, used: 0 },
      2: { max: 0, used: 0 },
      3: { max: 0, used: 0 },
    };
  }
  if (idx === 'warlock') {
    return {
      1: { max: 1, used: 0 },
      2: { max: 0, used: 0 },
      3: { max: 0, used: 0 },
    };
  }
  return {
    1: { max: 0, used: 0 },
    2: { max: 0, used: 0 },
    3: { max: 0, used: 0 },
  };
}

export function formatChallengeRating(cr) {
  if (cr === 0.125) return '1/8';
  if (cr === 0.25) return '1/4';
  if (cr === 0.5) return '1/2';
  if (cr === undefined || cr === null) return '0';
  return String(cr);
}

export function getSpellcastingAbility(classIndex) {
  const idx = (classIndex || '').toLowerCase();
  if (['cleric', 'druid', 'ranger'].includes(idx)) return 'wis';
  if (['bard', 'sorcerer', 'warlock', 'paladin'].includes(idx)) return 'cha';
  return 'int';
}

function resolveScaledDice(levelMap, targetLevel) {
  if (!levelMap || typeof levelMap !== 'object') return null;
  const numericKeys = Object.keys(levelMap)
    .map((k) => Number(k))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  if (numericKeys.length === 0) return null;

  let chosen = numericKeys[0];
  for (const key of numericKeys) {
    if (key <= targetLevel) {
      chosen = key;
    }
  }
  return levelMap[String(chosen)] || null;
}

export function extractSpellDamageInfo(spellDetail, characterLevel = 1) {
  if (!spellDetail) {
    return {
      damageDice: null,
      damageType: null,
      attackType: null,
      isHeal: false,
      damageAtSlotLevel: null,
      damageAtCharLevel: null,
    };
  }

  const attackType = spellDetail.attack_type || null;

  const rawDamage = Array.isArray(spellDetail.damage)
    ? spellDetail.damage[0]
    : spellDetail.damage;

  if (rawDamage) {
    const damageType = rawDamage.damage_type?.name || null;
    const damageAtCharLevel = rawDamage.damage_at_character_level || null;
    const damageAtSlotLevel = rawDamage.damage_at_slot_level || null;

    let damageDice = null;
    if (damageAtCharLevel) {
      damageDice = resolveScaledDice(damageAtCharLevel, characterLevel);
    } else if (damageAtSlotLevel) {
      const baseLevel = Math.max(1, Number(spellDetail.level) || 1);
      damageDice = resolveScaledDice(damageAtSlotLevel, baseLevel);
    }

    if (damageDice) {
      return {
        damageDice,
        damageType,
        attackType,
        isHeal: false,
        damageAtSlotLevel,
        damageAtCharLevel,
      };
    }
  }

  if (spellDetail.heal_at_slot_level) {
    const baseLevel = Math.max(1, Number(spellDetail.level) || 1);
    const healDice = resolveScaledDice(spellDetail.heal_at_slot_level, baseLevel);
    if (healDice) {
      return {
        damageDice: healDice,
        damageType: 'Cura',
        attackType: null,
        isHeal: true,
        damageAtSlotLevel: spellDetail.heal_at_slot_level,
        damageAtCharLevel: null,
      };
    }
  }

  return {
    damageDice: null,
    damageType: null,
    attackType,
    isHeal: false,
    damageAtSlotLevel: null,
    damageAtCharLevel: null,
  };
}

export function extractWeaponInfo(equipmentDetail) {
  if (!equipmentDetail) {
    return {
      isWeapon: false,
      damageDice: null,
      twoHandedDamageDice: null,
      damageType: null,
      weaponRange: null,
      properties: [],
    };
  }

  const catIndex = equipmentDetail.equipment_category?.index?.toLowerCase();
  const isWeapon = catIndex === 'weapon' || Boolean(equipmentDetail.damage?.damage_dice);

  return {
    isWeapon,
    damageDice: equipmentDetail.damage?.damage_dice || null,
    twoHandedDamageDice: equipmentDetail.two_handed_damage?.damage_dice || null,
    damageType: equipmentDetail.damage?.damage_type?.name || null,
    weaponRange: equipmentDetail.weapon_range || null,
    properties: Array.isArray(equipmentDetail.properties)
      ? equipmentDetail.properties.map((p) => p.name)
      : [],
  };
}

export function getWeaponAbilityKey(weapon, attributes = {}) {
  const range = (weapon?.weaponRange || '').toLowerCase();
  if (range === 'ranged') return 'dex';

  const props = Array.isArray(weapon?.properties)
    ? weapon.properties.map((p) => String(p).toLowerCase())
    : [];
  const isFinesse = props.includes('finesse');
  const strMod = calculateModifier(attributes.str ?? 10);
  const dexMod = calculateModifier(attributes.dex ?? 10);

  if (isFinesse && dexMod > strMod) return 'dex';
  return 'str';
}

export function rollDiceExpression(expression, extraModifier = 0, spellMod = 0) {
  const cleaned = String(expression || '1d20')
    .replace(/\s+/g, '')
    .replace(/MOD/gi, String(spellMod));

  // Match XdY with optional signed numeric modifiers (e.g. "3d4+3", "1d8+-1", "2d6")
  const diceMatch = cleaned.match(/^(\d+)d(\d+)([+-]-?\d+)?$/i);

  if (diceMatch) {
    const quantity = Math.max(1, Number(diceMatch[1]) || 1);
    const sides = Math.max(2, Number(diceMatch[2]) || 6);
    const exprMod = diceMatch[3] ? Number(diceMatch[3].replace('+-', '-')) || 0 : 0;
    const totalModifier = exprMod + (Number(extraModifier) || 0);

    const rolls = [];
    for (let i = 0; i < quantity; i += 1) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }

    const subtotal = rolls.reduce((acc, v) => acc + v, 0);
    const total = Math.max(1, subtotal + totalModifier);
    const isCritSuccess = sides === 20 && quantity === 1 && rolls[0] === 20;
    const isCritFail = sides === 20 && quantity === 1 && rolls[0] === 1;
    const formula = `${quantity}d${sides}${
      totalModifier !== 0 ? ` ${formatModifier(totalModifier)}` : ''
    }`;

    return {
      formula,
      quantity,
      sides,
      modifier: totalModifier,
      rolls,
      subtotal,
      total,
      isCritSuccess,
      isCritFail,
    };
  }

  // Flat damage fallback (e.g. Blowgun = "1")
  const flatBase = Number(cleaned);
  const baseVal = Number.isNaN(flatBase) ? 1 : flatBase;
  const mod = Number(extraModifier) || 0;
  const total = Math.max(1, baseVal + mod);

  return {
    formula: `${baseVal}${mod !== 0 ? ` ${formatModifier(mod)}` : ''}`,
    quantity: 1,
    sides: baseVal,
    modifier: mod,
    rolls: [baseVal],
    subtotal: baseVal,
    total,
    isCritSuccess: false,
    isCritFail: false,
  };
}

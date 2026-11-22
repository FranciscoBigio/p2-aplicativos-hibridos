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

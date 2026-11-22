import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDefaultSpellSlots } from '../utils/dndRules';

export const STORAGE_KEYS = {
  USERS: '@dnd5e:users',
  SESSION: '@dnd5e:session',
  CHARACTERS: '@dnd5e:characters',
  FAVORITE_MONSTERS: '@dnd5e:favorite_monsters',
  DICE_HISTORY: '@dnd5e:dice_history',
};

const authListeners = new Set();

export function subscribeAuthChange(listener) {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

function notifyAuthChange(session) {
  authListeners.forEach((fn) => {
    try {
      fn(session);
    } catch (err) {
      console.warn('[storage] Erro no listener de auth:', err);
    }
  });
}

async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] Erro ao ler ${key}:`, error);
    return fallback;
  }
}

async function writeJSON(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ==========================================
// USUÁRIOS E SESSÃO
// ==========================================

export async function getUsers() {
  return readJSON(STORAGE_KEYS.USERS, []);
}

export async function registerUser({ name, email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanName || !cleanEmail || !password) {
    return { ok: false, error: 'Preencha todos os campos obrigatórios.' };
  }
  if (password.length < 4) {
    return { ok: false, error: 'A senha deve ter pelo menos 4 caracteres.' };
  }

  const users = await getUsers();
  const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    return { ok: false, error: 'Já existe uma conta cadastrada com este e-mail.' };
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  await writeJSON(STORAGE_KEYS.USERS, [...users, newUser]);
  await setSession(newUser);

  return { ok: true, user: newUser };
}

export async function loginUser({ email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  const users = await getUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );

  if (!found) {
    return { ok: false, error: 'E-mail ou senha inválidos.' };
  }

  await setSession(found);
  return { ok: true, user: found };
}

export async function resetUserPassword({ email, newPassword }) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !newPassword || newPassword.length < 4) {
    return {
      ok: false,
      error: 'Informe um e-mail válido e uma senha com pelo menos 4 caracteres.',
    };
  }

  const users = await getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (idx === -1) {
    return { ok: false, error: 'Nenhuma conta encontrada para este e-mail.' };
  }

  const updated = [...users];
  updated[idx] = { ...updated[idx], password: newPassword };
  await writeJSON(STORAGE_KEYS.USERS, updated);

  return { ok: true, user: updated[idx] };
}

export async function getSession() {
  return readJSON(STORAGE_KEYS.SESSION, null);
}

export async function setSession(user) {
  if (!user) {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    notifyAuthChange(null);
    return;
  }
  const safeSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
  await writeJSON(STORAGE_KEYS.SESSION, safeSession);
  notifyAuthChange(safeSession);
}

export async function logoutUser() {
  await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
  notifyAuthChange(null);
}

// ==========================================
// PERSONAGENS (CRUD)
// ==========================================

export async function getCharacters(userId = null) {
  const all = await readJSON(STORAGE_KEYS.CHARACTERS, []);
  if (!userId) return all;
  return all.filter((c) => c.userId === userId);
}

export async function getCharacterById(id) {
  const all = await readJSON(STORAGE_KEYS.CHARACTERS, []);
  return all.find((c) => c.id === id) || null;
}

export async function saveCharacter(characterData) {
  const session = await getSession();
  const all = await readJSON(STORAGE_KEYS.CHARACTERS, []);

  const newChar = {
    id: characterData.id || `char_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: characterData.userId || session?.id || 'demo_user',
    name: characterData.name || 'Aventureiro Sem Nome',
    background: characterData.background || 'Herói do Povo',
    level: characterData.level || 1,
    raceIndex: characterData.raceIndex || 'human',
    raceName: characterData.raceName || 'Human',
    classIndex: characterData.classIndex || 'fighter',
    className: characterData.className || 'Fighter',
    hitDie: characterData.hitDie || 10,
    speed: characterData.speed || 30,
    attributes: characterData.attributes || {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    racialBonuses: characterData.racialBonuses || {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0,
    },
    maxHp: characterData.maxHp || 10,
    currentHp: characterData.currentHp ?? characterData.maxHp ?? 10,
    armorClass: characterData.armorClass || 12,
    savingThrows: characterData.savingThrows || [],
    proficientSkills: characterData.proficientSkills || [],
    traits: characterData.traits || [],
    coins: characterData.coins || { gp: 15, sp: 10, cp: 0 },
    inventory: characterData.inventory || [],
    spells: characterData.spells || [],
    spellSlots: characterData.spellSlots || getDefaultSpellSlots(characterData.classIndex),
    createdAt: characterData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await writeJSON(STORAGE_KEYS.CHARACTERS, [newChar, ...all]);
  return newChar;
}

export async function updateCharacter(id, partialUpdate) {
  const all = await readJSON(STORAGE_KEYS.CHARACTERS, []);
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const updated = {
    ...all[idx],
    ...partialUpdate,
    updatedAt: new Date().toISOString(),
  };

  const next = [...all];
  next[idx] = updated;
  await writeJSON(STORAGE_KEYS.CHARACTERS, next);
  return updated;
}

export async function deleteCharacter(id) {
  const all = await readJSON(STORAGE_KEYS.CHARACTERS, []);
  const filtered = all.filter((c) => c.id !== id);
  await writeJSON(STORAGE_KEYS.CHARACTERS, filtered);
  return filtered;
}

// ==========================================
// MONSTROS FAVORITOS
// ==========================================

export async function getFavoriteMonsters() {
  return readJSON(STORAGE_KEYS.FAVORITE_MONSTERS, []);
}

export async function isMonsterFavorite(index) {
  const favs = await getFavoriteMonsters();
  return favs.some((m) => m.index === index);
}

export async function toggleFavoriteMonster(monster) {
  const favs = await getFavoriteMonsters();
  const exists = favs.some((m) => m.index === monster.index);

  let next;
  if (exists) {
    next = favs.filter((m) => m.index !== monster.index);
  } else {
    next = [
      {
        index: monster.index,
        name: monster.name,
        challenge_rating: monster.challenge_rating ?? null,
        type: monster.type || null,
        savedAt: new Date().toISOString(),
      },
      ...favs,
    ];
  }

  await writeJSON(STORAGE_KEYS.FAVORITE_MONSTERS, next);
  return { isFavorite: !exists, favorites: next };
}

// ==========================================
// HISTÓRICO DE ROLAGENS DE DADOS
// ==========================================

export async function getDiceHistory() {
  return readJSON(STORAGE_KEYS.DICE_HISTORY, []);
}

export async function addDiceRoll(rollEntry) {
  const history = await getDiceHistory();
  const entry = {
    id: `roll_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...rollEntry,
  };
  const next = [entry, ...history].slice(0, 50);
  await writeJSON(STORAGE_KEYS.DICE_HISTORY, next);
  return next;
}

export async function clearDiceHistory() {
  await writeJSON(STORAGE_KEYS.DICE_HISTORY, []);
  return [];
}

// ==========================================
// CONTA DEMO PRÉ-POPULADA
// ==========================================

export async function loginDemoAccount() {
  const demoEmail = 'demo@dnd5e.app';
  const users = await getUsers();
  let demoUser = users.find((u) => u.email === demoEmail);

  if (!demoUser) {
    demoUser = {
      id: 'usr_demo_dnd5e',
      name: 'Mestre Aventureiro',
      email: demoEmail,
      password: 'demo',
      createdAt: new Date().toISOString(),
    };
    await writeJSON(STORAGE_KEYS.USERS, [...users, demoUser]);
  }

  await setSession(demoUser);

  const existingChars = await getCharacters(demoUser.id);
  if (existingChars.length === 0) {
    await seedDemoData(demoUser.id);
  }

  return { ok: true, user: demoUser };
}

export async function seedDemoData(userId) {
  const allChars = await readJSON(STORAGE_KEYS.CHARACTERS, []);
  const otherUsersChars = allChars.filter((c) => c.userId !== userId);

  const demoChars = [
    {
      id: `char_demo_1_${Date.now()}`,
      userId,
      name: 'Thalion Estrela-Prateada',
      background: 'Sábio',
      level: 3,
      raceIndex: 'elf',
      raceName: 'Elf',
      classIndex: 'wizard',
      className: 'Wizard',
      hitDie: 6,
      speed: 30,
      attributes: { str: 8, dex: 16, con: 14, int: 17, wis: 12, cha: 10 },
      racialBonuses: { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 0 },
      maxHp: 20,
      currentHp: 18,
      armorClass: 13,
      savingThrows: ['int', 'wis'],
      proficientSkills: ['arcana', 'history', 'investigation', 'perception'],
      traits: ['Darkvision', 'Keen Senses', 'Fey Ancestry', 'Trance'],
      coins: { gp: 45, sp: 12, cp: 8 },
      inventory: [
        {
          id: 'item_demo_1',
          index: 'quarterstaff',
          name: 'Quarterstaff',
          category: 'Weapon',
          weight: 4,
          quantity: 1,
          equipped: true,
          isWeapon: true,
          damageDice: '1d6',
          twoHandedDamageDice: '1d8',
          damageType: 'Bludgeoning',
          weaponRange: 'Melee',
          properties: ['Versatile'],
        },
        {
          id: 'item_demo_2',
          index: 'spellbook',
          name: 'Spellbook',
          category: 'Adventuring Gear',
          weight: 3,
          quantity: 1,
          equipped: true,
        },
      ],
      spells: [
        {
          index: 'fire-bolt',
          name: 'Fire Bolt',
          level: 0,
          school: 'Evocation',
          casting_time: '1 action',
          damageDice: '1d10',
          damageType: 'Fire',
          attackType: 'ranged',
          isHeal: false,
          damageChecked: true,
        },
        {
          index: 'magic-missile',
          name: 'Magic Missile',
          level: 1,
          school: 'Evocation',
          casting_time: '1 action',
          damageDice: '3d4 + 3',
          damageType: 'Force',
          attackType: null,
          isHeal: false,
          damageChecked: true,
        },
        {
          index: 'shield',
          name: 'Shield',
          level: 1,
          school: 'Abjuration',
          casting_time: '1 reaction',
          damageDice: null,
          damageType: null,
          attackType: null,
          isHeal: false,
          damageChecked: true,
        },
      ],
      spellSlots: {
        1: { max: 4, used: 1 },
        2: { max: 2, used: 0 },
        3: { max: 0, used: 0 },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `char_demo_2_${Date.now() + 1}`,
      userId,
      name: 'Kaelen Punho-de-Ferro',
      background: 'Soldado',
      level: 3,
      raceIndex: 'dwarf',
      raceName: 'Dwarf',
      classIndex: 'fighter',
      className: 'Fighter',
      hitDie: 10,
      speed: 25,
      attributes: { str: 16, dex: 12, con: 16, int: 10, wis: 12, cha: 8 },
      racialBonuses: { str: 0, dex: 0, con: 2, int: 0, wis: 0, cha: 0 },
      maxHp: 31,
      currentHp: 31,
      armorClass: 16,
      savingThrows: ['str', 'con'],
      proficientSkills: ['athletics', 'intimidation', 'perception', 'survival'],
      traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning'],
      coins: { gp: 28, sp: 5, cp: 15 },
      inventory: [
        {
          id: 'item_demo_3',
          index: 'battleaxe',
          name: 'Battleaxe',
          category: 'Weapon',
          weight: 4,
          quantity: 1,
          equipped: true,
          isWeapon: true,
          damageDice: '1d8',
          twoHandedDamageDice: '1d10',
          damageType: 'Slashing',
          weaponRange: 'Melee',
          properties: ['Versatile'],
        },
        {
          id: 'item_demo_4',
          index: 'chain-mail',
          name: 'Chain Mail',
          category: 'Armor',
          weight: 55,
          quantity: 1,
          equipped: true,
        },
      ],
      spells: [],
      spellSlots: {
        1: { max: 0, used: 0 },
        2: { max: 0, used: 0 },
        3: { max: 0, used: 0 },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await writeJSON(STORAGE_KEYS.CHARACTERS, [...demoChars, ...otherUsersChars]);

  const demoMonsters = [
    {
      index: 'adult-red-dragon',
      name: 'Adult Red Dragon',
      challenge_rating: 17,
      type: 'dragon',
      savedAt: new Date().toISOString(),
    },
    {
      index: 'goblin',
      name: 'Goblin',
      challenge_rating: 0.25,
      type: 'humanoid',
      savedAt: new Date().toISOString(),
    },
  ];
  await writeJSON(STORAGE_KEYS.FAVORITE_MONSTERS, demoMonsters);

  return demoChars;
}

export { readJSON, writeJSON };

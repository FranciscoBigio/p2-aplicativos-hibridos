import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  USERS: '@dnd5e:users',
  SESSION: '@dnd5e:session',
  CHARACTERS: '@dnd5e:characters',
  FAVORITE_MONSTERS: '@dnd5e:favorite_monsters',
  DICE_HISTORY: '@dnd5e:dice_history',
};

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

export async function getUsers() {
  return readJSON(STORAGE_KEYS.USERS, []);
}

export async function registerUser({ name, email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanName || !cleanEmail || !password) {
    return { ok: false, error: 'Preencha todos os campos obrigatórios.' };
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
    return { ok: false, error: 'Informe um e-mail válido e uma senha com pelo menos 4 caracteres.' };
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
    return;
  }
  const safeSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
  await writeJSON(STORAGE_KEYS.SESSION, safeSession);
}

export async function logoutUser() {
  await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
}

export { readJSON, writeJSON };

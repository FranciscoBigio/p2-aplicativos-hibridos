const BASE_URL = 'https://www.dnd5eapi.co/api';
const memoryCache = new Map();

export function clearApiCache() {
  memoryCache.clear();
}

async function apiFetch(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  if (memoryCache.has(url)) {
    return memoryCache.get(url);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (response.status === 404) {
      throw new Error('Registro não encontrado na API D&D 5e.');
    }

    if (!response.ok) {
      throw new Error(
        `A API D&D 5e retornou erro HTTP ${response.status}. Tente novamente em instantes.`
      );
    }

    const data = await response.json();
    memoryCache.set(url, data);
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(
        'Tempo limite excedido ao conectar na API D&D 5e. Verifique sua conexão com a internet.'
      );
    }
    if (
      error instanceof TypeError ||
      /network request failed|failed to fetch/i.test(error?.message || '')
    ) {
      throw new Error(
        'Sem conexão com a internet ou falha de rede ao acessar a API D&D 5e.'
      );
    }
    throw new Error(
      error?.message || 'Não foi possível carregar os dados da API D&D 5e.'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchRaces() {
  const data = await apiFetch('/races');
  return data.results || [];
}

export async function fetchRaceDetail(index) {
  return apiFetch(`/races/${index}`);
}

export async function fetchClasses() {
  const data = await apiFetch('/classes');
  return data.results || [];
}

export async function fetchClassDetail(index) {
  return apiFetch(`/classes/${index}`);
}

export async function fetchSpells() {
  const data = await apiFetch('/spells');
  return data.results || [];
}

export async function fetchSpellsByClass(classIndex) {
  if (!classIndex || classIndex === 'all') {
    return fetchSpells();
  }
  const data = await apiFetch(`/classes/${classIndex}/spells`);
  return data.results || [];
}

export async function fetchSpellDetail(index) {
  return apiFetch(`/spells/${index}`);
}

export async function fetchEquipment() {
  const data = await apiFetch('/equipment');
  return data.results || [];
}

export async function fetchEquipmentDetail(index) {
  return apiFetch(`/equipment/${index}`);
}

const CR_FILTER_MAP = {
  low: '0,0.125,0.25,0.5,1,2,3,4',
  mid: '5,6,7,8,9,10',
  high: '11,12,13,14,15,16,17,18,19,20,21,22,23,24,30',
};

export async function fetchMonsters(crBand = 'all') {
  const query = CR_FILTER_MAP[crBand]
    ? `/monsters?challenge_rating=${CR_FILTER_MAP[crBand]}`
    : '/monsters';
  const data = await apiFetch(query);
  return data.results || [];
}

export async function fetchMonsterDetail(index) {
  return apiFetch(`/monsters/${index}`);
}

export async function fetchCompendiumList(category) {
  switch (category) {
    case 'spells':
      return fetchSpells();
    case 'equipment':
      return fetchEquipment();
    case 'races':
      return fetchRaces();
    case 'classes':
      return fetchClasses();
    default:
      return [];
  }
}

export async function fetchCompendiumDetail(category, index) {
  switch (category) {
    case 'spells':
      return fetchSpellDetail(index);
    case 'equipment':
      return fetchEquipmentDetail(index);
    case 'races':
      return fetchRaceDetail(index);
    case 'classes':
      return fetchClassDetail(index);
    default:
      throw new Error('Categoria do compêndio inválida.');
  }
}

export { apiFetch, BASE_URL };

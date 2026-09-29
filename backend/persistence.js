import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'aquarium-state.json');

export async function loadAquariums(defaultAquariums) {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8');
    const saved = JSON.parse(raw);
    if (saved.acuarios && typeof saved.acuarios === 'object') {
      return {
        modoActivo: saved.modoActivo === 'marino' ? 'marino' : 'dulce',
        acuarios: {
          dulce: mergeState(defaultAquariums.dulce, saved.acuarios.dulce),
          marino: mergeState(defaultAquariums.marino, saved.acuarios.marino)
        }
      };
    }
    return {
      modoActivo: 'dulce',
      acuarios: { dulce: mergeState(defaultAquariums.dulce, saved), marino: defaultAquariums.marino }
    };
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('No se pudieron cargar los acuarios guardados:', error.message);
    return { modoActivo: 'dulce', acuarios: defaultAquariums };
  }
}

function mergeState(defaultState, savedState = {}) {
  const state = { ...defaultState, ...savedState };
  for (const key of ['peces', 'invertebrados', 'plantas', 'algas', 'corales', 'maderas', 'comida', 'huevos', 'mensajes']) {
    state[key] = Array.isArray(savedState[key]) ? savedState[key] : defaultState[key];
  }
  state.calidadAgua = { ...defaultState.calidadAgua, ...(savedState.calidadAgua || {}) };
  state.equipos = { ...defaultState.equipos, ...(savedState.equipos || {}) };
  state.reproduccion = { ...defaultState.reproduccion, ...(savedState.reproduccion || {}) };
  return state;
}

export async function saveAquariums(data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify({
    ...data,
    ultimaPersistencia: new Date().toISOString()
  }, null, 2), 'utf8');
}

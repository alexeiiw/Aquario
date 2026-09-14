import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'aquarium-state.json');

export async function loadState(defaultState) {
  try {
    const raw = await fs.readFile(STATE_FILE, 'utf8');
    const state = JSON.parse(raw);
    return {
      ...defaultState,
      ...state,
      peces: Array.isArray(state.peces) ? state.peces : [],
      invertebrados: Array.isArray(state.invertebrados) ? state.invertebrados : [],
      plantas: Array.isArray(state.plantas) ? state.plantas : [],
      algas: Array.isArray(state.algas) ? state.algas : [],
      comida: Array.isArray(state.comida) ? state.comida : [],
      mensajes: Array.isArray(state.mensajes) ? state.mensajes : defaultState.mensajes
    };
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('No se pudo cargar el estado guardado:', error.message);
    }
    return defaultState;
  }
}

export async function saveState(state) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const serializable = {
    ...state,
    ultimaPersistencia: new Date().toISOString()
  };
  await fs.writeFile(STATE_FILE, JSON.stringify(serializable, null, 2), 'utf8');
}

import { EventEmitter } from 'node:events';
import { loadAquariums, saveAquariums } from './persistence.js';

const TICK_MS = Number(process.env.TICK_MS ?? 1000);
const REAL_SECONDS_PER_GAME_HOUR = Number(process.env.REAL_SECONDS_PER_GAME_HOUR ?? 60);
const SAVE_EVERY_MS = Number(process.env.SAVE_EVERY_MS ?? 5000);
const HUNGER_RATE_MULTIPLIER = Number(process.env.HUNGER_RATE_MULTIPLIER ?? 0.35);
const STARVATION_GRACE_HOURS = Number(process.env.STARVATION_GRACE_HOURS ?? 10);
const SCHOOLING_SPECIES = ['neon', 'cebra', 'rasbora', 'tetra'];
const SEXED_REPRODUCTION = ['guppy', 'cherry'];
const DAY_LENGTH_HOURS = 24;
const FRESHWATER_FISH = ['neon', 'guppy', 'betta', 'molly', 'angel', 'cebra', 'corydora', 'platy', 'xipho', 'otocinclus', 'rasbora', 'tetra', 'ramirezi', 'gourami', 'ancistrus'];
const MARINE_FISH = ['payaso', 'gramma', 'damisela', 'firefish'];
const MARINE_STUDY_FISH = ['cirujano_azul'];
const FRESHWATER_INVERTEBRATES = ['neritina', 'manzana', 'planorbis', 'cherry', 'amano', 'fantasma'];
const MARINE_INVERTEBRATES = ['camaron_limpiador', 'cangrejo_ermitano', 'caracol_turbo'];

const FISH_DEFS = {
  neon: {
    nombre: 'Pez Neon',
    latin: 'Paracheirodon innesi',
    hungerPerHour: 5,
    maxScale: 1,
    growthHours: 28,
    speed: 34,
    color: '#22d3ee',
    accent: '#ef4444'
  },
  guppy: {
    nombre: 'Pez Guppy',
    latin: 'Poecilia reticulata',
    hungerPerHour: 7,
    maxScale: 1.25,
    growthHours: 42,
    speed: 28,
    color: '#f59e0b',
    accent: '#60a5fa'
  },
  betta: {
    nombre: 'Pez Betta',
    latin: 'Betta splendens',
    hungerPerHour: 6,
    maxScale: 1.35,
    growthHours: 48,
    speed: 24,
    color: '#7c3aed',
    accent: '#fb7185'
  },
  molly: {
    nombre: 'Pez Molly',
    latin: 'Poecilia sphenops',
    hungerPerHour: 7,
    maxScale: 1.35,
    growthHours: 46,
    speed: 27,
    color: '#f8fafc',
    accent: '#0f172a'
  },
  angel: {
    nombre: 'Pez Angel',
    latin: 'Pterophyllum scalare',
    hungerPerHour: 8,
    maxScale: 1.75,
    growthHours: 78,
    speed: 22,
    color: '#e5e7eb',
    accent: '#facc15'
  },
  cebra: {
    nombre: 'Danio Cebra',
    latin: 'Danio rerio',
    hungerPerHour: 5,
    maxScale: 1.05,
    growthHours: 34,
    speed: 42,
    color: '#cbd5e1',
    accent: '#1e293b'
  },
  corydora: {
    nombre: 'Corydora',
    latin: 'Corydoras paleatus',
    hungerPerHour: 5,
    maxScale: 1.15,
    growthHours: 52,
    speed: 21,
    color: '#a3a3a3',
    accent: '#fde68a'
  },
  platy: {
    nombre: 'Pez Platy',
    latin: 'Xiphophorus maculatus',
    hungerPerHour: 6,
    maxScale: 1.18,
    growthHours: 40,
    speed: 28,
    color: '#fb923c',
    accent: '#fde047'
  },
  xipho: {
    nombre: 'Cola de Espada',
    latin: 'Xiphophorus hellerii',
    hungerPerHour: 6,
    maxScale: 1.3,
    growthHours: 48,
    speed: 30,
    color: '#dc2626',
    accent: '#f97316'
  },
  otocinclus: {
    nombre: 'Otocinclus',
    latin: 'Otocinclus affinis',
    hungerPerHour: 4,
    maxScale: 0.95,
    growthHours: 44,
    speed: 20,
    color: '#78716c',
    accent: '#fef3c7'
  },
  rasbora: {
    nombre: 'Rasbora Arlequin',
    latin: 'Trigonostigma heteromorpha',
    hungerPerHour: 5,
    maxScale: 1.05,
    growthHours: 38,
    speed: 36,
    color: '#f59e0b',
    accent: '#7f1d1d'
  },
  tetra: {
    nombre: 'Tetra Cardenal',
    latin: 'Paracheirodon axelrodi',
    hungerPerHour: 5,
    maxScale: 1,
    growthHours: 34,
    speed: 35,
    color: '#ef4444',
    accent: '#22d3ee'
  },
  ramirezi: {
    nombre: 'Ramirezi',
    latin: 'Mikrogeophagus ramirezi',
    hungerPerHour: 7,
    maxScale: 1.2,
    growthHours: 52,
    speed: 25,
    color: '#60a5fa',
    accent: '#facc15'
  },
  gourami: {
    nombre: 'Gourami Enano',
    latin: 'Trichogaster lalius',
    hungerPerHour: 6,
    maxScale: 1.3,
    growthHours: 58,
    speed: 22,
    color: '#38bdf8',
    accent: '#f43f5e'
  },
  ancistrus: {
    nombre: 'Ancistrus',
    latin: 'Ancistrus cirrhosus',
    hungerPerHour: 4,
    maxScale: 1.25,
    growthHours: 64,
    speed: 15,
    color: '#57534e',
    accent: '#d6d3d1'
  },
  payaso: {
    nombre: 'Pez Payaso', latin: 'Amphiprion ocellaris', hungerPerHour: 6, maxScale: 1.2,
    growthHours: 52, speed: 24, color: '#f97316', accent: '#f8fafc'
  },
  gramma: {
    nombre: 'Gramma Real', latin: 'Gramma loreto', hungerPerHour: 5, maxScale: 1.1,
    growthHours: 56, speed: 25, color: '#a855f7', accent: '#facc15'
  },
  cirujano_azul: {
    nombre: 'Cirujano Azul', latin: 'Paracanthurus hepatus', hungerPerHour: 8, maxScale: 1.8,
    growthHours: 90, speed: 32, color: '#2563eb', accent: '#facc15'
  },
  damisela: {
    nombre: 'Damisela Azul', latin: 'Chrysiptera cyanea', hungerPerHour: 6, maxScale: 1.1,
    growthHours: 48, speed: 30, color: '#06b6d4', accent: '#1d4ed8'
  },
  firefish: {
    nombre: 'Pez Dardo de Fuego', latin: 'Nemateleotris magnifica', hungerPerHour: 5, maxScale: 1,
    growthHours: 50, speed: 26, color: '#f43f5e', accent: '#fef08a'
  }
};

const INVERTEBRATE_DEFS = {
  neritina: {
    grupo: 'caracol',
    nombre: 'Caracol Neritina',
    latin: 'Neritina natalensis',
    hungerPerHour: 2,
    maxScale: 1,
    growthHours: 60,
    speed: 8,
    color: '#a16207',
    accent: '#fef3c7'
  },
  manzana: {
    grupo: 'caracol',
    nombre: 'Caracol Manzana',
    latin: 'Pomacea bridgesii',
    hungerPerHour: 3,
    maxScale: 1.3,
    growthHours: 72,
    speed: 6,
    color: '#d97706',
    accent: '#fde68a'
  },
  planorbis: {
    grupo: 'caracol',
    nombre: 'Caracol Planorbis',
    latin: 'Planorbidae',
    hungerPerHour: 2.5,
    maxScale: 0.9,
    growthHours: 48,
    speed: 7,
    color: '#92400e',
    accent: '#fed7aa'
  },
  cherry: {
    grupo: 'gamba',
    nombre: 'Gamba Cherry',
    latin: 'Neocaridina davidi',
    hungerPerHour: 3.5,
    maxScale: 1,
    growthHours: 44,
    speed: 18,
    color: '#ef4444',
    accent: '#fecaca'
  },
  amano: {
    grupo: 'gamba',
    nombre: 'Gamba Amano',
    latin: 'Caridina multidentata',
    hungerPerHour: 3,
    maxScale: 1.15,
    growthHours: 58,
    speed: 16,
    color: '#94a3b8',
    accent: '#e2e8f0'
  },
  fantasma: {
    grupo: 'gamba',
    nombre: 'Gamba Fantasma',
    latin: 'Palaemonetes paludosus',
    hungerPerHour: 3,
    maxScale: 1.05,
    growthHours: 52,
    speed: 17,
    color: '#bae6fd',
    accent: '#f8fafc'
  },
  camaron_limpiador: {
    grupo: 'gamba', nombre: 'Gamba Limpiadora', latin: 'Lysmata amboinensis', hungerPerHour: 3,
    maxScale: 1.1, growthHours: 60, speed: 14, color: '#fb923c', accent: '#f8fafc'
  },
  cangrejo_ermitano: {
    grupo: 'cangrejo', nombre: 'Cangrejo Ermitaño', latin: 'Paguroidea', hungerPerHour: 3,
    maxScale: 1.15, growthHours: 70, speed: 8, color: '#dc2626', accent: '#fbbf24'
  },
  caracol_turbo: {
    grupo: 'caracol', nombre: 'Caracol Turbo', latin: 'Turbo fluctuosus', hungerPerHour: 2,
    maxScale: 1.2, growthHours: 68, speed: 6, color: '#0f766e', accent: '#99f6e4'
  }
};

const PLANT_DEFS = {
  anubia: {
    nombre: 'Anubia',
    growthPerHour: 0.45,
    maxHeight: 82,
    nutrientUse: 0.08,
    color: '#15803d'
  },
  ambulia: {
    nombre: 'Ambulia',
    growthPerHour: 0.75,
    maxHeight: 118,
    nutrientUse: 0.13,
    color: '#22c55e'
  },
  vallisneria: {
    nombre: 'Vallisneria',
    growthPerHour: 0.9,
    maxHeight: 190,
    initialHeight: 48,
    nutrientUse: 0.17,
    color: '#4ade80'
  }
};

const ALGAE_DEFS = {
  verde: {
    nombre: 'Alga Verde',
    growthPerHour: 0.35,
    maxSize: 54,
    nitrateUse: 0.16,
    color: '#65a30d'
  },
  filamentosa: {
    nombre: 'Alga Filamentosa',
    growthPerHour: 0.5,
    maxSize: 72,
    nitrateUse: 0.22,
    color: '#84cc16'
  }
};

const WOOD_DEFS = {
  mopani: {
    nombre: 'Madera Mopani',
    color: '#7c3f1d',
    accent: '#3f1f0f',
    tannins: 0.08
  },
  manzanita: {
    nombre: 'Rama Manzanita',
    color: '#9a5a2f',
    accent: '#5c2e16',
    tannins: 0.04
  },
  spider: {
    nombre: 'Spider Wood',
    color: '#b06a35',
    accent: '#6b3518',
    tannins: 0.03
  },
  cholla: {
    nombre: 'Cholla Wood',
    color: '#c08a4b',
    accent: '#6f4a22',
    tannins: 0.02
  },
  manglar: {
    nombre: 'Raiz de Manglar',
    color: '#6b3518',
    accent: '#2f160a',
    tannins: 0.06
  }
};

const CORAL_DEFS = {
  zoanthid: { nombre: 'Zoántido', color: '#f472b6', crecimiento: 0.24, luz: 'media' },
  hongo: { nombre: 'Coral Hongo', color: '#c084fc', crecimiento: 0.2, luz: 'baja' },
  euphyllia: { nombre: 'Euphyllia', color: '#34d399', crecimiento: 0.16, luz: 'media' },
  acropora: { nombre: 'Acropora', color: '#38bdf8', crecimiento: 0.12, luz: 'alta' }
};

const TIME_SPEEDS = {
  pausado: 0,
  lento: 0.5,
  normal: 1,
  rapido: 4,
  muy_rapido: 10
};

function createDefaultState() {
  return {
    version: 6,
    modo: 'dulce',
    ancho: 960,
    alto: 620,
    horasJuego: 0,
    nutrientes: 12,
    peces: [],
    invertebrados: [],
    plantas: [],
    algas: [],
    corales: [],
    maderas: [],
    comida: [],
    velocidadTiempo: 'normal',
    calidadAgua: {
      amonio: 0,
      nitritos: 0,
      nitratos: 8,
      oxigeno: 92,
      salud: 92,
      ph: 7.2,
      temperatura: 25,
      salinidad: 0,
      alcalinidad: 0,
      calcio: 0
    },
    equipos: {
      filtroActivo: true,
      oxigenacionActiva: true,
      filtroNivel: 100,
      filtroCarga: 0
    },
    reproduccion: {},
    huevos: [],
    luzActiva: true,
    mensajes: [
      {
        autor: 'sistema',
        texto: 'Acuario de agua dulce listo. Pide peces, caracoles, gambas, plantas, maderas, comida o limpieza desde el chat.',
        fecha: new Date().toISOString()
      }
    ],
    ultimaActualizacion: new Date().toISOString()
  };
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function freshwaterLesson(concept) {
  const lessons = {
    amonio: 'Aprendizaje de agua dulce: el amonio proviene de desechos y comida sobrante. Puede ser tóxico; reduce la comida y revisa el filtro si aumenta.',
    nitrito: 'Aprendizaje de agua dulce: el nitrito aparece cuando el filtro procesa amonio y también es tóxico. Evita agregar animales y revisa el filtro biológico.',
    nitrato: 'Aprendizaje de agua dulce: el nitrato es el producto final del ciclo biológico. Si se acumula, ayudan los cambios parciales y las plantas saludables.',
    nutrientes: 'Aprendizaje de agua dulce: nutrientes resume materia orgánica disponible; no mide si cada pez está satisfecho. Revisa el hambre individual y evita restos de comida.'
  };
  return lessons[concept] || lessons.amonio;
}

function createFish(tipo, sexo = chooseSex(tipo)) {
  const def = FISH_DEFS[tipo];
  return {
    id: id('pez'),
    tipo,
    nombre: def.nombre,
    latin: def.latin,
    sexo,
    salud: 100,
    estres: 0,
    esCria: false,
    edadEnHoras: 0,
    escala: 0.45,
    hambre: 8,
    horasEnHambruna: 0,
    vivo: true,
    x: randomBetween(110, 760),
    y: randomBetween(130, 430),
    vx: randomBetween(-1, 1),
    vy: randomBetween(-0.6, 0.6),
    direccion: Math.random() > 0.5 ? 1 : -1,
    color: def.color,
    accent: def.accent
  };
}

function createPlant(especie) {
  const def = PLANT_DEFS[especie];
  return {
    id: id('planta'),
    especie,
    nombre: def.nombre,
    edadEnHoras: 0,
    altura: randomBetween(def.initialHeight || 18, (def.initialHeight || 18) + 10),
    x: randomBetween(80, 880),
    y: 560,
    color: def.color
  };
}

function createInvertebrate(especie, sexo = chooseSex(especie)) {
  const def = INVERTEBRATE_DEFS[especie];
  return {
    id: id(def.grupo),
    especie,
    grupo: def.grupo,
    nombre: def.nombre,
    latin: def.latin,
    sexo,
    salud: 100,
    estres: 0,
    esCria: false,
    edadEnHoras: 0,
    escala: 0.45,
    hambre: 6,
    horasEnHambruna: 0,
    vivo: true,
    x: randomBetween(80, 880),
    y: randomBetween(510, 552),
    vx: randomBetween(-1, 1),
    vy: 0,
    direccion: Math.random() > 0.5 ? 1 : -1,
    color: def.color,
    accent: def.accent
  };
}

function createAlgae(especie) {
  const def = ALGAE_DEFS[especie];
  return {
    id: id('alga'),
    especie,
    nombre: def.nombre,
    edadEnHoras: 0,
    tamano: randomBetween(16, 26),
    x: randomBetween(70, 890),
    y: randomBetween(500, 555),
    color: def.color
  };
}

function createMarineState() {
  const state = createDefaultState();
  state.modo = 'marino';
  state.cicloBiologico = { horas: 0, horasNecesarias: 72, listo: false };
  state.nutrientes = 10;
  state.calidadAgua = {
    amonio: 0, nitritos: 0, nitratos: 5, oxigeno: 92, salud: 92, ph: 8.1,
    temperatura: 25, salinidad: 35, alcalinidad: 8.5, calcio: 420
  };
  state.equipos = {
    filtroActivo: true, oxigenacionActiva: true, filtroNivel: 100, filtroCarga: 0,
    skimmerActivo: true, circulacionActiva: true
  };
  state.mensajes = [{
    autor: 'sistema',
    texto: 'Arrecife marino listo. Aprende paso a paso: controla salinidad, temperatura, alcalinidad y calcio antes de introducir habitantes.',
    fecha: new Date().toISOString()
  }];
  return state;
}

function createWood(especie) {
  const def = WOOD_DEFS[especie];
  return {
    id: id('madera'),
    especie,
    nombre: def.nombre,
    x: randomBetween(130, 820),
    y: randomBetween(525, 565),
    rotacion: randomBetween(-0.35, 0.35),
    escala: randomBetween(0.85, 1.25),
    color: def.color,
    accent: def.accent,
    tannins: def.tannins
  };
}

function createCoral(especie) {
  const def = CORAL_DEFS[especie];
  return {
    id: id('coral'), especie, nombre: def.nombre, color: def.color, luz: def.luz, vivo: true, salud: 100, estres: 0,
    x: randomBetween(150, 820), y: randomBetween(510, 550), tamano: randomBetween(16, 24), edadEnHoras: 0
  };
}

function chooseSex(species, index = null) {
  if (species === 'planorbis') return 'hermafrodita';
  if (!SEXED_REPRODUCTION.includes(species) && !FISH_DEFS[species]) return null;
  if (index !== null) return index % 2 === 0 ? 'hembra' : 'macho';
  return Math.random() > 0.5 ? 'hembra' : 'macho';
}

function createFood(amount = 8) {
  return Array.from({ length: clamp(amount, 1, 40) }, () => ({
    id: id('comida'),
    x: randomBetween(60, 900),
    y: randomBetween(26, 70),
    vy: randomBetween(10, 20),
    nutrientes: 0.25
  }));
}

export class GameEngine extends EventEmitter {
  constructor() {
    super();
    this.state = createDefaultState();
    this.aquariums = { dulce: this.state, marino: createMarineState() };
    this.activeMode = 'dulce';
    this.interval = null;
    this.saveInterval = null;
  }

  async init() {
    const saved = await loadAquariums({ dulce: createDefaultState(), marino: createMarineState() });
    this.activeMode = saved.modoActivo;
    this.aquariums = saved.acuarios;
    this.state = this.aquariums[this.activeMode];
    this.normalizeState();
    this.aquariums[this.activeMode] = this.state;
    await this.persist();
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => this.tick(), TICK_MS);
    this.saveInterval = setInterval(() => this.persist().catch(console.error), SAVE_EVERY_MS);
  }

  stop() {
    clearInterval(this.interval);
    clearInterval(this.saveInterval);
    this.interval = null;
    this.saveInterval = null;
  }

  getPublicState() {
    const marine = this.activeMode === 'marino';
    return {
      ...this.state,
      modo: this.activeMode,
      alertas: this.getWaterAlerts(),
      especies: {
        peces: (marine ? MARINE_FISH : FRESHWATER_FISH).filter((key) => FISH_DEFS[key]),
        estudio: marine ? MARINE_STUDY_FISH : [],
        caracoles: Object.entries(INVERTEBRATE_DEFS).filter(([key, def]) => (marine ? MARINE_INVERTEBRATES : FRESHWATER_INVERTEBRATES).includes(key) && def.grupo === 'caracol').map(([key]) => key),
        gambas: Object.entries(INVERTEBRATE_DEFS).filter(([key, def]) => (marine ? MARINE_INVERTEBRATES : FRESHWATER_INVERTEBRATES).includes(key) && def.grupo === 'gamba').map(([key]) => key),
        cangrejos: marine ? ['cangrejo_ermitano'] : [],
        plantas: marine ? [] : Object.keys(PLANT_DEFS),
        algas: marine ? [] : Object.keys(ALGAE_DEFS),
        corales: marine ? Object.keys(CORAL_DEFS) : [],
        maderas: marine ? [] : Object.keys(WOOD_DEFS)
      },
      config: {
        realSecondsPerGameHour: REAL_SECONDS_PER_GAME_HOUR,
        tickMs: TICK_MS,
        fase: this.getDayPhase()
      },
      aprendizaje: this.getLearningTip()
    };
  }

  async persist() {
    this.aquariums[this.activeMode] = this.state;
    await saveAquariums({ modoActivo: this.activeMode, acuarios: this.aquariums });
  }

  async flushActiveState() {
    this.aquariums[this.activeMode] = this.state;
    await saveAquariums({ modoActivo: this.activeMode, acuarios: this.aquariums });
  }

  switchMode(mode) {
    if (!['dulce', 'marino'].includes(mode)) return false;
    if (mode === this.activeMode) return true;
    this.stop();
    this.aquariums[this.activeMode] = this.state;
    this.activeMode = mode;
    this.state = this.aquariums[mode] || (mode === 'marino' ? createMarineState() : createDefaultState());
    this.aquariums[mode] = this.state;
    this.normalizeState();
    this.addChatMessage('sistema', mode === 'marino'
      ? 'Cambiaste al acuario marino. Es una partida independiente: aprenderemos a vigilar salinidad (33–36 ppt), temperatura y alcalinidad antes de poblar el arrecife.'
      : 'Cambiaste al acuario de agua dulce. Su partida, habitantes y parámetros se guardan por separado del acuario marino.');
    this.persist().catch(console.error);
    this.start();
    this.emitUpdate();
    return true;
  }

  addChatMessage(autor, texto) {
    this.state.mensajes.push({ autor, texto, fecha: new Date().toISOString() });
    this.state.mensajes = this.state.mensajes.slice(-80);
  }

  applyActions(actions = []) {
    const summary = [];

    for (const action of actions) {
      const cantidad = clamp(Number(action.cantidad || 1), 1, 20);

      if (action.tipo === 'COMPRAR_PEZ' && FISH_DEFS[action.especie]) {
        if (!(this.activeMode === 'marino' ? MARINE_FISH : FRESHWATER_FISH).includes(action.especie)) {
          summary.push(this.activeMode === 'marino'
            ? `${action.especie} es de agua dulce; en modo marino elige una especie del arrecife. Los ecosistemas se mantienen separados.`
            : `${action.especie} es una especie marina; cambia al acuario marino para agregarla. Las partidas se mantienen separadas.`);
          continue;
        }
        if (this.activeMode === 'marino' && !this.isMarineTankCycled()) {
          summary.push(`Todavía no agregué ${action.especie}. Aprendizaje: el filtro está en el ciclado y necesita desarrollar bacterias beneficiosas antes de recibir animales. En esta simulación didáctica el ciclo vacío tarda 72 horas de juego; en un acuario real se confirma con pruebas de amonio y nitrito, no solo con el calendario.`);
          continue;
        }
        if (this.activeMode === 'marino' && !this.isMarineWaterReady()) {
          summary.push('No agregué el pez: primero estabiliza salinidad, temperatura, alcalinidad y calcio. Consulta «estado» para ver los rangos de aprendizaje y evita cambios bruscos.');
          continue;
        }
        const compatibility = this.checkCompatibility(cantidad, action.especie);
        if (!compatibility.ok) {
          summary.push(compatibility.message);
          continue;
        }
        for (let i = 0; i < cantidad; i += 1) {
          this.state.peces.push(createFish(action.especie, chooseSex(action.especie, i)));
        }
        summary.push(`${cantidad} pez/peces ${action.especie}`);
      }

      if (action.tipo === 'AGREGAR_PLANTA' && PLANT_DEFS[action.especie]) {
        if (this.activeMode === 'marino') {
          summary.push('Las plantas de agua dulce no viven en un arrecife marino. Puedes agregar corales desde el catálogo marino.');
          continue;
        }
        for (let i = 0; i < cantidad; i += 1) {
          this.state.plantas.push(createPlant(action.especie));
        }
        summary.push(`${cantidad} planta(s) ${action.especie}`);
      }

      if (action.tipo === 'COMPRAR_INVERTEBRADO' && INVERTEBRATE_DEFS[action.especie]) {
        if (!(this.activeMode === 'marino' ? MARINE_INVERTEBRATES : FRESHWATER_INVERTEBRATES).includes(action.especie)) {
          summary.push(`${action.especie} pertenece a otro tipo de acuario; cambia de modo para mantener los ecosistemas separados.`);
          continue;
        }
        if (this.activeMode === 'marino' && !this.isMarineTankCycled()) {
          summary.push('Aún no se puede agregar el invertebrado. Primero deja madurar el filtro: sus bacterias beneficiosas ayudan a procesar residuos. El ciclo de 72 horas es una simplificación educativa; en la realidad se verifica midiendo amonio y nitrito.');
          continue;
        }
        if (this.activeMode === 'marino' && !this.isMarineWaterReady()) {
          summary.push('No agregué el invertebrado: primero estabiliza salinidad y temperatura. Los cambios bruscos afectan mucho a estos animales. Consulta «diagnostico».');
          continue;
        }
        if (this.activeMode === 'marino' && action.especie === 'cangrejo_ermitano' && cantidad > 1) {
          summary.push('Agrega los cangrejos ermitaños de uno en uno y ofrece conchas vacías de varios tamaños; pueden competir por ellas.');
          continue;
        }
        const compatibility = this.checkCompatibility(cantidad, action.especie);
        if (!compatibility.ok) {
          summary.push(compatibility.message);
          continue;
        }
        for (let i = 0; i < cantidad; i += 1) {
          this.state.invertebrados.push(createInvertebrate(action.especie, chooseSex(action.especie, i)));
        }
        summary.push(`${cantidad} invertebrado(s) ${action.especie}`);
      }

      if (action.tipo === 'AGREGAR_ALGA' && ALGAE_DEFS[action.especie]) {
        if (this.activeMode === 'marino') {
          summary.push('Las algas decorativas de agua dulce no se agregan al arrecife; allí los corales ocupan el lugar de organismos fijos.');
          continue;
        }
        for (let i = 0; i < cantidad; i += 1) {
          this.state.algas.push(createAlgae(action.especie));
        }
        summary.push(`${cantidad} alga(s) ${action.especie}`);
      }

      if (action.tipo === 'AGREGAR_MADERA' && WOOD_DEFS[action.especie]) {
        if (this.activeMode === 'marino') {
          summary.push('La madera de agua dulce no forma parte del arrecife marino; usa roca viva y corales.');
          continue;
        }
        for (let i = 0; i < cantidad; i += 1) {
          this.state.maderas.push(createWood(action.especie));
        }
        summary.push(`${cantidad} madera(s) ${action.especie}`);
      }

      if (action.tipo === 'AGREGAR_CORAL' && CORAL_DEFS[action.especie]) {
        if (this.activeMode !== 'marino') {
          summary.push('Los corales pertenecen al acuario marino. Cambia al modo Marino para agregarlos; tu acuario dulce quedará intacto.');
          continue;
        }
        if (!this.isMarineTankCycled()) {
          summary.push('Todavía no se puede agregar el coral. El filtro marino sigue en ciclado didáctico; los corales son animales sensibles y necesitan un acuario maduro. En un tanque real se mide amonio y nitrito en cero de forma estable antes de introducirlos.');
          continue;
        }
        if (this.totalAnimals() + this.state.corales.length + cantidad > 45) {
          summary.push('No se agrego: el arrecife ya está cerca de su capacidad didáctica de habitantes y corales.');
          continue;
        }
        if (this.state.calidadAgua.salud < 65 || !this.isMarineWaterReady()) {
          summary.push('No se agrego el coral: primero estabiliza temperatura, salinidad, alcalinidad y calcio. Los corales son sensibles a cambios bruscos.');
          continue;
        }
        for (let i = 0; i < cantidad; i += 1) this.state.corales.push(createCoral(action.especie));
        summary.push(`${cantidad} coral(es) ${CORAL_DEFS[action.especie].nombre} agregado(s). Aprendizaje: los corales son animales que dependen de luz y agua estable.`);
      }

      if (action.tipo === 'ALIMENTAR') {
        this.state.comida.push(...createFood(cantidad * 8));
        this.state.nutrientes = clamp(this.state.nutrientes + cantidad * 0.8, 0, 100);
        summary.push(`${cantidad} racion(es) de comida`);
      }

      if (action.tipo === 'LIMPIAR_MUERTOS') {
        const removedFish = this.state.peces.filter((fish) => !fish.vivo).length;
        const removedInvertebrates = this.state.invertebrados.filter((animal) => !animal.vivo).length;
        this.state.peces = this.state.peces.filter((fish) => fish.vivo);
        this.state.invertebrados = this.state.invertebrados.filter((animal) => animal.vivo);
        summary.push(`${removedFish + removedInvertebrates} animal(es) muerto(s) retirado(s)`);
      }

      if (action.tipo === 'CAMBIAR_TIEMPO' && TIME_SPEEDS[action.velocidad] !== undefined) {
        this.state.velocidadTiempo = action.velocidad;
        summary.push(`velocidad de tiempo: ${action.velocidad}`);
      }

      if (action.tipo === 'LIMPIAR_FILTRO') {
        this.state.equipos.filtroNivel = 100;
        this.state.equipos.filtroCarga = 0;
        summary.push('filtro limpiado y capacidad restaurada');
      }

      if (action.tipo === 'MEJORAR_FILTRO') {
        this.state.equipos.filtroNivel = clamp(this.state.equipos.filtroNivel + 25, 0, 100);
        summary.push('filtro mejorado temporalmente');
      }

      if (action.tipo === 'LUZ') {
        this.state.luzActiva = action.activa;
        summary.push(`luz ${action.activa ? 'encendida' : 'apagada'}`);
      }

      if (action.tipo === 'EQUIPO_MARINO' && this.activeMode === 'marino') {
        if (action.equipo === 'skimmer') this.state.equipos.skimmerActivo = action.activo;
        if (action.equipo === 'circulacion') this.state.equipos.circulacionActiva = action.activo;
        summary.push(`${action.equipo === 'skimmer' ? 'skimmer' : 'circulación'} ${action.activo ? 'activado' : 'apagado'}. ${action.equipo === 'skimmer' ? 'El skimmer ayuda a retirar residuos orgánicos.' : 'La circulación distribuye oxígeno y agua por el arrecife.'}`);
      }

      if (action.tipo === 'REPONER_EVAPORACION' && this.activeMode === 'marino') {
        this.state.calidadAgua.salinidad += (35 - this.state.calidadAgua.salinidad) * 0.35;
        this.recalculateWaterHealth();
        summary.push('Reposición didáctica aplicada: la salinidad se acercó gradualmente a 35 ppt sin retirar nitratos. En un acuario real usa agua dulce purificada para evaporación y vuelve a medir.');
      }

      if (action.tipo === 'CONSULTAR_ESTADO') {
        summary.push(this.buildWaterStatusMessage());
      }

      if (action.tipo === 'DIAGNOSTICO') {
        summary.push(this.buildDiagnosticMessage());
      }

      if (action.tipo === 'CAMBIAR_AGUA') {
        const percentage = clamp(Number(action.porcentaje || 20), 5, 80);
        const remaining = 1 - percentage / 100;
        const water = this.state.calidadAgua;
        water.amonio = clamp(water.amonio * remaining, 0, 100);
        water.nitritos = clamp(water.nitritos * remaining, 0, 100);
        water.nitratos = clamp(water.nitratos * remaining, 0, 100);
        water.oxigeno = clamp(water.oxigeno + percentage * 0.08, 0, 100);
        if (this.activeMode === 'marino') {
          const exchange = percentage / 100;
          water.salinidad += (35 - water.salinidad) * exchange;
          water.temperatura += (25 - water.temperatura) * exchange;
          water.alcalinidad += (8.5 - water.alcalinidad) * exchange;
          water.calcio += (420 - water.calcio) * exchange;
          summary.push(' En un acuario real prepara agua salada específica y ajusta temperatura y salinidad antes del cambio; no uses agua dulce de grifo ni sal de mesa.');
        } else {
          summary.push(' Usa agua dulce acondicionada, con temperatura parecida al acuario; no reemplaces toda el agua de golpe.');
        }
        this.recalculateWaterHealth();
        summary.push(`cambio de agua del ${percentage}% realizado`);
      }

      if (action.tipo === 'AYUDA') {
        summary.push(this.buildHelpMessage());
      }

      if (action.tipo === 'LISTAR_HABITANTES') {
        summary.push(this.buildInventoryMessage());
      }
    }

    if (summary.length > 0) {
      this.emitUpdate();
      this.persist().catch(console.error);
    }

    return summary;
  }

  tick() {
    const speed = TIME_SPEEDS[this.state.velocidadTiempo] ?? 1;
    const gameHours = ((TICK_MS / 1000) / REAL_SECONDS_PER_GAME_HOUR) * speed;
    if (gameHours <= 0) {
      this.state.ultimaActualizacion = new Date().toISOString();
      this.emitUpdate();
      return;
    }
    this.state.horasJuego += gameHours;
    if (this.activeMode === 'marino' && !this.state.cicloBiologico?.listo && this.state.equipos.filtroActivo) {
      this.state.cicloBiologico.horas = Math.min(this.state.cicloBiologico.horasNecesarias, this.state.cicloBiologico.horas + gameHours);
      if (this.state.cicloBiologico.horas >= this.state.cicloBiologico.horasNecesarias) {
        this.state.cicloBiologico.listo = true;
        this.addChatMessage('sistema', 'Ciclo didáctico completado: el filtro simulado ya puede procesar residuos. En un acuario real confirma amonio y nitrito en cero con pruebas; el tiempo por sí solo no demuestra que el ciclado terminó.');
      }
    }
    this.updateFood(TICK_MS / 1000);
    this.updateFish(gameHours, TICK_MS / 1000);
    this.updateInvertebrates(gameHours, TICK_MS / 1000);
    this.updatePlants(gameHours);
    this.updateAlgae(gameHours);
    this.updateCorals(gameHours);
    this.updateEggs(gameHours);
    this.updateWaterQuality(gameHours);
    this.updateReproduction();
    this.state.ultimaActualizacion = new Date().toISOString();
    this.emitUpdate();
  }

  updateFood(deltaSeconds) {
    for (const food of this.state.comida) {
      food.y += food.vy * deltaSeconds;
      if (food.y > 545) {
        this.state.nutrientes = clamp(this.state.nutrientes + food.nutrientes, 0, 100);
        this.state.calidadAgua.amonio = clamp(this.state.calidadAgua.amonio + 0.08, 0, 100);
      }
    }
    this.state.comida = this.state.comida.filter((food) => food.y <= 545);
  }

  updateFish(gameHours, deltaSeconds) {
    for (const fish of this.state.peces) {
      if (!fish.vivo) {
        this.sinkDeadFish(fish, deltaSeconds);
        continue;
      }
      const def = FISH_DEFS[fish.tipo];
      fish.edadEnHoras += gameHours;
      fish.hambre = clamp(fish.hambre + def.hungerPerHour * HUNGER_RATE_MULTIPLIER * gameHours, 0, 100);
      fish.escala = clamp(0.45 + (fish.edadEnHoras / def.growthHours) * (def.maxScale - 0.45), 0.45, def.maxScale);
      fish.horasEnHambruna = fish.hambre >= 100 ? (fish.horasEnHambruna || 0) + gameHours : 0;

      if (fish.horasEnHambruna >= STARVATION_GRACE_HOURS) {
        fish.vivo = false;
        fish.descomposicion = 0;
        fish.vx = randomBetween(-0.12, 0.12);
        fish.vy = randomBetween(0.6, 1);
        continue;
      }

      const targetFood = this.findNearestFood(fish);
      if (targetFood) {
        this.moveFishTowards(fish, targetFood, def.speed, deltaSeconds);
        if (Math.hypot(fish.x - targetFood.x, fish.y - targetFood.y) < 30 * fish.escala) {
          fish.hambre = Math.max(0, fish.hambre - 75);
          fish.horasEnHambruna = 0;
          this.state.nutrientes = clamp(this.state.nutrientes + 0.6, 0, 100);
          this.state.comida = this.state.comida.filter((food) => food.id !== targetFood.id);
        }
      } else if (this.schoolFish(fish, def, deltaSeconds)) {
        continue;
      } else if (this.moveTerritorialFish(fish, def, deltaSeconds)) {
        continue;
      } else if (this.forageFishNaturally(fish, gameHours)) {
        this.wanderFish(fish, def.speed * 0.75, deltaSeconds);
      } else {
        this.wanderFish(fish, def.speed, deltaSeconds);
      }
    }
  }

  forageFishNaturally(fish, gameHours) {
    const algaeAvailable = this.state.algas.length > 0;
    const plantAvailable = this.state.plantas.length > 0;
    const detritusAvailable = this.state.nutrientes > 8;
    let hungerReduction = 0;

    if (['otocinclus', 'ancistrus', 'molly', 'platy', 'xipho'].includes(fish.tipo) && algaeAvailable) {
      hungerReduction += 5 * gameHours;
      this.grazeAlgae(3 * gameHours);
    }

    if (['corydora', 'molly', 'guppy', 'platy', 'xipho'].includes(fish.tipo) && detritusAvailable) {
      hungerReduction += 2.5 * gameHours;
      this.state.nutrientes = clamp(this.state.nutrientes - 0.08 * gameHours, 0, 100);
    }

    if (['guppy', 'molly', 'platy', 'xipho', 'otocinclus'].includes(fish.tipo) && plantAvailable) {
      hungerReduction += 1.2 * gameHours;
    }

    if (hungerReduction <= 0) return false;
    fish.hambre = clamp(fish.hambre - hungerReduction, 0, 100);
    fish.horasEnHambruna = fish.hambre >= 100 ? fish.horasEnHambruna : 0;
    return true;
  }

  grazeAlgae(amount) {
    if (this.state.algas.length === 0) return;
    const algae = this.state.algas[Math.floor(Math.random() * this.state.algas.length)];
    algae.tamano = clamp(algae.tamano - amount, 0, algae.tamano);
    this.state.algas = this.state.algas.filter((item) => item.tamano > 4);
  }

  schoolFish(fish, def, deltaSeconds) {
    if (!SCHOOLING_SPECIES.includes(fish.tipo)) return false;
    const school = this.state.peces.filter((candidate) => candidate.vivo && candidate.tipo === fish.tipo);
    if (school.length < 4) return false;

    const neighbors = school.filter((candidate) => candidate.id !== fish.id && Math.hypot(candidate.x - fish.x, candidate.y - fish.y) <= 190);
    if (neighbors.length === 0) return false;

    let centerX = 0;
    let centerY = 0;
    let alignX = 0;
    let alignY = 0;
    let separateX = 0;
    let separateY = 0;

    for (const neighbor of neighbors) {
      centerX += neighbor.x;
      centerY += neighbor.y;
      alignX += neighbor.vx || 0;
      alignY += neighbor.vy || 0;
      const distance = Math.hypot(fish.x - neighbor.x, fish.y - neighbor.y) || 1;
      if (distance < 42) {
        separateX += (fish.x - neighbor.x) / distance;
        separateY += (fish.y - neighbor.y) / distance;
      }
    }

    centerX /= neighbors.length;
    centerY /= neighbors.length;
    alignX /= neighbors.length;
    alignY /= neighbors.length;

    const predator = this.findNearestPredator(fish);
    let fleeX = 0;
    let fleeY = 0;
    if (predator) {
      const distance = Math.hypot(fish.x - predator.x, fish.y - predator.y) || 1;
      fleeX = (fish.x - predator.x) / distance;
      fleeY = (fish.y - predator.y) / distance;
    }

    fish.vx = (fish.vx || 0) * 0.58 + (centerX - fish.x) * 0.006 + alignX * 0.26 + separateX * 0.62 + fleeX * 1.35;
    fish.vy = (fish.vy || 0) * 0.58 + (centerY - fish.y) * 0.006 + alignY * 0.26 + separateY * 0.62 + fleeY * 1.35;
    const magnitude = Math.hypot(fish.vx, fish.vy) || 1;
    fish.vx /= magnitude;
    fish.vy /= magnitude;
    fish.direccion = fish.vx >= 0 ? 1 : -1;
    fish.x += fish.vx * def.speed * 0.55 * deltaSeconds;
    fish.y += fish.vy * def.speed * 0.55 * deltaSeconds;
    this.keepFishInside(fish);
    return true;
  }

  findNearestPredator(fish) {
    if (!['neon', 'tetra', 'rasbora'].includes(fish.tipo)) return null;
    let nearest = null;
    let nearestDistance = Infinity;
    for (const predator of this.state.peces) {
      if (!predator.vivo || predator.tipo !== 'angel') continue;
      const distance = Math.hypot(fish.x - predator.x, fish.y - predator.y);
      if (distance < nearestDistance) {
        nearest = predator;
        nearestDistance = distance;
      }
    }
    return nearestDistance <= 230 ? nearest : null;
  }

  moveTerritorialFish(fish, def, deltaSeconds) {
    if (!['betta', 'ramirezi', 'gourami'].includes(fish.tipo) || this.state.maderas.length === 0) return false;
    const refuge = this.findNearestWood(fish);
    if (!refuge || Math.hypot(fish.x - refuge.x, fish.y - refuge.y) < 80) {
      this.wanderFish(fish, def.speed * 0.55, deltaSeconds);
      return true;
    }
    this.moveFishTowards(fish, refuge, def.speed * 0.55, deltaSeconds);
    return true;
  }

  findNearestWood(entity) {
    return this.state.maderas.reduce((nearest, wood) => {
      if (!nearest) return wood;
      return Math.hypot(entity.x - wood.x, entity.y - wood.y) < Math.hypot(entity.x - nearest.x, entity.y - nearest.y) ? wood : nearest;
    }, null);
  }

  sinkDeadFish(fish, deltaSeconds) {
    const bottomY = this.state.alto - 58;
    if (fish.y < bottomY) {
      fish.y = clamp(fish.y + (fish.vy || 0.8) * 18 * deltaSeconds, 76, bottomY);
      fish.x = clamp(fish.x + (fish.vx || 0) * 10 * deltaSeconds, 34, this.state.ancho - 34);
    } else {
      fish.y = bottomY;
      fish.vx = 0;
      fish.vy = 0;
    }
  }

  updatePlants(gameHours) {
    for (const plant of this.state.plantas) {
      const def = PLANT_DEFS[plant.especie];
      plant.edadEnHoras += gameHours;
      if (this.state.nutrientes > 0.5) {
        plant.altura = clamp(plant.altura + def.growthPerHour * gameHours, 10, def.maxHeight);
        this.state.nutrientes = clamp(this.state.nutrientes - def.nutrientUse * gameHours, 0, 100);
        this.state.calidadAgua.nitratos = clamp(this.state.calidadAgua.nitratos - def.nutrientUse * gameHours * 0.8, 0, 100);
      }
    }
  }

  updateAlgae(gameHours) {
    for (const algae of this.state.algas) {
      const def = ALGAE_DEFS[algae.especie];
      algae.edadEnHoras += gameHours;
      if (this.state.calidadAgua.nitratos > 1) {
        algae.tamano = clamp(algae.tamano + def.growthPerHour * gameHours, 8, def.maxSize);
        this.state.calidadAgua.nitratos = clamp(this.state.calidadAgua.nitratos - def.nitrateUse * gameHours, 0, 100);
      }
    }
  }

  updateWaterQuality(gameHours) {
    const aliveAnimals = this.state.peces.filter((fish) => fish.vivo).length + this.state.invertebrados.filter((animal) => animal.vivo).length + (this.activeMode === 'marino' ? this.state.corales.filter((coral) => coral.salud > 0).length : 0);
    const deadAnimals = this.state.peces.filter((fish) => !fish.vivo).length + this.state.invertebrados.filter((animal) => !animal.vivo).length;
    const plants = this.activeMode === 'marino' ? 0 : this.state.plantas.length + this.state.algas.length;
    const quality = this.state.calidadAgua;

    quality.amonio = clamp(quality.amonio + aliveAnimals * 0.018 * gameHours + deadAnimals * 0.12 * gameHours, 0, 100);

    const filterCapacity = clamp((this.state.equipos.filtroNivel ?? 100) / 100, 0, 1);
    this.state.equipos.filtroCarga = clamp((this.state.equipos.filtroCarga || 0) + aliveAnimals * 0.02 * gameHours, 0, 100);
    this.state.equipos.filtroNivel = clamp((this.state.equipos.filtroNivel ?? 100) - aliveAnimals * 0.003 * gameHours, 0, 100);

    if (this.state.equipos.filtroActivo && filterCapacity > 0) {
      const convertedAmmonia = Math.min(quality.amonio, 1.8 * filterCapacity * gameHours);
      quality.amonio = clamp(quality.amonio - convertedAmmonia, 0, 100);
      quality.nitritos = clamp(quality.nitritos + convertedAmmonia * 0.6, 0, 100);

      const convertedNitrites = Math.min(quality.nitritos, 1.3 * filterCapacity * gameHours);
      quality.nitritos = clamp(quality.nitritos - convertedNitrites, 0, 100);
      quality.nitratos = clamp(quality.nitratos + convertedNitrites * 0.85, 0, 100);
    }

    const isDay = this.getDayPhase() === 'dia';
    quality.nitratos = clamp(quality.nitratos - plants * 0.025 * gameHours + (!this.state.luzActiva ? 0.06 : 0) * gameHours, 0, 100);
    quality.oxigeno = clamp(
      quality.oxigeno + (this.state.equipos.oxigenacionActiva ? 2.2 : -1.2) * gameHours + (isDay && this.state.luzActiva ? this.state.plantas.length * 0.08 : -this.state.plantas.length * 0.025) * gameHours - aliveAnimals * 0.035 * gameHours,
      0,
      100
    );

    if (this.activeMode === 'marino') {
      quality.salinidad = clamp((quality.salinidad ?? 35) + 0.003 * gameHours, 30, 42);
      quality.temperatura = clamp((quality.temperatura ?? 25) + Math.sin(this.state.horasJuego / 24) * 0.004 * gameHours, 20, 32);
      quality.ph = clamp((quality.ph ?? 8.1) - 0.001 * gameHours, 7, 8.5);
      if (this.state.equipos.skimmerActivo) {
        this.state.nutrientes = clamp(this.state.nutrientes - 0.12 * gameHours, 0, 100);
        quality.nitratos = clamp(quality.nitratos - 0.03 * gameHours, 0, 100);
      }
      if (this.state.equipos.circulacionActiva) quality.oxigeno = clamp(quality.oxigeno + 0.35 * gameHours, 0, 100);
      const chemistryPenalty = Math.abs(quality.salinidad - 35) * 5
        + Math.abs(quality.temperatura - 25) * 4
        + Math.abs(quality.alcalinidad - 8.5) * 4
        + Math.abs(quality.calcio - 420) * 0.08
        + Math.max(0, 7.8 - quality.ph) * 12 + Math.max(0, quality.ph - 8.4) * 12;
      quality.salud = clamp(100 - quality.amonio * 1.6 - quality.nitritos * 1.3
        - Math.max(0, quality.nitratos - 20) * 0.5 - Math.max(0, 70 - quality.oxigeno) * 1.1
        - chemistryPenalty, 0, 100);
    } else {
      const woodTannins = this.state.maderas.reduce((total, wood) => total + (wood.tannins || 0), 0);
      quality.ph = clamp((quality.ph || 7.2) - woodTannins * 0.002 * gameHours, 5.5, 8.5);
      quality.salud = clamp(100 - quality.amonio * 1.6 - quality.nitritos * 1.3 - Math.max(0, quality.nitratos - 35) * 0.45 - Math.max(0, 70 - quality.oxigeno) * 1.1, 0, 100);
    }
    this.updateAnimalHealth(gameHours, quality.salud, aliveAnimals);

    if (quality.salud < 25) {
      for (const fish of this.state.peces) {
        if (fish.vivo) fish.hambre = clamp(fish.hambre + 1.5 * gameHours, 0, 100);
      }
      for (const animal of this.state.invertebrados) {
        if (animal.vivo) animal.hambre = clamp(animal.hambre + 1.2 * gameHours, 0, 100);
      }
    }

    const alertSignature = this.getWaterAlerts().map((alert) => alert.tipo).join('|');
    if (alertSignature !== this.lastAlertSignature) {
      if (alertSignature) this.addChatMessage('sistema', `Alerta del acuario: ${this.getWaterAlerts().map((alert) => alert.texto).join(' ')}`);
      this.lastAlertSignature = alertSignature;
    }
  }

  recalculateWaterHealth() {
    const water = this.state.calidadAgua;
    if (this.activeMode === 'marino') {
      const chemistryPenalty = Math.abs(water.salinidad - 35) * 5
        + Math.abs(water.temperatura - 25) * 4
        + Math.abs(water.alcalinidad - 8.5) * 4
        + Math.abs(water.calcio - 420) * 0.08
        + Math.max(0, 7.8 - water.ph) * 12 + Math.max(0, water.ph - 8.4) * 12;
      water.salud = clamp(100 - water.amonio * 1.6 - water.nitritos * 1.3
        - Math.max(0, water.nitratos - 20) * 0.5 - Math.max(0, 70 - water.oxigeno) * 1.1
        - chemistryPenalty, 0, 100);
      return;
    }
    water.salud = clamp(100 - water.amonio * 1.6 - water.nitritos * 1.3 - Math.max(0, water.nitratos - 35) * 0.45 - Math.max(0, 70 - water.oxigeno) * 1.1, 0, 100);
  }

  getDayPhase() {
    return (this.state.horasJuego % DAY_LENGTH_HOURS) < 12 ? 'dia' : 'noche';
  }

  getWaterAlerts() {
    const water = this.state.calidadAgua;
    const alerts = [];
    if (water.amonio >= 25) alerts.push({ tipo: 'amonio', severidad: 'alta', texto: this.activeMode === 'marino' ? 'Amonio elevado: es tóxico para los animales. En el ciclo biológico las bacterias del filtro lo transforman primero en nitrito. Reduce comida, revisa filtración y considera un cambio parcial con agua salada preparada.' : 'El amonio esta elevado: haz un cambio de agua y reduce la comida.' });
    if (water.nitritos >= 15) alerts.push({ tipo: 'nitritos', severidad: 'alta', texto: this.activeMode === 'marino' ? 'Nitritos elevados: también son tóxicos. Forman parte del ciclo biológico entre amonio y nitrato; revisa el filtro y usa agua salada preparada para un cambio parcial.' : 'Los nitritos estan elevados: revisa el filtro y cambia agua.' });
    if (water.nitratos >= (this.activeMode === 'marino' ? 20 : 40)) alerts.push({ tipo: 'nitratos', severidad: 'media', texto: this.activeMode === 'marino' ? 'Nitratos altos: los nutrientes sobrantes pueden alimentar algas y estresar corales. Reduce comida y considera un cambio parcial con agua salada preparada.' : 'Los nitratos estan altos: conviene cambiar agua y revisar las algas.' });
    if (water.oxigeno < 60) alerts.push({ tipo: 'oxigeno', severidad: 'alta', texto: 'El oxigeno esta bajo: activa la oxigenacion.' });
    if (water.salud < 55) alerts.push({ tipo: 'salud', severidad: 'alta', texto: 'La salud del agua es baja: evita introducir animales nuevos.' });
    if ((this.state.equipos.filtroNivel ?? 100) < 25) alerts.push({ tipo: 'filtro', severidad: 'alta', texto: 'El filtro esta degradado: usa "limpia el filtro".' });
    if (this.activeMode === 'marino') {
      if (water.salinidad < 33 || water.salinidad > 36) alerts.push({ tipo: 'salinidad', severidad: 'alta', texto: water.salinidad > 36 ? 'Salinidad alta (ppt = partes por mil): la evaporación concentra la sal. En un tanque real repón el agua evaporada lentamente con agua dulce purificada, no con agua salada; mide de nuevo.' : 'Salinidad baja (ppt = partes por mil): comprueba la medición y corrige poco a poco con agua salada preparada para acuarios marinos. Evita cambios bruscos.' });
      if (water.temperatura < 23 || water.temperatura > 27) alerts.push({ tipo: 'temperatura', severidad: 'alta', texto: 'Temperatura fuera de 23–27 °C: los cambios térmicos estresan a peces y corales. Comprueba el termómetro y corrige gradualmente; no ajustes de golpe.' });
      if (water.alcalinidad < 7 || water.alcalinidad > 10) alerts.push({ tipo: 'alcalinidad', severidad: 'media', texto: 'Alcalinidad fuera de 7–10 dKH: ayuda a mantener estable el pH y permite formar esqueletos de coral. Mide antes de corregir; evita añadir productos a ciegas.' });
      if (water.calcio < 380 || water.calcio > 460) alerts.push({ tipo: 'calcio', severidad: 'media', texto: 'Calcio fuera de 380–460 ppm: los corales duros lo usan para crecer. Mide y ajusta gradualmente; un acuario nuevo sin corales suele no necesitar suplemento.' });
      if (water.ph < 7.8 || water.ph > 8.4) alerts.push({ tipo: 'ph-marino', severidad: 'media', texto: 'pH fuera de 7.8–8.4, rango didáctico. El pH describe acidez/alcalinidad; confirma la lectura y revisa alcalinidad y aireación antes de actuar. Evita correctores de pH añadidos a ciegas.' });
      if (water.ph < 7.8 || water.ph > 8.4) alerts.push({ tipo: 'ph-marino', severidad: 'media', texto: 'pH fuera del rango didáctico 7.8–8.4. El pH indica acidez/alcalinidad del agua; revisa primero alcalinidad y aireación y evita corregirlo de golpe.' });
      if ((this.state.equipos.circulacionActiva === false)) alerts.push({ tipo: 'circulacion', severidad: 'alta', texto: 'La circulación está apagada: el movimiento lleva oxígeno y nutrientes a todo el arrecife. Activa las bombas de circulación.' });
      if (!this.isMarineTankCycled() && (this.state.peces.length + this.state.invertebrados.length + this.state.corales.length) === 0) alerts.push({ tipo: 'ciclado', severidad: 'media', texto: `El arrecife está en la etapa educativa de ciclado (${Math.round((this.state.cicloBiologico?.horas || 0) / (this.state.cicloBiologico?.horasNecesarias || 72) * 100)}%). Aún no agregues animales: un filtro necesita bacterias beneficiosas. En un acuario real se confirma con pruebas de amonio y nitrito en cero, no solo esperando.` });
    }
    return alerts;
  }

  isMarineWaterReady() {
    const water = this.state.calidadAgua;
    return water.salinidad >= 33 && water.salinidad <= 36
      && water.temperatura >= 23 && water.temperatura <= 27
      && water.alcalinidad >= 7 && water.alcalinidad <= 10
      && water.calcio >= 380 && water.calcio <= 460
      && water.ph >= 7.8 && water.ph <= 8.4;
  }

  isMarineTankCycled() {
    return this.state.cicloBiologico?.listo === true;
  }

  updateCorals(gameHours) {
    if (this.activeMode !== 'marino' || !Array.isArray(this.state.corales)) return;
    for (const coral of this.state.corales) {
      coral.edadEnHoras += gameHours;
      if (this.isMarineWaterReady() && this.isMarineTankCycled() && this.state.luzActiva && this.state.equipos.circulacionActiva) {
        coral.tamano = clamp(coral.tamano + CORAL_DEFS[coral.especie].crecimiento * gameHours, 8, 100);
        coral.estres = clamp((coral.estres || 0) - 0.08 * gameHours, 0, 100);
        coral.salud = clamp((coral.salud ?? 100) + 0.02 * gameHours, 0, 100);
        if (['acropora', 'euphyllia'].includes(coral.especie)) {
          this.state.calidadAgua.calcio = clamp(this.state.calidadAgua.calcio - 0.002 * gameHours, 300, 500);
          this.state.calidadAgua.alcalinidad = clamp(this.state.calidadAgua.alcalinidad - 0.0002 * gameHours, 5, 12);
        }
      } else {
        coral.estres = clamp((coral.estres || 0) + 0.1 * gameHours, 0, 100);
        coral.salud = clamp((coral.salud ?? 100) - 0.035 * gameHours, 0, 100);
      }
      coral.tamano = clamp(coral.tamano - Math.max(0, coral.estres - 60) * 0.0003 * gameHours, 6, 100);
    }
  }

  hasNearbyPredator(animal) {
    const predators = this.activeMode === 'marino' ? ['damisela'] : ['betta', 'angel'];
    return this.state.peces.some((fish) => fish.vivo && predators.includes(fish.tipo) && Math.hypot(fish.x - animal.x, fish.y - animal.y) < 240);
  }

  updateReproduction() {
    if (!this.canReproduce()) return;
    this.tryReproduce('guppy', this.state.peces.filter((fish) => fish.vivo && fish.tipo === 'guppy'), () => this.state.peces.push(createFish('guppy')));
    this.tryReproduce('cherry', this.state.invertebrados.filter((animal) => animal.vivo && animal.especie === 'cherry'), () => this.state.invertebrados.push(createInvertebrate('cherry')));
    this.tryReproduce('planorbis', this.state.invertebrados.filter((animal) => animal.vivo && animal.especie === 'planorbis'), () => this.state.invertebrados.push(createInvertebrate('planorbis')));
  }

  updateAnimalHealth(gameHours, waterHealth, aliveAnimals) {
    const overcrowding = Math.max(0, aliveAnimals - 30) * 0.35;
    for (const animal of [...this.state.peces, ...this.state.invertebrados]) {
      if (!animal.vivo) continue;
      const stressGain = Math.max(0, 70 - waterHealth) * 0.015 + overcrowding * 0.01 + (animal.hambre > 75 ? 0.3 : 0);
      const recovery = waterHealth >= 80 && animal.hambre < 45 ? 0.2 : 0;
      animal.estres = clamp((animal.estres || 0) + (stressGain - recovery) * gameHours, 0, 100);
      animal.salud = clamp((animal.salud ?? 100) - Math.max(0, animal.estres - 55) * 0.008 * gameHours + (animal.estres < 25 ? 0.04 * gameHours : 0), 0, 100);
      if (animal.salud < 25) animal.hambre = clamp(animal.hambre + 0.35 * gameHours, 0, 100);
    }
  }

  canReproduce() {
    if (this.activeMode === 'marino') return false;
    return this.state.calidadAgua.salud >= 72 && this.state.calidadAgua.oxigeno >= 70 && this.totalAnimals() < 45;
  }

  tryReproduce(key, candidates, createBaby) {
    if (candidates.length < 2) return;
    if (SEXED_REPRODUCTION.includes(key)) {
      const hasMale = candidates.some((animal) => animal.sexo === 'macho');
      const hasFemale = candidates.some((animal) => animal.sexo === 'hembra');
      if (!hasMale || !hasFemale) return;
    }
    if (candidates.some((animal) => animal.hambre > 35 || animal.edadEnHoras < 24)) return;
    const lastBirth = this.state.reproduccion[key] || 0;
    if (this.state.horasJuego - lastBirth < 48) return;
    if (Math.random() > 0.025) return;
    const parent = candidates[0];
    this.state.huevos.push({
      id: id('huevo'),
      especie: key,
      x: parent.x,
      y: parent.y,
      edadEnHoras: 0,
      incubacionHoras: key === 'planorbis' ? 18 : 24,
      color: key === 'guppy' ? '#fef08a' : key === 'cherry' ? '#fca5a5' : '#fde68a'
    });
    this.state.reproduccion[key] = this.state.horasJuego;
    this.addChatMessage('sistema', `Buenas condiciones: aparecieron huevos de ${key}.`);
  }

  updateEggs(gameHours) {
    if (!Array.isArray(this.state.huevos)) this.state.huevos = [];
    for (const egg of this.state.huevos) egg.edadEnHoras += gameHours;
    const ready = this.state.huevos.filter((egg) => egg.edadEnHoras >= egg.incubacionHoras);
    for (const egg of ready) {
      if (egg.especie === 'guppy') this.state.peces.push({ ...createFish('guppy'), escala: 0.28, esCria: true, x: egg.x, y: egg.y });
      if (egg.especie === 'cherry') this.state.invertebrados.push({ ...createInvertebrate('cherry'), escala: 0.28, esCria: true, x: egg.x, y: egg.y });
      if (egg.especie === 'planorbis') this.state.invertebrados.push({ ...createInvertebrate('planorbis'), escala: 0.28, esCria: true, x: egg.x, y: egg.y });
      this.addChatMessage('sistema', `Eclosionaron crias de ${egg.especie}.`);
    }
    this.state.huevos = this.state.huevos.filter((egg) => egg.edadEnHoras < egg.incubacionHoras);
  }

  updateInvertebrates(gameHours, deltaSeconds) {
    for (const animal of this.state.invertebrados) {
      if (!animal.vivo) continue;
      const def = INVERTEBRATE_DEFS[animal.especie];
      animal.edadEnHoras += gameHours;
      animal.hambre = clamp(animal.hambre + def.hungerPerHour * HUNGER_RATE_MULTIPLIER * gameHours, 0, 100);
      animal.escala = clamp(0.45 + (animal.edadEnHoras / def.growthHours) * (def.maxScale - 0.45), 0.45, def.maxScale);
      animal.horasEnHambruna = animal.hambre >= 100 ? (animal.horasEnHambruna || 0) + gameHours : 0;

      if (animal.horasEnHambruna >= STARVATION_GRACE_HOURS) {
        animal.vivo = false;
        animal.descomposicion = 0;
        continue;
      }

      const targetCorpse = this.findNearestCorpse(animal);
      if (targetCorpse) {
        this.moveBottomAnimalTowards(animal, targetCorpse.entity, def.speed, deltaSeconds);
        if (Math.hypot(animal.x - targetCorpse.entity.x, animal.y - targetCorpse.entity.y) < 18 * animal.escala) {
          targetCorpse.entity.descomposicion = clamp((targetCorpse.entity.descomposicion || 0) + gameHours * 0.35, 0, 1);
          animal.hambre = clamp(animal.hambre - 18 * gameHours, 0, 100);
          animal.horasEnHambruna = animal.hambre >= 100 ? animal.horasEnHambruna : 0;
          this.state.nutrientes = clamp(this.state.nutrientes + 0.2 * gameHours, 0, 100);
        }
        continue;
      }

      if (['gamba', 'cangrejo'].includes(animal.grupo) && this.hasNearbyPredator(animal)) {
        const refuge = this.findNearestWood(animal);
        if (refuge) {
          this.moveBottomAnimalTowards(animal, refuge, def.speed * 1.2, deltaSeconds);
          continue;
        }
      }

      const targetFood = this.findNearestFood(animal);
      if (targetFood) {
        this.moveBottomAnimalTowards(animal, targetFood, def.speed, deltaSeconds);
        if (Math.hypot(animal.x - targetFood.x, animal.y - targetFood.y) < 24 * animal.escala) {
          animal.hambre = Math.max(0, animal.hambre - 75);
          animal.horasEnHambruna = 0;
          this.state.nutrientes = clamp(this.state.nutrientes + 0.35, 0, 100);
          this.state.comida = this.state.comida.filter((food) => food.id !== targetFood.id);
        }
      } else if (this.state.algas.length > 0) {
        const targetAlgae = this.findNearestAlgae(animal);
        this.moveBottomAnimalTowards(animal, targetAlgae, def.speed, deltaSeconds);
        if (Math.hypot(animal.x - targetAlgae.x, animal.y - targetAlgae.y) < 22 * animal.escala) {
          targetAlgae.tamano = clamp(targetAlgae.tamano - 8 * gameHours, 0, targetAlgae.tamano);
          animal.hambre = clamp(animal.hambre - 10 * gameHours, 0, 100);
          animal.horasEnHambruna = animal.hambre >= 100 ? animal.horasEnHambruna : 0;
          this.state.algas = this.state.algas.filter((algae) => algae.tamano > 4);
        }
      } else if (this.forageBottomAnimalNaturally(animal, gameHours)) {
        this.wanderBottomAnimal(animal, def.speed * 0.7, deltaSeconds);
      } else {
        this.wanderBottomAnimal(animal, def.speed, deltaSeconds);
      }
    }

    this.removeConsumedCorpses();
  }

  forageBottomAnimalNaturally(animal, gameHours) {
    const detritusAvailable = this.state.nutrientes > 6;
    const plantBiofilmAvailable = this.state.plantas.length > 0;
    let hungerReduction = 0;

    if (detritusAvailable) {
      hungerReduction += animal.grupo === 'caracol' ? 4 * gameHours : 3 * gameHours;
      this.state.nutrientes = clamp(this.state.nutrientes - 0.1 * gameHours, 0, 100);
    }

    if (plantBiofilmAvailable || (this.activeMode === 'marino' && this.state.algas.length > 0)) {
      hungerReduction += 1.4 * gameHours;
    }

    if (hungerReduction <= 0) return false;
    animal.hambre = clamp(animal.hambre - hungerReduction, 0, 100);
    animal.horasEnHambruna = animal.hambre >= 100 ? animal.horasEnHambruna : 0;
    return true;
  }

  findNearestCorpse(animal) {
    let nearest = null;
    let nearestDistance = Infinity;
    const corpses = [
      ...this.state.peces.filter((fish) => !fish.vivo).map((entity) => ({ entity, type: 'pez' })),
      ...this.state.invertebrados
        .filter((candidate) => candidate.id !== animal.id && !candidate.vivo)
        .map((entity) => ({ entity, type: 'invertebrado' }))
    ];

    for (const corpse of corpses) {
      const distance = Math.hypot(animal.x - corpse.entity.x, animal.y - corpse.entity.y);
      if (distance < nearestDistance) {
        nearest = corpse;
        nearestDistance = distance;
      }
    }

    return nearestDistance <= 260 ? nearest : null;
  }

  findNearestAlgae(animal) {
    let nearest = this.state.algas[0];
    let nearestDistance = Infinity;
    for (const algae of this.state.algas) {
      const distance = Math.hypot(animal.x - algae.x, animal.y - algae.y);
      if (distance < nearestDistance) {
        nearest = algae;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  removeConsumedCorpses() {
    const consumedFish = this.state.peces.filter((fish) => !fish.vivo && (fish.descomposicion || 0) >= 1).length;
    const consumedInvertebrates = this.state.invertebrados.filter((animal) => !animal.vivo && (animal.descomposicion || 0) >= 1).length;

    if (consumedFish > 0 || consumedInvertebrates > 0) {
      this.state.peces = this.state.peces.filter((fish) => fish.vivo || (fish.descomposicion || 0) < 1);
      this.state.invertebrados = this.state.invertebrados.filter((animal) => animal.vivo || (animal.descomposicion || 0) < 1);
      this.state.nutrientes = clamp(this.state.nutrientes + consumedFish * 1.5 + consumedInvertebrates * 0.8, 0, 100);
    }
  }

  findNearestFood(fish) {
    let nearest = null;
    let nearestDistance = Infinity;
    for (const food of this.state.comida) {
      const distance = Math.hypot(fish.x - food.x, fish.y - food.y);
      if (distance < nearestDistance) {
        nearest = food;
        nearestDistance = distance;
      }
    }
    return nearest;
  }

  moveFishTowards(fish, target, speed, deltaSeconds) {
    const dx = target.x - fish.x;
    const dy = target.y - fish.y;
    const distance = Math.hypot(dx, dy) || 1;
    fish.vx = dx / distance;
    fish.vy = dy / distance;
    fish.direccion = fish.vx >= 0 ? 1 : -1;
    fish.x += fish.vx * speed * deltaSeconds;
    fish.y += fish.vy * speed * deltaSeconds;
    this.keepFishInside(fish);
  }

  wanderFish(fish, speed, deltaSeconds) {
    if (Math.random() < 0.04) {
      fish.vx += randomBetween(-0.5, 0.5);
      fish.vy += randomBetween(-0.35, 0.35);
    }
    const magnitude = Math.hypot(fish.vx, fish.vy) || 1;
    fish.vx /= magnitude;
    fish.vy /= magnitude;
    fish.direccion = fish.vx >= 0 ? 1 : -1;
    fish.x += fish.vx * speed * 0.45 * deltaSeconds;
    fish.y += fish.vy * speed * 0.45 * deltaSeconds;
    this.keepFishInside(fish);
  }

  moveBottomAnimalTowards(animal, target, speed, deltaSeconds) {
    const dx = target.x - animal.x;
    const dy = clamp(target.y, 500, 552) - animal.y;
    const distance = Math.hypot(dx, dy) || 1;
    animal.vx = dx / distance;
    animal.vy = dy / distance;
    animal.direccion = animal.vx >= 0 ? 1 : -1;
    animal.x += animal.vx * speed * deltaSeconds;
    animal.y += animal.vy * speed * deltaSeconds;
    this.keepBottomAnimalInside(animal);
  }

  wanderBottomAnimal(animal, speed, deltaSeconds) {
    if (Math.random() < 0.025) {
      animal.vx += randomBetween(-0.35, 0.35);
    }
    animal.vx = clamp(animal.vx, -1, 1);
    animal.direccion = animal.vx >= 0 ? 1 : -1;
    animal.x += animal.vx * speed * 0.5 * deltaSeconds;
    animal.y += Math.sin(Date.now() / 1200 + animal.x) * 0.08;
    this.keepBottomAnimalInside(animal);
  }

  keepBottomAnimalInside(animal) {
    if (animal.x < 28 || animal.x > this.state.ancho - 28) animal.vx *= -1;
    animal.x = clamp(animal.x, 28, this.state.ancho - 28);
    animal.y = clamp(animal.y, 498, this.state.alto - 52);
  }

  keepFishInside(fish) {
    if (fish.x < 34 || fish.x > this.state.ancho - 34) fish.vx *= -1;
    if (fish.y < 76 || fish.y > this.state.alto - 98) fish.vy *= -1;
    fish.x = clamp(fish.x, 34, this.state.ancho - 34);
    fish.y = clamp(fish.y, 76, this.state.alto - 98);
  }

  totalAnimals() {
    return this.state.peces.length + this.state.invertebrados.length;
  }

  checkCompatibility(amount, species) {
    const biologicalLoad = this.activeMode === 'marino'
      ? this.state.peces.length + this.state.invertebrados.length + this.state.corales.length
      : this.totalAnimals();
    if (this.activeMode === 'marino' && species === 'cirujano_azul') return { ok: false, message: 'El cirujano azul se estudia en el catálogo, pero no se puede agregar aquí: necesita mucho más espacio de nado que este acuario simulado.' };
    if (this.activeMode === 'marino' && biologicalLoad + amount > 12) return { ok: false, message: 'Este arrecife didáctico tiene un máximo conservador de 12 organismos entre peces, invertebrados y corales. En acuarios reales la capacidad depende del volumen, filtración y necesidades de cada especie; no existe un número universal.' };
    if (biologicalLoad + amount > 45) {
      return { ok: false, message: 'No se agrego: el acuario ya esta cerca de su limite biologico.' };
    }
    if (this.state.calidadAgua.salud < 35) {
      return { ok: false, message: 'No se agrego: la calidad del agua es baja; estabiliza el acuario primero.' };
    }

    if (this.activeMode === 'marino') {
      if (species === 'cirujano_azul') return { ok: false, message: 'No se agrego el cirujano azul. Aprende: es un pez activo que necesita mucho más espacio de nado del que representa este acuario didáctico; lo dejamos en el catálogo para aprender, no para poblar este tanque.' };
      if (!this.isMarineTankCycled()) return { ok: false, message: 'El filtro aún está en ciclo educativo. No introduzcas peces hasta que termine. En un acuario real confirma con pruebas que amonio y nitrito están en cero de forma estable; el paso del tiempo, por sí solo, no basta.' };
      if (species === 'damisela' && (amount > 1 || this.state.peces.some((fish) => fish.vivo && fish.tipo === 'damisela'))) {
        return { ok: false, message: 'No se agregó la damisela. Puede ser muy territorial, especialmente en acuarios pequeños; para aprender, mantén solo una y ofrece escondites.' };
      }
      if (species === 'gramma' && (amount > 1 || this.state.peces.some((fish) => fish.vivo && fish.tipo === 'gramma'))) return { ok: false, message: 'No se agregó otra gramma real: puede defender su cueva y su territorio. En este acuario didáctico mantenemos una para evitar conflictos.' };
      if (species === 'firefish' && (amount > 1 || this.state.peces.some((fish) => fish.vivo && fish.tipo === 'firefish'))) return { ok: false, message: 'No se agregó otro pez dardo: puede saltar cuando se asusta; en acuarios reales necesita tapa segura. Esta simulación limita el grupo para enseñar esa precaución.' };
      if (MARINE_INVERTEBRATES.includes(species) && !this.isMarineTankCycled()) return { ok: false, message: 'El filtro aún está en ciclo educativo. No introduzcas invertebrados hasta terminarlo y comprobar amonio y nitrito en cero con pruebas en un acuario real.' };
      if (['acropora', 'euphyllia'].includes(species)) return { ok: false, message: 'Ese organismo es un coral, no un pez. Pídelo como coral acropora o coral euphyllia.' };
      return { ok: true, message: 'compatible' };
    }

    const aliveFishTypes = this.state.peces.filter((fish) => fish.vivo).map((fish) => fish.tipo);
    const aliveShrimpTypes = this.state.invertebrados.filter((animal) => animal.vivo && animal.grupo === 'gamba').map((animal) => animal.especie);
    const smallShrimpPresent = aliveShrimpTypes.some((type) => ['cherry', 'fantasma'].includes(type));
    const existingSchoolCount = this.state.peces.filter((fish) => fish.vivo && fish.tipo === species).length;

    if (SCHOOLING_SPECIES.includes(species) && existingSchoolCount + amount < 6) {
      return { ok: false, message: `No se agrego: ${species} necesita un cardumen de al menos 6 ejemplares.` };
    }

    if (species === 'betta') {
      if (aliveFishTypes.includes('betta') || amount > 1) {
        return { ok: false, message: 'No se agrego: los bettas suelen ser territoriales; manten solo uno en este acuario.' };
      }
      if (aliveFishTypes.includes('guppy')) {
        return { ok: false, message: 'No se agrego: betta y guppy pueden tener conflictos por aletas llamativas.' };
      }
      if (smallShrimpPresent) {
        return { ok: false, message: 'No se agrego: un betta puede atacar gambas cherry o fantasma.' };
      }
    }

    if (species === 'guppy' && aliveFishTypes.includes('betta')) {
      return { ok: false, message: 'No se agrego: guppys con betta pueden generar agresion por aletas y colores.' };
    }

    if (['cherry', 'fantasma'].includes(species) && aliveFishTypes.includes('betta')) {
      return { ok: false, message: 'No se agrego: el betta puede cazar gambas pequenas.' };
    }

    if (species === 'angel') {
      if (aliveFishTypes.some((type) => ['neon', 'tetra', 'rasbora'].includes(type)) || smallShrimpPresent) {
        return { ok: false, message: 'No se agrego: el pez angel adulto puede depredar peces pequenos de cardumen o gambas pequenas.' };
      }
    }

    if ((['neon', 'tetra', 'rasbora'].includes(species) || ['cherry', 'fantasma'].includes(species)) && aliveFishTypes.includes('angel')) {
      return { ok: false, message: 'No se agrego: ya hay pez angel y podria depredar peces pequenos o gambas pequenas.' };
    }

    if (species === 'gourami') {
      if (aliveFishTypes.includes('gourami') || amount > 1) {
        return { ok: false, message: 'No se agrego: el gourami enano es territorial; manten solo uno en este acuario.' };
      }
      if (aliveFishTypes.some((type) => ['betta', 'ramirezi'].includes(type))) {
        return { ok: false, message: 'No se agrego: gourami, betta y ramirezi pueden competir por territorio.' };
      }
    }

    if (species === 'betta' && aliveFishTypes.some((type) => ['gourami', 'ramirezi'].includes(type))) {
      return { ok: false, message: 'No se agrego: el betta puede entrar en conflicto con gouramis o ramirezi.' };
    }

    if (species === 'ramirezi' && aliveFishTypes.some((type) => ['betta', 'gourami', 'angel', 'ramirezi'].includes(type))) {
      return { ok: false, message: 'No se agrego: el ramirezi necesita un territorio tranquilo y puede conflictuar con betta, gourami o angel.' };
    }

    return { ok: true, message: 'compatible' };
  }

  buildWaterStatusMessage() {
    const water = this.state.calidadAgua;
    const alerts = this.getWaterAlerts();
    const alertText = alerts.length > 0 ? ` Alertas: ${alerts.map((alert) => alert.texto).join(' ')}` : ' No hay alertas activas.';
    const chemistry = this.activeMode === 'marino'
      ? `, salinidad ${water.salinidad.toFixed(1)} ppt (objetivo 33–36), temperatura ${water.temperatura.toFixed(1)} °C (objetivo 23–27), alcalinidad ${water.alcalinidad.toFixed(1)} dKH (objetivo 7–10), calcio ${Math.round(water.calcio)} ppm (objetivo 380–460)`
      : '';
    const marineCycle = this.activeMode === 'marino'
      ? ` Ciclado didáctico: ${this.isMarineTankCycled() ? 'completado' : `${Math.round((this.state.cicloBiologico?.horas || 0) / (this.state.cicloBiologico?.horasNecesarias || 72) * 100)}%`}; no equivale a medir amonio y nitrito en cero en un acuario real.`
      : '';
    return `Agua ${this.activeMode}: salud ${Math.round(water.salud)}%, pH ${(water.ph || (this.activeMode === 'marino' ? 8.1 : 7.2)).toFixed(2)}, amonio ${Math.round(water.amonio)}%, nitritos ${Math.round(water.nitritos)}%, nitratos ${Math.round(water.nitratos)}%, oxigeno ${Math.round(water.oxigeno)}%${chemistry}. Fase: ${this.getDayPhase()}.${marineCycle}${alertText}`;
  }

  resolveLearningQuestion(message) {
    const text = String(message || '').trim().toLowerCase();
    if (this.activeMode === 'marino') {
      const salinityLookup = /\b(salinidad|temperatura|alcalinidad|calcio|ph)\b/.test(text) && /\b(estado|muestra|muestrame|mu[eé]strame|mostrar|ver|cuanto|cu[aá]nta|cual|cu[aá]l|como esta|c[oó]mo est[aá])\b/.test(text);
      if (salinityLookup) return this.buildWaterStatusMessage();
      if (/\b(crecimiento|crece|crecen)\b/.test(text) && /\b(coral|corales|acropora|euphyllia)\b/.test(text)) return 'Los corales del acuario didáctico solo crecen cuando el filtro terminó el ciclado, la circulación y la luz están encendidas y salinidad, temperatura, pH, alcalinidad y calcio están dentro del rango. Si algo se sale, pueden estresarse. En un acuario real cada especie tiene requisitos y ritmo propios.';
      const cycling = /\b(ciclado|ciclo biologico|ciclo biológico|acuario nuevo)\b/.test(text);
      const concept = text.match(/\b(salinidad|evaporacion|sal|temperatura|alcalinidad|calcio|coral(?:es)?|skimmer|espumador|circulacion|corriente)\b/);
      if (cycling && /\b(que|qué|como|cómo|explica|significa|importa)\b/.test(text)) return this.buildMarineConceptMessage('ciclado');
      if (concept && /\b(que|qué|como|cómo|para que|para qué|por que|por qué|explica|significa|necesita|necesitan|importa)\b/.test(text)) {
        const normalizedConcept = concept[1].startsWith('coral') ? 'coral'
          : ['skimmer', 'espumador'].includes(concept[1]) ? 'skimmer'
            : ['circulacion', 'corriente'].includes(concept[1]) ? 'circulation' : concept[1];
        return this.buildMarineConceptMessage(normalizedConcept);
      }
    } else {
      const freshwaterConcept = text.match(/\b(amonio|nitrito|nitrato|nutrientes)\b/);
      if (freshwaterConcept && /\b(que|qué|como|cómo|explica|significa|importa|sirve)\b/.test(text)) return freshwaterLesson(freshwaterConcept[1]);
    }
    return null;
  }

  buildMarineConceptMessage(concept) {
    const lessons = {
      salinidad: 'La salinidad indica cuánta sal está disuelta en el agua marina y se expresa en ppt (partes por mil). En esta simulación buscamos 33–36 ppt. Si se evapora agua, la sal permanece: repón solo el agua evaporada con agua dulce purificada. Para un cambio de agua prepara agua salada con sal para acuarios marinos y ajusta su temperatura.',
      evaporacion: 'Al evaporarse, sale agua pero las sales quedan dentro, por eso sube la salinidad. En un tanque real repón solo el agua evaporada con agua dulce purificada (por ejemplo, de ósmosis inversa), poco a poco; no uses agua salada para rellenar. Mide salinidad después.',
      temperatura: 'La temperatura afecta el metabolismo y el estrés de los animales. Esta simulación usa 23–27 °C como rango de aprendizaje. En un acuario real, comprueba con termómetro y evita cambios bruscos.',
      alcalinidad: 'La alcalinidad (dKH) mide la capacidad del agua para resistir cambios de pH. Los corales la usan al formar estructuras. Rango didáctico: 7–10 dKH. Mide antes de corregir y nunca añadas productos a ciegas.',
      calcio: 'El calcio se mide en ppm y lo consumen sobre todo los corales que forman esqueletos. Rango didáctico: 380–460 ppm. Sin corales duros normalmente no hace falta dosificarlo; medir evita excesos.',
      coral: 'Los corales son animales coloniales, no plantas. Necesitan luz adecuada, circulación y parámetros estables. Empieza con corales resistentes y no los agregues hasta que el diagnóstico indique que el agua marina está estable.',
      skimmer: 'El skimmer mezcla aire y agua y retira parte de los residuos orgánicos antes de que se descompongan. Complementa al filtro; no reemplaza los cambios de agua ni la medición de parámetros.',
      circulation: 'La circulación mueve el agua por todo el arrecife, evita zonas estancadas y lleva oxígeno y alimento a los corales. Debe ser constante, pero no apuntarse con fuerza directa a corales delicados.',
      ciclado: 'El ciclado permite que bacterias beneficiosas se establezcan en el filtro y transformen amonio (tóxico) en nitrito (también tóxico) y después en nitrato. En un acuario real se confirma midiendo amonio y nitrito en cero de forma estable; esperar unos días no basta.',
      evaporacion: 'Al evaporarse, sale agua pero las sales quedan dentro, por eso sube la salinidad. En un tanque real repón solo el agua evaporada con agua dulce purificada poco a poco; no uses agua salada para rellenar. En esta simulación escribe “repón evaporación” para practicar una corrección gradual.'
    };
    return lessons[concept] || 'En el acuario marino puedes aprender sobre salinidad, temperatura, alcalinidad, calcio, corales, skimmer y circulación. Pregunta, por ejemplo: ¿qué es la salinidad?';
  }

  buildDiagnosticMessage() {
    const alerts = this.getWaterAlerts();
    if (alerts.length === 0) {
      if (this.activeMode === 'marino' && !this.isMarineTankCycled()) return `Diagnóstico marino: parámetros básicos en rango, pero el filtro sigue en el ciclado educativo (${Math.round((this.state.cicloBiologico?.horas || 0) / 72 * 100)}%). No agregues habitantes todavía. En la realidad confirma el ciclado con pruebas de amonio y nitrito en cero.`;
      if (this.activeMode === 'marino') return 'Diagnóstico marino: parámetros dentro de los rangos de aprendizaje y sin alertas. ppt mide salinidad; dKH, la capacidad de amortiguar cambios de pH; ppm, concentración de calcio. Mide antes de dosificar. El diagnóstico de la simulación no reemplaza pruebas reales.';
      return 'Diagnostico: el agua esta estable. No hay alertas activas ni necesitas un cambio de agua ahora.';
    }
    return `Diagnostico: ${alerts.map((alert) => alert.texto).join(' ')}`;
  }

  getLearningTip() {
    if (this.activeMode !== 'marino') {
      const freshWater = this.state.calidadAgua;
      if (freshWater.amonio >= 15) return 'Aprendizaje de agua dulce — Amonio: los desechos y la comida sobrante pueden elevarlo. Es tóxico; reduce comida, evita agregar animales y revisa filtro y cambios parciales.';
      if (freshWater.nitritos >= 8) return 'Aprendizaje de agua dulce — Nitrito: aparece al procesarse el amonio y también es tóxico. No introduzcas animales; revisa el filtro biológico y diagnostica el agua.';
      if (freshWater.nitratos >= 30) return 'Aprendizaje de agua dulce — Nitrato: es el producto final del ciclo biológico. Si se acumula, un cambio parcial y las plantas ayudan a controlarlo.';
      return 'Agua dulce: aprende observando hambre, amonio, nitritos y nitratos. Pregunta “¿qué es el amonio?” o escribe “diagnostico”.';
    }
    const water = this.state.calidadAgua;
    if (!this.isMarineTankCycled()) {
      const progress = Math.round((this.state.cicloBiologico?.horas || 0) / (this.state.cicloBiologico?.horasNecesarias || 72) * 100);
      return `Aprendizaje marino — Filtro en ciclado didáctico: ${progress}%. Bacterias beneficiosas convierten amonio en nitrito y luego nitrato. No introduzcas animales todavía. Esta fase se comprime a 72 horas de juego; en la realidad hay que confirmar amonio y nitrito en cero con pruebas, porque esperar no basta.`;
    }
    if (water.salinidad < 33 || water.salinidad > 36) return water.salinidad > 36 ? 'Aprendizaje marino — Salinidad alta: la evaporación quita agua, no sal. Para compensarla, en un tanque real repón solo agua dulce purificada lentamente; reserva el agua salada preparada para cambios parciales.' : 'Aprendizaje marino — Salinidad baja: comprueba con un instrumento y corrige gradualmente usando agua salada preparada para acuarios marinos. No uses sal de mesa ni hagas cambios bruscos.';
    if (water.temperatura < 23 || water.temperatura > 27) return 'Aprendizaje marino — Temperatura: cambia gradualmente para no estresar peces y corales. Rango de aprendizaje: 23–27 °C; en la vida real usa termómetro y calentador confiables.';
    if (water.ph < 7.8 || water.ph > 8.4) return 'Aprendizaje marino — pH: el rango de esta simulación es 7.8–8.4. Confirma la medición y revisa primero la alcalinidad y el intercambio de gases; evita añadir correctores sin medir.';
    if (water.alcalinidad < 7 || water.alcalinidad > 10) return 'Aprendizaje marino — Alcalinidad (dKH): ayuda a amortiguar cambios de pH. Rango simplificado: 7–10 dKH. Mide antes de ajustar; agregar productos sin medir puede desestabilizar el arrecife.';
    if (water.calcio < 380 || water.calcio > 460) return 'Aprendizaje marino — Calcio (ppm): los corales duros lo usan para construir esqueleto. Rango de aprendizaje: 380–460 ppm. Un tanque nuevo sin corales normalmente no necesita suplemento.';
    if (this.state.peces.length === 0 && this.state.invertebrados.length === 0 && this.state.corales.length === 0) return 'Aprendizaje marino — Antes de poblar un acuario real, se cicla: bacterias beneficiosas colonizan el filtro y convierten amonio tóxico en nitrito y luego nitrato. Se confirma midiendo amonio y nitrito en cero de forma estable; no se logra solo esperando unos días. En esta simulación estudia salinidad, temperatura y equipo primero.';
    if (this.state.corales.length === 0) return 'Aprendizaje marino — El filtro terminó el ciclo simplificado. Antes de poblar un acuario real, confirma con pruebas amonio y nitrito en cero y añade pocos animales a la vez; el calendario por sí solo no demuestra que esté ciclado.';
    if (this.state.corales.some((coral) => coral.salud < 60 || coral.estres > 60)) return 'Aprendizaje marino — Un coral está estresado en la simulación. Revisa luz, circulación, salinidad, temperatura, pH, alcalinidad y calcio. Cambia una sola condición a la vez y observa la respuesta.';
    return 'Aprendizaje marino — Tus corales crecen solo cuando luz, circulación, salinidad, temperatura, pH, alcalinidad y calcio están estables. Cambia una cosa a la vez y observa sus respuestas.';
  }

  buildHelpMessage() {
    if (this.activeMode === 'marino') return 'Ayuda del acuario marino: catálogo jugable de pez payaso, gramma real, damisela azul y pez dardo de fuego; la damisela puede ser territorial y el pez dardo puede saltar. El cirujano azul es solo de estudio: requiere más espacio y se bloquea. Invertebrados: gamba limpiadora, cangrejo ermitaño (ofrece conchas vacías) y caracol turbo. Corales: zoántido, hongo, euphyllia y acropora; son animales y se agregan tras el ciclado y con agua estable. Usa menu, especies, inventario, ideas, estado y diagnostico. Pregunta por salinidad, evaporación, temperatura, pH, alcalinidad, calcio, circulación, skimmer, ciclado o crecimiento coralino. Los cambios parciales necesitan agua salada preparada; para evaporación se repone con agua dulce purificada. En acuarios reales mide antes de actuar y verifica amonio/nitrito antes de poblar.';
    return 'Ayuda del acuario dulce: usa especies, inventario, ideas, estado o diagnostico. Peces: neon, guppy, betta, molly, angel/escalar, cebra, corydora, platy, xipho, otocinclus, rasbora, tetra, ramirezi, gourami y ancistrus. Invertebrados: neritina, manzana, planorbis, gambas cherry/amano/fantasma. Plantas: anubia, ambulia, vallisneria; algas verde/filamentosa; maderas mopani/manzanita/spider/cholla/manglar. También puedes alimentar, limpiar, controlar luz y tiempo. El selector superior abre el arrecife; ambas partidas se guardan separadas.';
  }

  buildMasterMenuMessage() {
    if (this.activeMode === 'marino') return [
      'Menu del acuario marino:',
      'menu: muestra este menu; especies: catálogo exclusivo marino; inventario: habitantes y corales; estado/diagnostico: mediciones y consejos.',
      'Aprende preguntando: ¿qué es salinidad?, ¿qué significa dKH?, ¿qué es un skimmer?, ¿qué es el ciclado?',
      'Comandos: agrega un pez payaso; agrega coral hongo después del ciclado; enciende el skimmer; activa la circulación; repón evaporación; cambio de agua 10%; ¿cómo hago un cambio de agua?;',
      'Evaporación: repón evaporación simula la reposición con agua dulce purificada. Cambio parcial: prepara agua salada y escribe cambio de agua 10%.',
      'Si preguntas si hace falta un cambio, solo se consulta el diagnóstico; no cambia el agua. Dulce y marino guardan partidas independientes.'
    ].join(' ');
    return [
      'Menu maestro:',
      'menu/help: muestra este arbol.',
      'especies: lista peces, caracoles, gambas, plantas, algas y maderas disponibles.',
      'inventario/lista: muestra lo que vive en tu acuario por categoria.',
      'estado/agua: muestra calidad del agua.',
      'ideas: ejemplos de comandos.',
      'El selector superior cambia entre partidas dulce y marina sin mezclar sus habitantes ni inventarios.',
      'Comandos frecuentes: menu, especies, inventario, estado, ideas, diagnostico, alimentar, cambio de agua, agrega un...',
      'Agua dulce: peces, invertebrados, plantas, algas, maderas y sus ayudas. Marino: peces de arrecife, invertebrados, corales, salinidad, ciclado, skimmer y circulación. Usa el selector; las partidas nunca se mezclan.'
    ].join(' ');
  }

  buildSpeciesTreeMessage() {
    if (this.activeMode === 'marino') return [
      'Catálogo del arrecife marino (independiente del catálogo dulce):',
      'Peces disponibles: pez payaso, gramma real, damisela azul y pez dardo de fuego. Especie de estudio no disponible: cirujano azul, porque requiere mucho más espacio.',
      'Invertebrados: gamba limpiadora, cangrejo ermitaño, caracol turbo.',
      'Corales: zoántido, coral hongo, euphyllia y acropora. Son animales, no plantas.',
      `Progreso del filtro en el juego: ${this.state.cicloBiologico?.listo ? 'ciclado didáctico completado' : `${Math.round((this.state.cicloBiologico?.horas || 0) / (this.state.cicloBiologico?.horasNecesarias || 72) * 100)}%`}. Antes de agregar habitantes, usa diagnostico. En un acuario real confirma amonio y nitrito con pruebas; el tiempo de juego no sirve como prueba.`
    ].join(' ');
    return [
      'Especies disponibles:',
      `Peces de agua dulce: ${FRESHWATER_FISH.join(', ')}.`,
      'Caracoles: neritina, manzana, planorbis.',
      'Gambas: cherry, amano, fantasma.',
      'Plantas: anubia, ambulia, vallisneria.',
      'Algas: verde, filamentosa.',
      'Maderas: mopani, manzanita, spider, cholla, manglar.',
      'Alias: beta=betta, escalar/pez angel=angel, danio=cebra, oto=otocinclus, arlequin=rasbora, cardinal=tetra, pleco=ancistrus, raiz=manzanita, rama=manzanita.'
    ].join(' ');
  }

  buildIdeasMessage() {
    if (this.activeMode === 'marino') return [
      'Ideas y preguntas para el arrecife:',
      'diagnostico;',
      '¿qué es la salinidad?;',
      '¿qué significa alcalinidad?;',
      '¿qué es un skimmer?;',
      '¿cómo funciona el ciclado?;',
      '¿cómo repongo la evaporación?;',
      '¿cómo hago un cambio de agua?;',
      '¿por qué está estresado mi coral?;',
      'especies;',
      'inventario;',
      'agrega un pez payaso;',
      'agrega un coral hongo después del ciclado;',
      'enciende la circulacion;',
      'enciende el skimmer.'
    ].join(' ');
    return [
      'Ideas para el acuario dulce:',
      'menu;',
      'especies;',
      'inventario;',
      'estado;',
      'agrega un betta;',
      'compra dos mollys y un otocinclus;',
      'agrega gambas cherry;',
      'pon una vallisneria, alga verde y madera mopani;',
      'limpia el filtro;',
      'apaga la luz;',
      'alimenta el acuario;',
      'limpia los muertos;',
      'pon el tiempo rapido;',
      'como esta la calidad del agua;',
      '¿que significa el amonio?'
    ].join(' ');
  }

  buildInventoryMessage() {
    const fish = this.countBy(this.state.peces, (item) => item.tipo, (item) => item.vivo);
    const deadFish = this.countBy(this.state.peces, (item) => item.tipo, (item) => !item.vivo);
    const snails = this.countBy(this.state.invertebrados, (item) => item.especie, (item) => item.vivo && item.grupo === 'caracol');
    const shrimp = this.countBy(this.state.invertebrados, (item) => item.especie, (item) => item.vivo && item.grupo === 'gamba');
    const plants = this.countBy(this.state.plantas, (item) => item.especie);
    const algae = this.countBy(this.state.algas, (item) => item.especie);
    const woods = this.countBy(this.state.maderas, (item) => item.especie);

    if (this.activeMode === 'marino') {
      const corals = this.countBy(this.state.corales || [], (item) => item.especie);
      const crabs = this.countBy(this.state.invertebrados, (item) => item.especie, (item) => item.vivo && item.grupo === 'cangrejo');
      return `Inventario marino: peces vivos [${this.formatCounts(fish)}]; peces muertos [${this.formatCounts(deadFish)}]; invertebrados [${this.formatCounts({ ...snails, ...shrimp, ...crabs })}]; corales [${this.formatCounts(corals)}]. Los organismos del catálogo se separan del acuario dulce y nunca se mezclan.`;
    }

    return `Inventario de agua dulce: peces vivos [${this.formatCounts(fish)}]; peces muertos [${this.formatCounts(deadFish)}]; caracoles [${this.formatCounts(snails)}]; gambas [${this.formatCounts(shrimp)}]; plantas [${this.formatCounts(plants)}]; algas [${this.formatCounts(algae)}]; maderas [${this.formatCounts(woods)}]. Esta partida se conserva separada del arrecife marino.`;
  }

  resolveLocalCommand(message) {
    const text = String(message || '').trim().toLowerCase();
    const lesson = this.resolveLearningQuestion(text);
    if (lesson) return lesson;
    const asksWhetherToChangeWater = /\b(necesita|necesito|debo|conviene|hace falta|deberia|debería|tengo que)\b/.test(text) && /\b(cambio de agua|cambiar el agua|cambiar agua)\b/.test(text);
    if (asksWhetherToChangeWater) return this.buildDiagnosticMessage();
    if (/\b(como|cómo)\b/.test(text) && /\b(cambio de agua|cambiar el agua|cambiar agua)\b/.test(text)) return this.activeMode === 'marino'
      ? 'Para un cambio parcial marino prepara agua salada con mezcla específica para arrecife y ajústala a la temperatura y salinidad actuales. Escribe “cambio de agua 10%” para ejecutarlo en la simulación.'
      : 'Escribe “cambio de agua” para un 20%, o indica el porcentaje, por ejemplo “cambio de agua 30%”. En un acuario real acondiciona el agua nueva, iguala temperatura y evita reemplazarla toda de golpe.';
    if (text === 'ideas' || text === 'ejemplos' || text === 'sugerencias') return this.buildIdeasMessage();
    if (/^(menu|men[uú]|ayuda|help|\?|comandos)$/.test(text)) return this.buildMasterMenuMessage();
    if (/^(especies|catalogo|cat[aá]logo|disponibles)$/.test(text)) return this.buildSpeciesTreeMessage();
    if (/^(lista|inventario|habitantes|categorias|categor[ií]as)$/.test(text)) return this.buildInventoryMessage();
    if (/^(estado|agua|calidad)$/.test(text)) return this.buildWaterStatusMessage();
    if (/^(diagnostico|diagnóstico|alertas|alerta)$/.test(text)) return this.buildDiagnosticMessage();
    return null;
  }

  countBy(items, keySelector, predicate = () => true) {
    const counts = {};
    for (const item of items) {
      if (!predicate(item)) continue;
      const key = keySelector(item);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }

  formatCounts(counts) {
    const entries = Object.entries(counts);
    if (entries.length === 0) return 'ninguno';
    return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
  }

  normalizeState() {
    this.state.peces = Array.isArray(this.state.peces) ? this.state.peces : [];
    this.state.invertebrados = Array.isArray(this.state.invertebrados) ? this.state.invertebrados : [];
    this.state.plantas = Array.isArray(this.state.plantas) ? this.state.plantas : [];
    this.state.algas = Array.isArray(this.state.algas) ? this.state.algas : [];
    this.state.corales = Array.isArray(this.state.corales) ? this.state.corales : [];
    if (this.activeMode === 'marino') this.state.cicloBiologico = {
      horas: 0, horasNecesarias: 72, listo: false, ...(this.state.cicloBiologico || {})
    };
    this.state.maderas = Array.isArray(this.state.maderas) ? this.state.maderas : [];
    this.state.comida = Array.isArray(this.state.comida) ? this.state.comida : [];
    this.state.mensajes = Array.isArray(this.state.mensajes) ? this.state.mensajes : [];
    this.state.velocidadTiempo = TIME_SPEEDS[this.state.velocidadTiempo] !== undefined ? this.state.velocidadTiempo : 'normal';
    this.state.calidadAgua = {
      amonio: 0,
      nitritos: 0,
      nitratos: 8,
      oxigeno: 92,
      salud: 92,
      ph: 7.2,
      temperatura: this.activeMode === 'marino' ? 25 : 24,
      salinidad: this.activeMode === 'marino' ? 35 : 0,
      alcalinidad: this.activeMode === 'marino' ? 8.5 : 0,
      calcio: this.activeMode === 'marino' ? 420 : 0,
      ...(this.state.calidadAgua || {})
    };
    this.state.equipos = {
      filtroActivo: true,
      oxigenacionActiva: true,
      filtroNivel: 100,
      filtroCarga: 0,
      skimmerActivo: this.activeMode === 'marino',
      circulacionActiva: this.activeMode === 'marino',
      ...(this.state.equipos || {})
    };
    this.state.reproduccion = this.state.reproduccion || {};
    this.state.huevos = Array.isArray(this.state.huevos) ? this.state.huevos : [];
    this.state.luzActiva = this.state.luzActiva !== false;
    this.lastAlertSignature = null;
    this.state.peces = this.state.peces.filter((fish) => FISH_DEFS[fish.tipo]);
    this.state.invertebrados = this.state.invertebrados.filter((animal) => INVERTEBRATE_DEFS[animal.especie]);
    this.state.peces.forEach((fish, index) => { fish.sexo = fish.sexo || chooseSex(fish.tipo, index); });
    this.state.invertebrados.forEach((animal, index) => { animal.sexo = animal.sexo || chooseSex(animal.especie, index); });
    this.state.plantas = this.state.plantas.filter((plant) => PLANT_DEFS[plant.especie]);
    this.state.algas = this.state.algas.filter((algae) => ALGAE_DEFS[algae.especie]);
    this.state.maderas = this.state.maderas.filter((wood) => WOOD_DEFS[wood.especie]);
    this.state.corales = this.activeMode === 'marino' ? this.state.corales.filter((coral) => CORAL_DEFS[coral.especie]) : [];
    const allowedFish = this.activeMode === 'marino' ? MARINE_FISH : FRESHWATER_FISH;
    const allowedInvertebrates = this.activeMode === 'marino' ? MARINE_INVERTEBRATES : FRESHWATER_INVERTEBRATES;
    this.state.peces = this.state.peces.filter((fish) => allowedFish.includes(fish.tipo));
    this.state.invertebrados = this.state.invertebrados.filter((animal) => allowedInvertebrates.includes(animal.especie));
    if (this.activeMode === 'marino') {
      this.state.plantas = [];
      this.state.algas = [];
      this.state.maderas = [];
    } else {
      this.state.corales = [];
    }
    this.state.equipos.filtroNivel = clamp(this.state.equipos.filtroNivel ?? 100, 0, 100);
    this.state.equipos.filtroCarga = clamp(this.state.equipos.filtroCarga ?? 0, 0, 100);
    this.state.peces.forEach((fish) => { fish.salud = fish.salud ?? 100; fish.estres = fish.estres ?? 0; fish.esCria = fish.esCria ?? false; });
    this.state.invertebrados.forEach((animal) => { animal.salud = animal.salud ?? 100; animal.estres = animal.estres ?? 0; animal.esCria = animal.esCria ?? false; });
    this.state.comida = this.state.comida.filter((food) => Number.isFinite(food.x) && Number.isFinite(food.y));
  }

  emitUpdate() {
    this.emit('update', this.getPublicState());
  }
}

import { EventEmitter } from 'node:events';
import { loadState, saveState } from './persistence.js';

const TICK_MS = Number(process.env.TICK_MS ?? 1000);
const REAL_SECONDS_PER_GAME_HOUR = Number(process.env.REAL_SECONDS_PER_GAME_HOUR ?? 60);
const SAVE_EVERY_MS = Number(process.env.SAVE_EVERY_MS ?? 5000);
const HUNGER_RATE_MULTIPLIER = Number(process.env.HUNGER_RATE_MULTIPLIER ?? 0.35);
const STARVATION_GRACE_HOURS = Number(process.env.STARVATION_GRACE_HOURS ?? 10);
const SCHOOLING_SPECIES = ['neon', 'cebra', 'rasbora', 'tetra'];
const SEXED_REPRODUCTION = ['guppy', 'cherry'];
const DAY_LENGTH_HOURS = 24;

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

const TIME_SPEEDS = {
  pausado: 0,
  lento: 0.5,
  normal: 1,
  rapido: 4,
  muy_rapido: 10
};

function createDefaultState() {
  return {
    version: 5,
    ancho: 960,
    alto: 620,
    horasJuego: 0,
    nutrientes: 12,
    peces: [],
    invertebrados: [],
    plantas: [],
    algas: [],
    maderas: [],
    comida: [],
    velocidadTiempo: 'normal',
    calidadAgua: {
      amonio: 0,
      nitritos: 0,
      nitratos: 8,
      oxigeno: 92,
      salud: 92,
      ph: 7.2
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
    this.interval = null;
    this.saveInterval = null;
  }

  async init() {
    this.state = await loadState(createDefaultState());
    this.normalizeState();
    await saveState(this.state);
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
    return {
      ...this.state,
      alertas: this.getWaterAlerts(),
      especies: {
        peces: Object.keys(FISH_DEFS),
        caracoles: Object.entries(INVERTEBRATE_DEFS).filter(([, def]) => def.grupo === 'caracol').map(([key]) => key),
        gambas: Object.entries(INVERTEBRATE_DEFS).filter(([, def]) => def.grupo === 'gamba').map(([key]) => key),
        plantas: Object.keys(PLANT_DEFS),
        algas: Object.keys(ALGAE_DEFS),
        maderas: Object.keys(WOOD_DEFS)
      },
      config: {
        realSecondsPerGameHour: REAL_SECONDS_PER_GAME_HOUR,
        tickMs: TICK_MS,
        fase: this.getDayPhase()
      }
    };
  }

  async persist() {
    await saveState(this.state);
  }

  addChatMessage(autor, texto) {
    this.state.mensajes.push({ autor, texto, fecha: new Date().toISOString() });
    this.state.mensajes = this.state.mensajes.slice(-80);
  }

  resolveLocalCommand(message) {
    const text = String(message || '').trim().toLowerCase();
    if (/^(menu|men[uú]|ayuda|help|\?|comandos)$/.test(text)) return this.buildMasterMenuMessage();
    if (/^(especies|catalogo|cat[aá]logo|disponibles)$/.test(text)) return this.buildSpeciesTreeMessage();
    if (/^(ideas|ejemplos|sugerencias)$/.test(text)) return this.buildIdeasMessage();
    if (/^(lista|inventario|habitantes|categorias|categor[ií]as)$/.test(text)) return this.buildInventoryMessage();
    if (/^(estado|agua|calidad)$/.test(text)) return this.buildWaterStatusMessage();
    if (/^(diagnostico|diagnóstico|alertas|alerta)$/.test(text)) return this.buildDiagnosticMessage();
    return null;
  }

  applyActions(actions = []) {
    const summary = [];

    for (const action of actions) {
      const cantidad = clamp(Number(action.cantidad || 1), 1, 20);

      if (action.tipo === 'COMPRAR_PEZ' && FISH_DEFS[action.especie]) {
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
        for (let i = 0; i < cantidad; i += 1) {
          this.state.plantas.push(createPlant(action.especie));
        }
        summary.push(`${cantidad} planta(s) ${action.especie}`);
      }

      if (action.tipo === 'COMPRAR_INVERTEBRADO' && INVERTEBRATE_DEFS[action.especie]) {
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
        for (let i = 0; i < cantidad; i += 1) {
          this.state.algas.push(createAlgae(action.especie));
        }
        summary.push(`${cantidad} alga(s) ${action.especie}`);
      }

      if (action.tipo === 'AGREGAR_MADERA' && WOOD_DEFS[action.especie]) {
        for (let i = 0; i < cantidad; i += 1) {
          this.state.maderas.push(createWood(action.especie));
        }
        summary.push(`${cantidad} madera(s) ${action.especie}`);
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
    this.updateFood(TICK_MS / 1000);
    this.updateFish(gameHours, TICK_MS / 1000);
    this.updateInvertebrates(gameHours, TICK_MS / 1000);
    this.updatePlants(gameHours);
    this.updateAlgae(gameHours);
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
    const aliveAnimals = this.state.peces.filter((fish) => fish.vivo).length + this.state.invertebrados.filter((animal) => animal.vivo).length;
    const deadAnimals = this.state.peces.filter((fish) => !fish.vivo).length + this.state.invertebrados.filter((animal) => !animal.vivo).length;
    const plants = this.state.plantas.length + this.state.algas.length;
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

    const woodTannins = this.state.maderas.reduce((total, wood) => total + (wood.tannins || 0), 0);
    quality.ph = clamp((quality.ph || 7.2) - woodTannins * 0.002 * gameHours, 5.5, 8.5);
    quality.salud = clamp(100 - quality.amonio * 1.6 - quality.nitritos * 1.3 - Math.max(0, quality.nitratos - 35) * 0.45 - Math.max(0, 70 - quality.oxigeno) * 1.1, 0, 100);
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
    water.salud = clamp(100 - water.amonio * 1.6 - water.nitritos * 1.3 - Math.max(0, water.nitratos - 35) * 0.45 - Math.max(0, 70 - water.oxigeno) * 1.1, 0, 100);
  }

  getDayPhase() {
    return (this.state.horasJuego % DAY_LENGTH_HOURS) < 12 ? 'dia' : 'noche';
  }

  getWaterAlerts() {
    const water = this.state.calidadAgua;
    const alerts = [];
    if (water.amonio >= 25) alerts.push({ tipo: 'amonio', severidad: 'alta', texto: 'El amonio esta elevado: haz un cambio de agua y reduce la comida.' });
    if (water.nitritos >= 15) alerts.push({ tipo: 'nitritos', severidad: 'alta', texto: 'Los nitritos estan elevados: revisa el filtro y cambia agua.' });
    if (water.nitratos >= 40) alerts.push({ tipo: 'nitratos', severidad: 'media', texto: 'Los nitratos estan altos: conviene cambiar agua y revisar las algas.' });
    if (water.oxigeno < 60) alerts.push({ tipo: 'oxigeno', severidad: 'alta', texto: 'El oxigeno esta bajo: activa la oxigenacion.' });
    if (water.salud < 55) alerts.push({ tipo: 'salud', severidad: 'alta', texto: 'La salud del agua es baja: evita introducir animales nuevos.' });
    if ((this.state.equipos.filtroNivel ?? 100) < 25) alerts.push({ tipo: 'filtro', severidad: 'alta', texto: 'El filtro esta degradado: usa "limpia el filtro".' });
    return alerts;
  }

  hasNearbyPredator(animal) {
    return this.state.peces.some((fish) => fish.vivo && ['betta', 'angel'].includes(fish.tipo) && Math.hypot(fish.x - animal.x, fish.y - animal.y) < 240);
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

      if (animal.grupo === 'gamba' && this.hasNearbyPredator(animal)) {
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

    if (plantBiofilmAvailable) {
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
    if (this.totalAnimals() + amount > 45) {
      return { ok: false, message: 'No se agrego: el acuario ya esta cerca de su limite biologico.' };
    }
    if (this.state.calidadAgua.salud < 35) {
      return { ok: false, message: 'No se agrego: la calidad del agua es baja; estabiliza el acuario primero.' };
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
    return `Agua: salud ${Math.round(water.salud)}%, pH ${(water.ph || 7.2).toFixed(2)}, amonio ${Math.round(water.amonio)}%, nitritos ${Math.round(water.nitritos)}%, nitratos ${Math.round(water.nitratos)}%, oxigeno ${Math.round(water.oxigeno)}%. Fase: ${this.getDayPhase()}.${alertText}`;
  }

  buildDiagnosticMessage() {
    const alerts = this.getWaterAlerts();
    if (alerts.length === 0) return 'Diagnostico: el agua esta estable. No hay alertas activas ni necesitas un cambio de agua ahora.';
    return `Diagnostico: ${alerts.map((alert) => alert.texto).join(' ')}`;
  }

  buildHelpMessage() {
    return 'Ayuda: lista o inventario para ver habitantes por categoria. Peces: neon, guppy, betta, molly, angel/escalar, cebra, corydora, platy, xipho, otocinclus, rasbora, tetra, ramirezi, gourami y ancistrus. Invertebrados: caracoles neritina/manzana/planorbis y gambas cherry/amano/fantasma. Flora: plantas anubia/ambulia/vallisneria, algas verde/filamentosa y maderas mopani/manzanita/spider/cholla/manglar. Ecosistema: alimenta, limpia muertos, limpia el filtro, enciende/apaga la luz, calidad del agua, pausa, tiempo rapido/muy rapido/lento/normal.';
  }

  buildMasterMenuMessage() {
    return [
      'Menu maestro:',
      'menu/help: muestra este arbol.',
      'especies: lista peces, caracoles, gambas, plantas, algas y maderas disponibles.',
      'inventario/lista: muestra lo que vive en tu acuario por categoria.',
      'estado/agua: muestra calidad del agua.',
      'ideas: ejemplos de comandos.',
      'Comandos frecuentes: menu, especies, inventario, estado, ideas, alimentar, agrega un...',
      'Acciones: alimentar, limpiar muertos, limpiar/mejorar filtro, controlar luz, cambiar tiempo, comprar animales, agregar plantas, algas o maderas.'
    ].join(' ');
  }

  buildSpeciesTreeMessage() {
    return [
      'Especies disponibles:',
      `Peces: ${Object.keys(FISH_DEFS).join(', ')}.`,
      'Caracoles: neritina, manzana, planorbis.',
      'Gambas: cherry, amano, fantasma.',
      'Plantas: anubia, ambulia, vallisneria.',
      'Algas: verde, filamentosa.',
      'Maderas: mopani, manzanita, spider, cholla, manglar.',
      'Alias: beta=betta, escalar/pez angel=angel, danio=cebra, oto=otocinclus, arlequin=rasbora, cardinal=tetra, pleco=ancistrus, raiz=manzanita, rama=manzanita.'
    ].join(' ');
  }

  buildIdeasMessage() {
    return [
      'Ideas:',
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
      'como esta la calidad del agua.'
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

    return `Habitantes: peces vivos [${this.formatCounts(fish)}]; peces muertos [${this.formatCounts(deadFish)}]; caracoles [${this.formatCounts(snails)}]; gambas [${this.formatCounts(shrimp)}]; plantas [${this.formatCounts(plants)}]; algas [${this.formatCounts(algae)}]; maderas [${this.formatCounts(woods)}].`;
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
    this.state.invertebrados = Array.isArray(this.state.invertebrados) ? this.state.invertebrados : [];
    this.state.algas = Array.isArray(this.state.algas) ? this.state.algas : [];
    this.state.maderas = Array.isArray(this.state.maderas) ? this.state.maderas : [];
    this.state.velocidadTiempo = TIME_SPEEDS[this.state.velocidadTiempo] !== undefined ? this.state.velocidadTiempo : 'normal';
    this.state.calidadAgua = {
      amonio: 0,
      nitritos: 0,
      nitratos: 8,
      oxigeno: 92,
      salud: 92,
      ph: 7.2,
      ...(this.state.calidadAgua || {})
    };
    this.state.equipos = {
      filtroActivo: true,
      oxigenacionActiva: true,
      filtroNivel: 100,
      filtroCarga: 0,
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

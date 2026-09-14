import { EventEmitter } from 'node:events';
import { loadState, saveState } from './persistence.js';

const TICK_MS = Number(process.env.TICK_MS ?? 1000);
const REAL_SECONDS_PER_GAME_HOUR = Number(process.env.REAL_SECONDS_PER_GAME_HOUR ?? 60);
const SAVE_EVERY_MS = Number(process.env.SAVE_EVERY_MS ?? 5000);

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

const TIME_SPEEDS = {
  pausado: 0,
  lento: 0.5,
  normal: 1,
  rapido: 4,
  muy_rapido: 10
};

function createDefaultState() {
  return {
    version: 3,
    ancho: 960,
    alto: 620,
    horasJuego: 0,
    nutrientes: 12,
    peces: [],
    invertebrados: [],
    plantas: [],
    algas: [],
    comida: [],
    velocidadTiempo: 'normal',
    calidadAgua: {
      amonio: 0,
      nitritos: 0,
      nitratos: 8,
      oxigeno: 92,
      salud: 92
    },
    equipos: {
      filtroActivo: true,
      oxigenacionActiva: true
    },
    reproduccion: {},
    mensajes: [
      {
        autor: 'sistema',
        texto: 'Acuario de agua dulce listo. Pide peces, caracoles, gambas, plantas, comida o limpieza desde el chat.',
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

function createFish(tipo) {
  const def = FISH_DEFS[tipo];
  return {
    id: id('pez'),
    tipo,
    nombre: def.nombre,
    latin: def.latin,
    edadEnHoras: 0,
    escala: 0.45,
    hambre: 8,
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
    altura: randomBetween(18, 28),
    x: randomBetween(80, 880),
    y: 560,
    color: def.color
  };
}

function createInvertebrate(especie) {
  const def = INVERTEBRATE_DEFS[especie];
  return {
    id: id(def.grupo),
    especie,
    grupo: def.grupo,
    nombre: def.nombre,
    latin: def.latin,
    edadEnHoras: 0,
    escala: 0.45,
    hambre: 6,
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

function createFood(amount = 8) {
  return Array.from({ length: clamp(amount, 1, 40) }, () => ({
    id: id('comida'),
    x: randomBetween(60, 900),
    y: randomBetween(26, 70),
    vy: randomBetween(18, 32),
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
      especies: {
        peces: Object.keys(FISH_DEFS),
        caracoles: Object.entries(INVERTEBRATE_DEFS).filter(([, def]) => def.grupo === 'caracol').map(([key]) => key),
        gambas: Object.entries(INVERTEBRATE_DEFS).filter(([, def]) => def.grupo === 'gamba').map(([key]) => key),
        plantas: Object.keys(PLANT_DEFS),
        algas: Object.keys(ALGAE_DEFS)
      },
      config: {
        realSecondsPerGameHour: REAL_SECONDS_PER_GAME_HOUR,
        tickMs: TICK_MS
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
          this.state.peces.push(createFish(action.especie));
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
          this.state.invertebrados.push(createInvertebrate(action.especie));
        }
        summary.push(`${cantidad} invertebrado(s) ${action.especie}`);
      }

      if (action.tipo === 'AGREGAR_ALGA' && ALGAE_DEFS[action.especie]) {
        for (let i = 0; i < cantidad; i += 1) {
          this.state.algas.push(createAlgae(action.especie));
        }
        summary.push(`${cantidad} alga(s) ${action.especie}`);
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

      if (action.tipo === 'CONSULTAR_ESTADO') {
        summary.push(this.buildWaterStatusMessage());
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
      fish.hambre = clamp(fish.hambre + def.hungerPerHour * gameHours, 0, 100);
      fish.escala = clamp(0.45 + (fish.edadEnHoras / def.growthHours) * (def.maxScale - 0.45), 0.45, def.maxScale);

      if (fish.hambre >= 100) {
        fish.vivo = false;
        fish.descomposicion = 0;
        fish.vx = randomBetween(-0.12, 0.12);
        fish.vy = randomBetween(0.6, 1);
        continue;
      }

      const targetFood = this.findNearestFood(fish);
      if (targetFood) {
        this.moveFishTowards(fish, targetFood, def.speed, deltaSeconds);
        if (Math.hypot(fish.x - targetFood.x, fish.y - targetFood.y) < 20 * fish.escala) {
          fish.hambre = 0;
          this.state.nutrientes = clamp(this.state.nutrientes + 0.6, 0, 100);
          this.state.comida = this.state.comida.filter((food) => food.id !== targetFood.id);
        }
      } else {
        this.wanderFish(fish, def.speed, deltaSeconds);
      }
    }
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

    if (this.state.equipos.filtroActivo) {
      const convertedAmmonia = Math.min(quality.amonio, 1.8 * gameHours);
      quality.amonio = clamp(quality.amonio - convertedAmmonia, 0, 100);
      quality.nitritos = clamp(quality.nitritos + convertedAmmonia * 0.6, 0, 100);

      const convertedNitrites = Math.min(quality.nitritos, 1.3 * gameHours);
      quality.nitritos = clamp(quality.nitritos - convertedNitrites, 0, 100);
      quality.nitratos = clamp(quality.nitratos + convertedNitrites * 0.85, 0, 100);
    }

    quality.nitratos = clamp(quality.nitratos - plants * 0.025 * gameHours, 0, 100);
    quality.oxigeno = clamp(
      quality.oxigeno + (this.state.equipos.oxigenacionActiva ? 2.2 : -1.2) * gameHours + this.state.plantas.length * 0.02 * gameHours - aliveAnimals * 0.035 * gameHours,
      0,
      100
    );

    quality.salud = clamp(100 - quality.amonio * 1.6 - quality.nitritos * 1.3 - Math.max(0, quality.nitratos - 35) * 0.45 - Math.max(0, 70 - quality.oxigeno) * 1.1, 0, 100);

    if (quality.salud < 25) {
      for (const fish of this.state.peces) {
        if (fish.vivo) fish.hambre = clamp(fish.hambre + 4 * gameHours, 0, 100);
      }
      for (const animal of this.state.invertebrados) {
        if (animal.vivo) animal.hambre = clamp(animal.hambre + 3 * gameHours, 0, 100);
      }
    }
  }

  updateReproduction() {
    if (!this.canReproduce()) return;
    this.tryReproduce('guppy', this.state.peces.filter((fish) => fish.vivo && fish.tipo === 'guppy'), () => this.state.peces.push(createFish('guppy')));
    this.tryReproduce('cherry', this.state.invertebrados.filter((animal) => animal.vivo && animal.especie === 'cherry'), () => this.state.invertebrados.push(createInvertebrate('cherry')));
    this.tryReproduce('planorbis', this.state.invertebrados.filter((animal) => animal.vivo && animal.especie === 'planorbis'), () => this.state.invertebrados.push(createInvertebrate('planorbis')));
  }

  canReproduce() {
    return this.state.calidadAgua.salud >= 72 && this.state.calidadAgua.oxigeno >= 70 && this.totalAnimals() < 45;
  }

  tryReproduce(key, candidates, createBaby) {
    if (candidates.length < 2) return;
    if (candidates.some((animal) => animal.hambre > 35 || animal.edadEnHoras < 24)) return;
    const lastBirth = this.state.reproduccion[key] || 0;
    if (this.state.horasJuego - lastBirth < 48) return;
    if (Math.random() > 0.025) return;
    createBaby();
    this.state.reproduccion[key] = this.state.horasJuego;
    this.addChatMessage('sistema', `Buenas condiciones: nacio una cria de ${key}.`);
  }

  updateInvertebrates(gameHours, deltaSeconds) {
    for (const animal of this.state.invertebrados) {
      if (!animal.vivo) continue;
      const def = INVERTEBRATE_DEFS[animal.especie];
      animal.edadEnHoras += gameHours;
      animal.hambre = clamp(animal.hambre + def.hungerPerHour * gameHours, 0, 100);
      animal.escala = clamp(0.45 + (animal.edadEnHoras / def.growthHours) * (def.maxScale - 0.45), 0.45, def.maxScale);

      if (animal.hambre >= 100) {
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
          this.state.nutrientes = clamp(this.state.nutrientes + 0.2 * gameHours, 0, 100);
        }
        continue;
      }

      const targetFood = this.findNearestFood(animal);
      if (targetFood) {
        this.moveBottomAnimalTowards(animal, targetFood, def.speed, deltaSeconds);
        if (Math.hypot(animal.x - targetFood.x, animal.y - targetFood.y) < 16 * animal.escala) {
          animal.hambre = 0;
          this.state.nutrientes = clamp(this.state.nutrientes + 0.35, 0, 100);
          this.state.comida = this.state.comida.filter((food) => food.id !== targetFood.id);
        }
      } else if (this.state.algas.length > 0) {
        const targetAlgae = this.findNearestAlgae(animal);
        this.moveBottomAnimalTowards(animal, targetAlgae, def.speed, deltaSeconds);
        if (Math.hypot(animal.x - targetAlgae.x, animal.y - targetAlgae.y) < 22 * animal.escala) {
          targetAlgae.tamano = clamp(targetAlgae.tamano - 8 * gameHours, 0, targetAlgae.tamano);
          animal.hambre = clamp(animal.hambre - 10 * gameHours, 0, 100);
          this.state.algas = this.state.algas.filter((algae) => algae.tamano > 4);
        }
      } else {
        this.wanderBottomAnimal(animal, def.speed, deltaSeconds);
      }
    }

    this.removeConsumedCorpses();
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
      if (aliveFishTypes.includes('neon') || smallShrimpPresent) {
        return { ok: false, message: 'No se agrego: el pez angel adulto puede depredar neones o gambas pequenas.' };
      }
    }

    if ((species === 'neon' || ['cherry', 'fantasma'].includes(species)) && aliveFishTypes.includes('angel')) {
      return { ok: false, message: 'No se agrego: ya hay pez angel y podria depredar neones o gambas pequenas.' };
    }

    return { ok: true, message: 'compatible' };
  }

  buildWaterStatusMessage() {
    const water = this.state.calidadAgua;
    return `Agua: salud ${Math.round(water.salud)}%, amonio ${Math.round(water.amonio)}%, nitritos ${Math.round(water.nitritos)}%, nitratos ${Math.round(water.nitratos)}%, oxigeno ${Math.round(water.oxigeno)}%.`;
  }

  buildHelpMessage() {
    return 'Ayuda: lista o inventario para ver habitantes por categoria. Peces: neon, guppy, betta, molly, angel/escalar, cebra, corydora, platy, xipho, otocinclus. Invertebrados: caracoles neritina/manzana/planorbis y gambas cherry/amano/fantasma. Flora: plantas anubia/ambulia y algas verde/filamentosa. Ecosistema: alimenta, limpia muertos, calidad del agua, pausa, tiempo rapido/muy rapido/lento/normal.';
  }

  buildMasterMenuMessage() {
    return [
      'Menu maestro:',
      'menu/help: muestra este arbol.',
      'especies: lista peces, caracoles, gambas, plantas y algas disponibles.',
      'inventario/lista: muestra lo que vive en tu acuario por categoria.',
      'estado/agua: muestra calidad del agua.',
      'ideas: ejemplos de comandos.',
      'Acciones: alimentar, limpiar muertos, cambiar tiempo, comprar animales, agregar plantas o algas.'
    ].join(' ');
  }

  buildSpeciesTreeMessage() {
    return [
      'Especies disponibles:',
      `Peces: ${Object.keys(FISH_DEFS).join(', ')}.`,
      'Caracoles: neritina, manzana, planorbis.',
      'Gambas: cherry, amano, fantasma.',
      'Plantas: anubia, ambulia.',
      'Algas: verde, filamentosa.',
      'Alias: beta=betta, escalar/pez angel=angel, danio=cebra, oto=otocinclus.'
    ].join(' ');
  }

  buildIdeasMessage() {
    return [
      'Ideas:',
      'agrega un betta;',
      'compra dos mollys y un otocinclus;',
      'agrega gambas cherry;',
      'pon una anubia y alga verde;',
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

    return `Habitantes: peces vivos [${this.formatCounts(fish)}]; peces muertos [${this.formatCounts(deadFish)}]; caracoles [${this.formatCounts(snails)}]; gambas [${this.formatCounts(shrimp)}]; plantas [${this.formatCounts(plants)}]; algas [${this.formatCounts(algae)}].`;
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
    this.state.velocidadTiempo = TIME_SPEEDS[this.state.velocidadTiempo] !== undefined ? this.state.velocidadTiempo : 'normal';
    this.state.calidadAgua = {
      amonio: 0,
      nitritos: 0,
      nitratos: 8,
      oxigeno: 92,
      salud: 92,
      ...(this.state.calidadAgua || {})
    };
    this.state.equipos = {
      filtroActivo: true,
      oxigenacionActiva: true,
      ...(this.state.equipos || {})
    };
    this.state.reproduccion = this.state.reproduccion || {};
    this.state.peces = this.state.peces.filter((fish) => FISH_DEFS[fish.tipo]);
    this.state.invertebrados = this.state.invertebrados.filter((animal) => INVERTEBRATE_DEFS[animal.especie]);
    this.state.plantas = this.state.plantas.filter((plant) => PLANT_DEFS[plant.especie]);
    this.state.algas = this.state.algas.filter((algae) => ALGAE_DEFS[algae.especie]);
    this.state.comida = this.state.comida.filter((food) => Number.isFinite(food.x) && Number.isFinite(food.y));
  }

  emitUpdate() {
    this.emit('update', this.getPublicState());
  }
}

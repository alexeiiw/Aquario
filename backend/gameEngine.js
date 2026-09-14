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

function createDefaultState() {
  return {
    version: 2,
    ancho: 960,
    alto: 620,
    horasJuego: 0,
    nutrientes: 12,
    peces: [],
    invertebrados: [],
    plantas: [],
    comida: [],
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
        plantas: Object.keys(PLANT_DEFS)
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

  applyActions(actions = []) {
    const summary = [];

    for (const action of actions) {
      const cantidad = clamp(Number(action.cantidad || 1), 1, 20);

      if (action.tipo === 'COMPRAR_PEZ' && FISH_DEFS[action.especie]) {
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
        for (let i = 0; i < cantidad; i += 1) {
          this.state.invertebrados.push(createInvertebrate(action.especie));
        }
        summary.push(`${cantidad} invertebrado(s) ${action.especie}`);
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
    }

    if (summary.length > 0) {
      this.emitUpdate();
      this.persist().catch(console.error);
    }

    return summary;
  }

  tick() {
    const gameHours = (TICK_MS / 1000) / REAL_SECONDS_PER_GAME_HOUR;
    this.state.horasJuego += gameHours;
    this.updateFood(TICK_MS / 1000);
    this.updateFish(gameHours, TICK_MS / 1000);
    this.updateInvertebrates(gameHours, TICK_MS / 1000);
    this.updatePlants(gameHours);
    this.state.ultimaActualizacion = new Date().toISOString();
    this.emitUpdate();
  }

  updateFood(deltaSeconds) {
    for (const food of this.state.comida) {
      food.y += food.vy * deltaSeconds;
      if (food.y > 545) {
        this.state.nutrientes = clamp(this.state.nutrientes + food.nutrientes, 0, 100);
      }
    }
    this.state.comida = this.state.comida.filter((food) => food.y <= 545);
  }

  updateFish(gameHours, deltaSeconds) {
    for (const fish of this.state.peces) {
      if (!fish.vivo) continue;
      const def = FISH_DEFS[fish.tipo];
      fish.edadEnHoras += gameHours;
      fish.hambre = clamp(fish.hambre + def.hungerPerHour * gameHours, 0, 100);
      fish.escala = clamp(0.45 + (fish.edadEnHoras / def.growthHours) * (def.maxScale - 0.45), 0.45, def.maxScale);

      if (fish.hambre >= 100) {
        fish.vivo = false;
        fish.descomposicion = 0;
        fish.vy = -0.15;
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

  updatePlants(gameHours) {
    for (const plant of this.state.plantas) {
      const def = PLANT_DEFS[plant.especie];
      plant.edadEnHoras += gameHours;
      if (this.state.nutrientes > 0.5) {
        plant.altura = clamp(plant.altura + def.growthPerHour * gameHours, 10, def.maxHeight);
        this.state.nutrientes = clamp(this.state.nutrientes - def.nutrientUse * gameHours, 0, 100);
      }
    }
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

  normalizeState() {
    this.state.invertebrados = Array.isArray(this.state.invertebrados) ? this.state.invertebrados : [];
    this.state.peces = this.state.peces.filter((fish) => FISH_DEFS[fish.tipo]);
    this.state.invertebrados = this.state.invertebrados.filter((animal) => INVERTEBRATE_DEFS[animal.especie]);
    this.state.plantas = this.state.plantas.filter((plant) => PLANT_DEFS[plant.especie]);
    this.state.comida = this.state.comida.filter((food) => Number.isFinite(food.x) && Number.isFinite(food.y));
  }

  emitUpdate() {
    this.emit('update', this.getPublicState());
  }
}

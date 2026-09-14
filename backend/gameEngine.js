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
    version: 1,
    ancho: 960,
    alto: 620,
    horasJuego: 0,
    nutrientes: 12,
    peces: [],
    plantas: [],
    comida: [],
    mensajes: [
      {
        autor: 'sistema',
        texto: 'Acuario listo. Pide peces, plantas o comida desde el chat.',
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

      if (action.tipo === 'ALIMENTAR') {
        this.state.comida.push(...createFood(cantidad * 8));
        this.state.nutrientes = clamp(this.state.nutrientes + cantidad * 0.8, 0, 100);
        summary.push(`${cantidad} racion(es) de comida`);
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

  keepFishInside(fish) {
    if (fish.x < 34 || fish.x > this.state.ancho - 34) fish.vx *= -1;
    if (fish.y < 76 || fish.y > this.state.alto - 98) fish.vy *= -1;
    fish.x = clamp(fish.x, 34, this.state.ancho - 34);
    fish.y = clamp(fish.y, 76, this.state.alto - 98);
  }

  normalizeState() {
    this.state.peces = this.state.peces.filter((fish) => FISH_DEFS[fish.tipo]);
    this.state.plantas = this.state.plantas.filter((plant) => PLANT_DEFS[plant.especie]);
    this.state.comida = this.state.comida.filter((food) => Number.isFinite(food.x) && Number.isFinite(food.y));
  }

  emitUpdate() {
    this.emit('update', this.getPublicState());
  }
}

const validFish = ['neon', 'guppy', 'betta', 'molly', 'angel', 'cebra', 'corydora', 'platy', 'xipho', 'otocinclus'];
const validInvertebrates = ['neritina', 'manzana', 'planorbis', 'cherry', 'amano', 'fantasma'];
const validPlants = ['anubia', 'ambulia'];
const validAlgae = ['verde', 'filamentosa'];

export function interpretUserMessage(message) {
  return parseLocalMessage(message);
}

function parseLocalMessage(message) {
  const text = normalizeText(message);
  const actions = [];

  if (/\b(aliment|comid|dar de comer)\b/.test(text)) actions.push({ tipo: 'ALIMENTAR', cantidad: findQuantity(text) });
  if (/\b(limpi|retir|sac|elimin)\w*\b.*\b(muert|cadaver)\w*\b/.test(text)) actions.push({ tipo: 'LIMPIAR_MUERTOS', cantidad: 1 });
  if (/\b(agua|calidad|amonio|nitrito|nitrato|oxigen)\w*\b/.test(text) && /\b(como|revisa|ver|consulta|estado)\b/.test(text)) actions.push({ tipo: 'CONSULTAR_ESTADO', cantidad: 1 });

  const speed = findSpeed(text);
  if (speed) actions.push({ tipo: 'CAMBIAR_TIEMPO', velocidad: speed, cantidad: 1 });

  addSpeciesActions(actions, text, validFish, 'COMPRAR_PEZ', normalizeFishSpecies);
  addSpeciesActions(actions, text, validInvertebrates, 'COMPRAR_INVERTEBRADO');
  addSpeciesActions(actions, text, validPlants, 'AGREGAR_PLANTA');
  addSpeciesActions(actions, text, validAlgae, 'AGREGAR_ALGA');

  if (actions.length > 0) return { acciones: actions, respuesta_chat: buildResponse(actions) };
  if (/\b(agrega|anade|pon|compra|quiero|dame)\b/.test(text)) {
    return clarification('¿Qué deseas agregar y en qué cantidad? Puedes indicar, por ejemplo: “agrega dos neones”.');
  }
  if (/\b(tiempo|velocidad|rapido|lento|pausa)\b/.test(text)) {
    return clarification('¿Qué velocidad deseas? Opciones: pausado, lento, normal, rapido o muy rapido.');
  }
  return {
    acciones: [],
    respuesta_chat: 'No identifique una accion. Puedes pedir peces, invertebrados, plantas, algas, alimento, limpieza, estado del agua o velocidad. Escribe “menu” para ver ejemplos.'
  };
}

function addSpeciesActions(actions, text, species, type, normalize = (value) => value) {
  for (const item of species) {
    const aliases = speciesAliases(item);
    const match = aliases.find((alias) => new RegExp(`\\b${alias}\\b`, 'i').test(text));
    if (!match) continue;
    const before = text.slice(Math.max(0, text.indexOf(match) - 24), text.indexOf(match));
    actions.push({ tipo: type, especie: normalize(item), cantidad: findQuantity(before || text) });
  }
}

function speciesAliases(species) {
  const aliases = {
    neon: ['neon', 'neones'], guppy: ['guppy', 'gupi'], betta: ['betta', 'beta'],
    angel: ['angel', 'angeles', 'escalar'], cebra: ['cebra', 'cebras', 'danio', 'danios'],
    corydora: ['corydora', 'corydoras', 'cory'], molly: ['molly', 'mollies', 'mollys'],
    platy: ['platy', 'platys'], xipho: ['xipho', 'xiphos', 'espada'],
    otocinclus: ['otocinclus', 'otos', 'oto'], cherry: ['cherry', 'cherrys', 'cereza'],
    fantasma: ['fantasma', 'fantasmas', 'ghost'], neritina: ['neritina', 'neritinas'],
    manzana: ['manzana', 'manzanas'], planorbis: ['planorbis'], amano: ['amano', 'amanos'],
    anubia: ['anubia', 'anubias'], ambulia: ['ambulia', 'ambulias'],
    filamentosa: ['filamentosa', 'filamentosas', 'filament'], verde: ['verde', 'verdes']
  };
  return aliases[species] || [species];
}

function clarification(text) {
  return { acciones: [], respuesta_chat: text };
}

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function findSpeed(text) {
  if (/\b(pausa|pausado|deten|detener)\w*/.test(text)) return 'pausado';
  if (/\b(muy rapido|super rapido|maxima)\b/.test(text)) return 'muy_rapido';
  if (/\b(rapido|acelera)\w*/.test(text)) return 'rapido';
  if (/\b(lento|despacio)\w*/.test(text)) return 'lento';
  if (/\b(normal|reanuda|continua)\w*/.test(text) && /\b(tiempo|velocidad|acuario)\b/.test(text)) return 'normal';
  return null;
}

function findQuantity(text) {
  const number = text.match(/\b(\d{1,2})\b/);
  if (number) return normalizeQuantity(Number(number[1]));

  const words = {
    un: 1,
    una: 1,
    uno: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10
  };

  for (const [word, value] of Object.entries(words)) {
    if (new RegExp(`\\b${word}\\b`).test(text)) return value;
  }

  return 1;
}

function normalizeQuantity(value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(20, Math.floor(quantity)));
}

function normalizeFishSpecies(value) {
  const species = String(value || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const aliases = {
    beta: 'betta',
    pez_betta: 'betta',
    pez_beta: 'betta',
    escalar: 'angel',
    pez_angel: 'angel',
    pez_ángel: 'angel',
    danio: 'cebra',
    danio_cebra: 'cebra',
    cola_de_espada: 'xipho',
    espada: 'xipho',
    oto: 'otocinclus'
  };
  return aliases[species] || species;
}

function buildResponse(actions) {
  if (actions.length === 0) return 'No hay cambios que aplicar en el acuario.';
  return 'Listo, aplicare esas acciones en el acuario.';
}

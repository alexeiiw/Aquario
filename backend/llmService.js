const validFish = ['neon', 'guppy', 'betta', 'molly', 'angel', 'cebra', 'corydora', 'platy', 'xipho', 'otocinclus', 'rasbora', 'tetra', 'ramirezi', 'gourami', 'ancistrus'];
const validInvertebrates = ['neritina', 'manzana', 'planorbis', 'cherry', 'amano', 'fantasma'];
const validPlants = ['anubia', 'ambulia'];
const validAlgae = ['verde', 'filamentosa'];

export function interpretUserMessage(message, context = {}) {
  return parseLocalMessage(message, context);
}

function parseLocalMessage(message, context) {
  const text = normalizeText(message);
  const actions = [];

  const pending = resolvePending(text, context?.pending);
  if (pending) return pending;

  if (/\b(aliment\w*|comid\w*|dar de comer)\b/.test(text)) actions.push({ tipo: 'ALIMENTAR', cantidad: findQuantity(text) });
  if (/\b(limpi|retir|sac|elimin)\w*\b.*\b(muert|cadaver)\w*\b/.test(text)) actions.push({ tipo: 'LIMPIAR_MUERTOS', cantidad: 1 });
  const waterChange = text.match(/\b(?:cambio|cambiar|cambia)\s+(?:de\s+)?agua\b(?:\s+(?:(?:del|de)\s+)?(\d{1,2})\s*%)?/);
  const asksAboutWaterChange = /\b(necesita|necesito|debo|hace falta|conviene)\b/.test(text) && /\bcambio\s+de\s+agua\b/.test(text);
  if (waterChange && !asksAboutWaterChange) actions.push({ tipo: 'CAMBIAR_AGUA', porcentaje: waterChange[1] ? Number(waterChange[1]) : 20, cantidad: 1 });
  if (/\b(diagnostico|diagnostica|alertas|alerta)\b/.test(text) || asksAboutWaterChange) actions.push({ tipo: 'DIAGNOSTICO', cantidad: 1 });
  if (/\b(agua|calidad|amonio|nitrito|nitrato|oxigen)\w*\b/.test(text) && /\b(como|revisa|ver|consulta|estado)\b/.test(text)) actions.push({ tipo: 'CONSULTAR_ESTADO', cantidad: 1 });

  const speed = findSpeed(text);
  if (speed) actions.push({ tipo: 'CAMBIAR_TIEMPO', velocidad: speed, cantidad: 1 });

  addSpeciesActions(actions, text, validFish, 'COMPRAR_PEZ', normalizeFishSpecies);
  addSpeciesActions(actions, text, validInvertebrates, 'COMPRAR_INVERTEBRADO');
  addSpeciesActions(actions, text, validPlants, 'AGREGAR_PLANTA');
  addSpeciesActions(actions, text, validAlgae, 'AGREGAR_ALGA');

  if (actions.length > 0) return { acciones: actions, respuesta_chat: buildResponse(actions), contexto: null };
  if (/\b(agrega|anade|pon|compra|quiero|dame)\b/.test(text)) {
    const category = findMissingCategory(text);
    if (category) return clarificationForCategory(category, text);
    return clarification('¿Qué deseas agregar y en qué cantidad? Puedes indicar, por ejemplo: “agrega dos neones”.', null);
  }
  if (/\b(tiempo|velocidad|rapido|lento|pausa)\b/.test(text)) {
    return clarification('¿Qué velocidad deseas? Opciones: pausado, lento, normal, rapido o muy rapido.', { tipo: 'velocidad' });
  }
  return {
    acciones: [],
    respuesta_chat: 'No identifique una accion dentro del acuario. Puedes pedir peces, invertebrados, plantas, algas, alimento, limpieza, diagnostico, cambio de agua, estado del agua o velocidad. Escribe “menu” para ver ejemplos.',
    contexto: null
  };
}

function resolvePending(text, pending) {
  if (!pending) return null;
  if (pending.tipo === 'velocidad') {
    const speed = findSpeed(text) || ({ primera: 'pausado', segunda: 'lento', tercera: 'normal', cuarta: 'rapido', quinta: 'muy_rapido' }[text]);
    return speed
      ? { acciones: [{ tipo: 'CAMBIAR_TIEMPO', velocidad: speed, cantidad: 1 }], respuesta_chat: 'Listo, cambiare la velocidad del tiempo.', contexto: null }
      : clarification('Indica una velocidad: pausado, lento, normal, rapido o muy rapido.', pending);
  }

  const catalog = pending.tipo === 'pez' ? validFish : pending.tipo === 'invertebrado' ? validInvertebrates : pending.tipo === 'planta' ? validPlants : validAlgae;
  const type = pending.tipo === 'pez' ? 'COMPRAR_PEZ' : pending.tipo === 'invertebrado' ? 'COMPRAR_INVERTEBRADO' : pending.tipo === 'planta' ? 'AGREGAR_PLANTA' : 'AGREGAR_ALGA';
  const selected = catalog.find((item) => speciesAliases(item).some((alias) => new RegExp(`\\b${alias}\\b`).test(text)));
  if (!selected) return clarification(`Indica una opcion valida: ${catalog.map((item) => item).join(', ')}.`, pending);
  return { acciones: [{ tipo, especie: selected, cantidad: pending.cantidad || findQuantity(text) }], respuesta_chat: 'Listo, agregare eso al acuario.', contexto: null };
}

function findMissingCategory(text) {
  if (/\b(pez|peces|neon|guppy|betta|molly|angel|escalar|cebra|danio|cory|platy|xipho|otocinclus|oto|rasbora|arlequin|tetra|cardenal|ramirezi|gourami|ancistrus|pleco)\b/.test(text)) return 'pez';
  if (/\b(invertebrado|caracol|gamba|camar[oó]n|neritina|manzana|planorbis|cherry|amano|fantasma)\b/.test(text)) return 'invertebrado';
  if (/\b(planta|plantas|vegetacion)\b/.test(text)) return 'planta';
  if (/\b(alga|algas)\b/.test(text)) return 'alga';
  return null;
}

function clarificationForCategory(category, text) {
  const cantidad = findQuantity(text);
  const questions = {
    pez: '¿Qué pez deseas agregar? Puedes elegir neon, guppy, betta, molly, angel, cebra, corydora, platy, xipho, otocinclus, rasbora, tetra, ramirezi, gourami o ancistrus.',
    invertebrado: '¿Qué deseas agregar: caracol neritina, manzana, planorbis o gamba cherry, amano o fantasma?',
    planta: '¿Qué planta deseas agregar: anubia o ambulia?',
    alga: '¿Qué tipo de alga deseas agregar: verde o filamentosa?'
  };
  return clarification(questions[category], { tipo: category, cantidad });
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
    otocinclus: ['otocinclus', 'otos', 'oto'], rasbora: ['rasbora', 'rasboras', 'arlequin'],
    tetra: ['tetra', 'tetras', 'cardenal'], ramirezi: ['ramirezi', 'ramirezis'],
    gourami: ['gourami', 'gouramis'], ancistrus: ['ancistrus', 'pleco'], cherry: ['cherry', 'cherrys', 'cereza'],
    fantasma: ['fantasma', 'fantasmas', 'ghost'], neritina: ['neritina', 'neritinas'],
    manzana: ['manzana', 'manzanas'], planorbis: ['planorbis'], amano: ['amano', 'amanos'],
    anubia: ['anubia', 'anubias'], ambulia: ['ambulia', 'ambulias'],
    filamentosa: ['filamentosa', 'filamentosas', 'filament'], verde: ['verde', 'verdes']
  };
  return aliases[species] || [species];
}

function clarification(text, contexto = null) {
  return { acciones: [], respuesta_chat: text, contexto };
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

const freshwaterFish = ['neon', 'guppy', 'betta', 'molly', 'angel', 'cebra', 'corydora', 'platy', 'xipho', 'otocinclus', 'rasbora', 'tetra', 'ramirezi', 'gourami', 'ancistrus'];
const marineFish = ['payaso', 'gramma', 'cirujano_azul', 'damisela', 'firefish'];
const freshwaterInvertebrates = ['neritina', 'manzana', 'planorbis', 'cherry', 'amano', 'fantasma'];
const marineInvertebrates = ['camaron_limpiador', 'cangrejo_ermitano', 'caracol_turbo'];
const marineStudyFish = ['cirujano_azul'];
const validPlants = ['anubia', 'ambulia', 'vallisneria'];
const validAlgae = ['verde', 'filamentosa'];
const validWoods = ['mopani', 'manzanita', 'spider', 'cholla', 'manglar'];
const validCorals = ['zoanthid', 'hongo', 'euphyllia', 'acropora'];

export function interpretUserMessage(message, context = {}, mode = 'dulce') {
  return parseLocalMessage(message, context, mode);
}

function parseLocalMessage(message, context, mode) {
  const text = normalizeText(message);
  const actions = [];
  const marine = mode === 'marino';
  const validFish = marine ? marineFish : freshwaterFish;
  const validInvertebrates = marine ? marineInvertebrates : freshwaterInvertebrates;
  const plants = marine ? [] : validPlants;
  const algae = marine ? [] : validAlgae;
  const woods = marine ? [] : validWoods;
  const corals = marine ? validCorals : [];

  const pending = resolvePending(text, context?.pending, { validFish, validInvertebrates, plants, algae, woods, corals });
  if (pending) return pending;

  if (marine) {
    if (/\b(cirujano azul|cirujano)\b/.test(text) && !/\b(cambio de agua|cambiar agua|cambia agua)\b/.test(text)) return { acciones: [], respuesta_chat: 'El cirujano azul es una especie de estudio, no disponible para agregar: es un nadador activo y necesita mucho más espacio de nado que este tanque didáctico. El catálogo jugable ofrece pez payaso, gramma, damisela y pez dardo de fuego.', contexto: null };
    const cyclingQuestion = /\b(que|qué|como|cómo|explica|significa|importa)\b/.test(text) && /\b(ciclado|ciclo biologico|ciclo biológico|acuario nuevo)\b/.test(text);
    const concept = text.match(/\b(salinidad|evaporacion|sal|temperatura|alcalinidad|calcio|coral(?:es)?|skimmer|espumador|circulacion|corriente)\b/);
    if (cyclingQuestion) return { acciones: [], respuesta_chat: `Aprendizaje: ${marineLesson('ciclado')}`, contexto: null };
    if (concept && /\b(que|qué|como|cómo|para que|para qué|por que|por qué|explica|significa|necesita|necesitan|importa)\b/.test(text)) {
      const normalizedConcept = concept[1] === 'evaporacion' ? 'evaporacion' : concept[1].startsWith('coral') ? 'coral'
        : ['skimmer', 'espumador'].includes(concept[1]) ? 'skimmer'
          : ['circulacion', 'corriente'].includes(concept[1]) ? 'circulation' : concept[1];
      return { acciones: [], respuesta_chat: `Aprendizaje: ${marineLesson(normalizedConcept)}`, contexto: null };
    }
  }
  if (!marine && /\b(pez payaso|payaso|gramma|cirujano azul|damisela|firefish|caracol turbo|gamba limpiadora|cangrejo ermitaño|coral|corales|arrecife|salinidad|skimmer|espumador)\b/.test(text)) {
    return { acciones: [], respuesta_chat: 'Eso pertenece al acuario marino. Usa el switch Marino de la interfaz para abrir esa partida independiente; tu acuario de agua dulce y sus habitantes seguirán guardados sin cambios.', contexto: null };
  }

  if (marine && /\b(planta|plantas|vallisneria|anubia|ambulia|madera|mopani|manzanita|alga verde|alga filamentosa)\b/.test(text)) {
    return { acciones: [], respuesta_chat: 'Esas plantas, algas y maderas son del acuario de agua dulce. En el arrecife marino usa roca y corales; puedes cambiar de modo sin perder ninguna de las dos partidas.', contexto: null };
  }
  if (marine && /\b(crecimiento|crece|crecen)\b/.test(text) && /\b(coral|corales|acropora|euphyllia)\b/.test(text) && !actions.length) {
    return { acciones: [], respuesta_chat: 'En esta simulación los corales crecen cuando el ciclado está completo, la luz y circulación están activas y salinidad, temperatura, pH, alcalinidad y calcio están en rango. En un acuario real identifica primero la especie y mide los parámetros; cada coral tiene requisitos propios.', contexto: null };
  }

  if (!marine && /\b(pez payaso|payaso|gramma|damisela|firefish|caracol turbo|gamba limpiadora|cirujano azul|coral|corales|salinidad|skimmer|espumador)\b/.test(text)) {
    return { acciones: [], respuesta_chat: 'Ese organismo o equipo corresponde al acuario marino. Pulsa Marino en el selector superior para abrir su partida independiente; el acuario dulce no se modifica.', contexto: null };
  }

  if (/\b(aliment\w*|comid\w*|dar de comer)\b/.test(text)) actions.push({ tipo: 'ALIMENTAR', cantidad: findQuantity(text) });
  if (/\b(limpi|retir|sac|elimin)\w*\b.*\b(muert|cadaver)\w*\b/.test(text)) actions.push({ tipo: 'LIMPIAR_MUERTOS', cantidad: 1 });
  const waterChange = text.match(/\b(?:cambio|cambiar|cambia)\s+(?:de\s+)?agua\b(?:\s+(?:(?:del|de)\s+)?(\d{1,2})\s*%)?/);
  const asksAboutWaterChange = /\b(necesita|necesito|debo|hace falta|conviene)\b/.test(text) && /\bcambio\s+de\s+agua\b/.test(text);
  const asksHowWaterChangeWorks = /\b(como|cómo|hacer|realizar|preparar|preparo)\b/.test(text) && /\b(cambio de agua|cambiar (?:el )?agua|cambiar agua)\b/.test(text);
  if (asksAboutWaterChange) return { acciones: [{ tipo: 'DIAGNOSTICO', cantidad: 1 }], respuesta_chat: 'Voy a revisar primero el diagnóstico; consultar no realiza ningún cambio de agua.', contexto: null };
  if (asksHowWaterChangeWorks) return {
    acciones: [],
    respuesta_chat: marine
      ? 'Para un cambio parcial marino prepara agua salada con mezcla específica para arrecife, completamente disuelta y ajustada a temperatura y salinidad actuales. En la simulación aplica un porcentaje explícito, por ejemplo “cambio de agua 10%”.'
      : 'Escribe “cambio de agua” para aplicar 20%, o indica un porcentaje como “cambio de agua 30%”. En un acuario real usa agua acondicionada, de temperatura similar, y evita reemplazarla toda de golpe.',
    contexto: null
  };
  if (marine && waterChange && !waterChange[1] && !/\b(que|qué|como|cómo|hacer|realizar|preparar|preparo)\b/.test(text)) {
    return { acciones: [], respuesta_chat: 'Indica el porcentaje del cambio (por ejemplo, “cambio de agua 10%”). En un acuario real usa una mezcla específica para acuarios marinos, disuelta y ajustada a temperatura y salinidad; no uses agua dulce ni sal de mesa para un cambio parcial.', contexto: null };
  }
  if (waterChange && !asksAboutWaterChange) actions.push({ tipo: 'CAMBIAR_AGUA', porcentaje: waterChange[1] ? Number(waterChange[1]) : 20, cantidad: 1 });
  if (/\b(diagnostico|diagnostica|alertas|alerta)\b/.test(text) || asksAboutWaterChange) actions.push({ tipo: 'DIAGNOSTICO', cantidad: 1 });
  if (/\b(agua|calidad|amonio|nitrito|nitrato|oxigen|salinidad|temperatura|alcalinidad|calcio)\w*\b/.test(text) && /\b(como|revisa|ver|consulta|estado|muestra)\b/.test(text)) actions.push({ tipo: 'CONSULTAR_ESTADO', cantidad: 1 });
  if (/\b(limpia|limpiar|mantenimiento)\b.*\bfiltro\b/.test(text)) actions.push({ tipo: 'LIMPIAR_FILTRO', cantidad: 1 });
  if (/\b(mejora|mejorar|potencia)\b.*\bfiltro\b/.test(text)) actions.push({ tipo: 'MEJORAR_FILTRO', cantidad: 1 });
  if (/\b(enciende|encender|prende|prender)\b.*\b(luz|iluminacion)\b/.test(text)) actions.push({ tipo: 'LUZ', activa: true, cantidad: 1 });
  if (/\b(apaga|apagar)\b.*\b(luz|iluminacion)\b/.test(text)) actions.push({ tipo: 'LUZ', activa: false, cantidad: 1 });
  if (marine) {
    const equipment = text.match(/\b(skimmer|espumador|circulacion|corriente)\b/);
    const activation = text.match(/\b(enciende|encender|activa|activar|prende|prender|apaga|apagar|desactiva|desactivar)\b/);
    if (equipment && activation) actions.push({
      tipo: 'EQUIPO_MARINO',
      equipo: ['skimmer', 'espumador'].includes(equipment[1]) ? 'skimmer' : 'circulacion',
      activo: !['apaga', 'apagar', 'desactiva', 'desactivar'].includes(activation[1]),
      cantidad: 1
    });
  }

  const speed = findSpeed(text);
  if (speed) actions.push({ tipo: 'CAMBIAR_TIEMPO', velocidad: speed, cantidad: 1 });
  if (marine && /\b(reponer|repone|repon|rellenar|rellena|compensar|compensa)\b.*\b(evaporaci[oó]n|agua evaporada)\b/.test(text)) actions.push({ tipo: 'REPONER_EVAPORACION', cantidad: 1 });

  addSpeciesActions(actions, text, validFish, 'COMPRAR_PEZ', normalizeFishSpecies);
  addSpeciesActions(actions, text, validInvertebrates, 'COMPRAR_INVERTEBRADO');
  addSpeciesActions(actions, text, plants, 'AGREGAR_PLANTA');
  addSpeciesActions(actions, text, algae, 'AGREGAR_ALGA');
  addSpeciesActions(actions, text, woods, 'AGREGAR_MADERA');
  addSpeciesActions(actions, text, corals, 'AGREGAR_CORAL');

  if (actions.length > 0) return { acciones: actions, respuesta_chat: buildResponse(actions), contexto: null };
  if (/\b(agrega|anade|pon|compra|quiero|dame)\b/.test(text)) {
    const category = findMissingCategory(text, marine);
    if (category) return clarificationForCategory(category, text, marine);
    return clarification('¿Qué deseas agregar y en qué cantidad? Puedes indicar, por ejemplo: “agrega dos neones”.', null);
  }
  if (/\b(tiempo|velocidad|rapido|lento|pausa)\b/.test(text)) {
    return clarification('¿Qué velocidad deseas? Opciones: pausado, lento, normal, rapido o muy rapido.', { tipo: 'velocidad' });
  }
  return {
    acciones: [],
    respuesta_chat: 'No identifique una accion dentro del acuario. Puedes pedir peces, invertebrados, plantas, algas, maderas, alimento, limpieza, diagnostico, cambio de agua, estado del agua o velocidad. Escribe “menu” para ver ejemplos.',
    contexto: null
  };
}

function resolvePending(text, pending, catalogs) {
  if (!pending) return null;
  if (pending.tipo === 'velocidad') {
    const speed = findSpeed(text) || ({ primera: 'pausado', segunda: 'lento', tercera: 'normal', cuarta: 'rapido', quinta: 'muy_rapido' }[text]);
    return speed
      ? { acciones: [{ tipo: 'CAMBIAR_TIEMPO', velocidad: speed, cantidad: 1 }], respuesta_chat: 'Listo, cambiare la velocidad del tiempo.', contexto: null }
      : clarification('Indica una velocidad: pausado, lento, normal, rapido o muy rapido.', pending);
  }

  const catalog = pending.tipo === 'pez' ? catalogs.validFish : pending.tipo === 'invertebrado' ? catalogs.validInvertebrates : pending.tipo === 'planta' ? catalogs.plants : pending.tipo === 'madera' ? catalogs.woods : pending.tipo === 'coral' ? catalogs.corals : catalogs.algae;
  const type = pending.tipo === 'pez' ? 'COMPRAR_PEZ' : pending.tipo === 'invertebrado' ? 'COMPRAR_INVERTEBRADO' : pending.tipo === 'planta' ? 'AGREGAR_PLANTA' : pending.tipo === 'madera' ? 'AGREGAR_MADERA' : pending.tipo === 'coral' ? 'AGREGAR_CORAL' : 'AGREGAR_ALGA';
  const selected = catalog.find((item) => speciesAliases(item).some((alias) => new RegExp(`\\b${alias}\\b`).test(text)));
  if (!selected) return clarification(`Indica una opcion valida: ${catalog.map((item) => item).join(', ')}.`, pending);
  return { acciones: [{ tipo, especie: selected, cantidad: pending.cantidad || findQuantity(text) }], respuesta_chat: 'Listo, agregare eso al acuario.', contexto: null };
}

function findMissingCategory(text, marine = false) {
  if (marine && /\b(coral|corales|arrecife)\b/.test(text)) return 'coral';
  if (marine && /\b(payaso|gramma|cirujano|damisela|firefish)\b/.test(text)) return 'pez';
  if (/\b(pez|peces|neon|guppy|betta|molly|angel|escalar|cebra|danio|cory|platy|xipho|otocinclus|oto|rasbora|arlequin|tetra|cardenal|ramirezi|gourami|ancistrus|pleco)\b/.test(text)) return 'pez';
  if (/\b(invertebrado|caracol|gamba|camar[oó]n|neritina|manzana|planorbis|cherry|amano|fantasma|turbo|cangrejo|ermitaño|ermitan[oó]|camaron|limpiadora)\b/.test(text)) return 'invertebrado';
  if (/\b(planta|plantas|vegetacion)\b/.test(text)) return 'planta';
  if (/\b(alga|algas)\b/.test(text)) return 'alga';
  if (/\b(madera|maderas|rama|ramas|raiz|raices|tronco|troncos|mopani|manzanita|spider|cholla|manglar)\b/.test(text)) return marine ? null : 'madera';
  return null;
}

function clarificationForCategory(category, text, marine = false) {
  const cantidad = findQuantity(text);
  const questions = {
    pez: marine ? '¿Qué pez marino quieres conocer? El catálogo de aprendizaje incluye pez payaso, gramma real, damisela azul y pez dardo de fuego. El cirujano azul está descrito, pero este tanque simulado no tiene el espacio que requiere.' : '¿Qué pez deseas agregar? Puedes elegir neon, guppy, betta, molly, angel, cebra, corydora, platy, xipho, otocinclus, rasbora, tetra, ramirezi, gourami o ancistrus.',
    invertebrado: marine ? '¿Qué invertebrado marino deseas agregar: gamba limpiadora, cangrejo ermitaño o caracol turbo?' : '¿Qué deseas agregar: caracol neritina, manzana, planorbis o gamba cherry, amano o fantasma?',
    planta: '¿Qué planta deseas agregar: anubia, ambulia o vallisneria?',
    alga: '¿Qué tipo de alga deseas agregar: verde o filamentosa?',
    madera: '¿Qué madera deseas agregar: mopani, manzanita, spider, cholla o manglar?',
    coral: '¿Qué coral deseas agregar? Puedes elegir zoántido, coral hongo, euphyllia o acropora. Primero consulta el diagnóstico: el arrecife necesita agua estable y luz.'
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
    neon: ['neon', 'neones'], guppy: ['guppy', 'guppies', 'gupies', 'gypies', 'gupi'], betta: ['betta', 'beta'],
    payaso: ['pez payaso', 'payaso'], gramma: ['gramma real', 'gramma'], cirujano_azul: ['cirujano azul', 'cirujano'], damisela: ['damisela azul', 'damisela'], firefish: ['firefish', 'pez dardo', 'dardo de fuego'],
    camaron_limpiador: ['camaron limpiador', 'gamba limpiadora', 'limpiadora'], cangrejo_ermitano: ['cangrejo ermitano', 'cangrejo ermitaño', 'ermitaño'], caracol_turbo: ['caracol turbo', 'turbo'],
    zoanthid: ['zoanthid', 'zoantido', 'zoantidos', 'zoanthidos'], hongo: ['coral hongo', 'hongo'], euphyllia: ['euphyllia'], acropora: ['acropora'],
    angel: ['angel', 'angeles', 'escalar'], cebra: ['cebra', 'cebras', 'danio', 'danios'],
    corydora: ['corydora', 'corydoras', 'cory'], molly: ['molly', 'mollies', 'mollys'],
    platy: ['platy', 'platys'], xipho: ['xipho', 'xiphos', 'espada'],
    otocinclus: ['otocinclus', 'otos', 'oto'], rasbora: ['rasbora', 'rasboras', 'arlequin'],
    tetra: ['tetra', 'tetras', 'cardenal'], ramirezi: ['ramirezi', 'ramirezis'],
    gourami: ['gourami', 'gouramis'], ancistrus: ['ancistrus', 'pleco'], cherry: ['cherry', 'cherrys', 'cereza'],
    fantasma: ['fantasma', 'fantasmas', 'ghost'], neritina: ['neritina', 'neritinas'],
    manzana: ['manzana', 'manzanas'], planorbis: ['planorbis'], amano: ['amano', 'amanos'],
    anubia: ['anubia', 'anubias'], ambulia: ['ambulia', 'ambulias'], vallisneria: ['vallisneria', 'vallis', 'valisneria'],
    filamentosa: ['filamentosa', 'filamentosas', 'filament'], verde: ['verde', 'verdes'],
    mopani: ['mopani'], manzanita: ['manzanita', 'rama', 'ramas', 'raiz', 'raices'],
    spider: ['spider', 'spider wood'], cholla: ['cholla'], manglar: ['manglar']
  };
  return aliases[species] || [species];
}

function marineLesson(concept) {
  const lessons = {
    ciclado: 'El ciclado permite que bacterias beneficiosas se establezcan en el filtro y transformen amonio (tóxico) en nitrito (también tóxico) y después en nitrato. En un acuario real se confirma midiendo amonio y nitrito en cero de forma estable; esperar unos días no basta.',
    salinidad: 'La salinidad es la cantidad de sales disueltas y se expresa en ppt (partes por mil). En este acuario didáctico el objetivo es 33–36 ppt. La evaporación no elimina sal: repón lo evaporado con agua dulce purificada. Para cambios de agua usa agua salada preparada para acuarios marinos.',
    sal: 'La salinidad es la cantidad de sales disueltas y se expresa en ppt. No uses sal de mesa. Para preparar agua marina se usa una mezcla específica para acuarios, siguiendo la dosis y midiendo la salinidad.',
    temperatura: 'La temperatura influye en el metabolismo y el estrés. El rango simplificado de esta simulación es 23–27 °C. En un tanque real usa termómetro y cambia la temperatura poco a poco.',
    alcalinidad: 'La alcalinidad, medida en dKH, ayuda a amortiguar cambios de pH y los corales la usan al construir su esqueleto. Rango de aprendizaje: 7–10 dKH. Mide antes de dosificar.',
    calcio: 'El calcio, medido en ppm, lo utilizan sobre todo los corales duros para formar su esqueleto. Rango de aprendizaje: 380–460 ppm. No agregues suplemento sin medir; un acuario sin corales duros normalmente no lo necesita.',
    coral: 'Los corales son animales coloniales, no plantas. Necesitan luz adecuada y agua estable. En la simulación se desbloquean cuando salinidad, temperatura, alcalinidad y calcio están en rango.',
    skimmer: 'El skimmer (espumador) retira parte de los residuos orgánicos usando burbujas finas. Ayuda al filtro, pero no lo reemplaza ni elimina la necesidad de cambios de agua.',
    circulation: 'La circulación mueve agua y oxígeno por todo el arrecife, evitando zonas estancadas. Debe mantenerse, pero sin dirigir una corriente intensa directamente a corales delicados.'
  };
  return lessons[concept] || 'Pregunta por salinidad, temperatura, alcalinidad, calcio, corales, skimmer o circulación para conocer el concepto.';
}

function freshwaterLesson(concept) {
  const lessons = {
    amonio: 'El amonio proviene de desechos y comida sobrante. Puede ser tóxico; un filtro biológico maduro ayuda a transformarlo. Si aumenta, reduce comida y revisa filtración y cambios parciales de agua.',
    nitrito: 'El nitrito aparece cuando bacterias transforman amonio. También es tóxico; otras bacterias del filtro lo convierten después en nitrato. Si sube, evita añadir animales y revisa el filtro.',
    nitrato: 'El nitrato es el producto final del ciclo biológico. En exceso estresa a los animales y suele controlarse con cambios parciales y plantas saludables.',
    ph: 'El pH indica qué tan ácida o alcalina es el agua. Lo importante es que sea adecuado para tus especies y estable; evita cambiarlo bruscamente.',
    nutrientes: 'En esta simulación, nutrientes resume materia orgánica disponible; no indica que cada pez esté alimentado. Observa el hambre individual y evita dejar comida sobrante.'
  };
  return lessons[concept] || lessons.amonio;
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

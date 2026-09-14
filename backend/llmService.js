import { Ollama } from 'ollama';

const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b';
const HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const ollama = new Ollama({ host: HOST });

const systemPrompt = `Eres el motor de IA de un juego de acuario virtual. Tu unica tarea es analizar el mensaje del usuario y extraer las acciones que desea realizar en el ecosistema.
Debes responder exclusivamente con un objeto JSON valido, sin texto adicional, saludos ni explicaciones.

Acciones permitidas:
- COMPRAR_PEZ con especie "neon", "guppy", "betta", "molly", "angel", "cebra", "corydora", "platy", "xipho" u "otocinclus".
- COMPRAR_INVERTEBRADO con especie "neritina", "manzana", "planorbis", "cherry", "amano" o "fantasma".
- AGREGAR_PLANTA con especie "anubia" o "ambulia".
- AGREGAR_ALGA con especie "verde" o "filamentosa".
- ALIMENTAR con cantidad numerica.
- LIMPIAR_MUERTOS para retirar peces, caracoles o gambas muertos del acuario.
- CAMBIAR_TIEMPO con velocidad "pausado", "lento", "normal", "rapido" o "muy_rapido".
- CONSULTAR_ESTADO para preguntar por calidad del agua o estado general.
- AYUDA para mensajes como "help", "ayuda", "ideas" o "comandos".

Formato de respuesta requerido:
{
  "acciones": [
    { "tipo": "COMPRAR_PEZ", "especie": "neon", "cantidad": 1 },
    { "tipo": "COMPRAR_INVERTEBRADO", "especie": "cherry", "cantidad": 1 },
    { "tipo": "AGREGAR_PLANTA", "especie": "anubia", "cantidad": 1 },
    { "tipo": "AGREGAR_ALGA", "especie": "verde", "cantidad": 1 },
    { "tipo": "ALIMENTAR", "cantidad": 1 },
    { "tipo": "LIMPIAR_MUERTOS", "cantidad": 1 },
    { "tipo": "CAMBIAR_TIEMPO", "velocidad": "rapido", "cantidad": 1 },
    { "tipo": "CONSULTAR_ESTADO", "cantidad": 1 },
    { "tipo": "AYUDA", "cantidad": 1 }
  ],
  "respuesta_chat": "Un mensaje amigable y breve en espanol confirmando lo que vas a hacer en el acuario."
}

Si no hay acciones validas, responde con "acciones": [] y explica brevemente que puede pedir peces neon, guppy, betta, molly, angel/escalar, cebra, corydora, platy, xipho, otocinclus, caracoles, gambas, plantas, algas, alimento, tiempo, agua o limpieza.`;

const validFish = ['neon', 'guppy', 'betta', 'molly', 'angel', 'cebra', 'corydora', 'platy', 'xipho', 'otocinclus'];
const validInvertebrates = ['neritina', 'manzana', 'planorbis', 'cherry', 'amano', 'fantasma'];
const validSpeeds = ['pausado', 'lento', 'normal', 'rapido', 'muy_rapido'];

export async function interpretUserMessage(message) {
  try {
    const response = await ollama.chat({
      model: MODEL,
      format: 'json',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      options: {
        temperature: 0.1
      }
    });

    const parsed = JSON.parse(response.message.content);
    return sanitizeResult(parsed);
  } catch (error) {
    console.warn('Ollama no respondio. Se usa interpretacion local basica:', error.message);
    return fallbackInterpretation(message);
  }
}

function sanitizeResult(result) {
  const validActions = [];
  const actions = Array.isArray(result.acciones) ? result.acciones : [];

  for (const action of actions) {
    const type = String(action.tipo || '').toUpperCase();
    const cantidad = normalizeQuantity(action.cantidad);

    if (type === 'COMPRAR_PEZ' && validFish.includes(action.especie)) {
      validActions.push({ tipo: 'COMPRAR_PEZ', especie: action.especie, cantidad });
    }

    if (type === 'AGREGAR_PLANTA' && ['anubia', 'ambulia'].includes(action.especie)) {
      validActions.push({ tipo: 'AGREGAR_PLANTA', especie: action.especie, cantidad });
    }

    if (type === 'AGREGAR_ALGA' && ['verde', 'filamentosa'].includes(action.especie)) {
      validActions.push({ tipo: 'AGREGAR_ALGA', especie: action.especie, cantidad });
    }

    if (type === 'COMPRAR_INVERTEBRADO' && validInvertebrates.includes(action.especie)) {
      validActions.push({ tipo: 'COMPRAR_INVERTEBRADO', especie: action.especie, cantidad });
    }

    if (type === 'ALIMENTAR') {
      validActions.push({ tipo: 'ALIMENTAR', cantidad });
    }

    if (type === 'LIMPIAR_MUERTOS') {
      validActions.push({ tipo: 'LIMPIAR_MUERTOS', cantidad: 1 });
    }

    const velocidad = normalizeSpeed(action.velocidad);
    if (type === 'CAMBIAR_TIEMPO' && validSpeeds.includes(velocidad)) {
      validActions.push({ tipo: 'CAMBIAR_TIEMPO', velocidad, cantidad: 1 });
    }

    if (type === 'CONSULTAR_ESTADO') {
      validActions.push({ tipo: 'CONSULTAR_ESTADO', cantidad: 1 });
    }

    if (type === 'AYUDA') {
      validActions.push({ tipo: 'AYUDA', cantidad: 1 });
    }
  }

  return {
    acciones: validActions,
    respuesta_chat: typeof result.respuesta_chat === 'string'
      ? result.respuesta_chat.slice(0, 320)
      : buildResponse(validActions)
  };
}

function fallbackInterpretation(message) {
  const text = message.toLowerCase();
  const actions = [];

  if (/^(help|ayuda|ideas|comandos|\?)\s*$/.test(text)) {
    return {
      acciones: [{ tipo: 'AYUDA', cantidad: 1 }],
      respuesta_chat: 'Claro, aqui tienes comandos utiles.'
    };
  }

  if (/(ne[oó]n|neon)/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'neon', cantidad: findQuantity(text) });
  }
  if (/guppy|gupi/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'guppy', cantidad: findQuantity(text) });
  }
  if (/betta|beta/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'betta', cantidad: findQuantity(text) });
  }
  if (/molly|mollie|mollies/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'molly', cantidad: findQuantity(text) });
  }
  if (/(pez\s+)?[aá]ngel|angel|escalar/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'angel', cantidad: findQuantity(text) });
  }
  if (/cebra|danio/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'cebra', cantidad: findQuantity(text) });
  }
  if (/corydora|cory/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'corydora', cantidad: findQuantity(text) });
  }
  if (/platy/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'platy', cantidad: findQuantity(text) });
  }
  if (/xipho|cola de espada|espada/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'xipho', cantidad: findQuantity(text) });
  }
  if (/otocinclus|\boto\b/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'otocinclus', cantidad: findQuantity(text) });
  }
  if (/anubia/.test(text)) {
    actions.push({ tipo: 'AGREGAR_PLANTA', especie: 'anubia', cantidad: findQuantity(text) });
  }
  if (/ambulia/.test(text)) {
    actions.push({ tipo: 'AGREGAR_PLANTA', especie: 'ambulia', cantidad: findQuantity(text) });
  }
  if (/alga|algas/.test(text)) {
    actions.push({ tipo: 'AGREGAR_ALGA', especie: /filament/.test(text) ? 'filamentosa' : 'verde', cantidad: findQuantity(text) });
  }
  if (/neritina/.test(text)) {
    actions.push({ tipo: 'COMPRAR_INVERTEBRADO', especie: 'neritina', cantidad: findQuantity(text) });
  }
  if (/manzana/.test(text)) {
    actions.push({ tipo: 'COMPRAR_INVERTEBRADO', especie: 'manzana', cantidad: findQuantity(text) });
  }
  if (/planorbis/.test(text)) {
    actions.push({ tipo: 'COMPRAR_INVERTEBRADO', especie: 'planorbis', cantidad: findQuantity(text) });
  }
  if (/cherry|cereza/.test(text)) {
    actions.push({ tipo: 'COMPRAR_INVERTEBRADO', especie: 'cherry', cantidad: findQuantity(text) });
  }
  if (/amano/.test(text)) {
    actions.push({ tipo: 'COMPRAR_INVERTEBRADO', especie: 'amano', cantidad: findQuantity(text) });
  }
  if (/fantasma|ghost/.test(text)) {
    actions.push({ tipo: 'COMPRAR_INVERTEBRADO', especie: 'fantasma', cantidad: findQuantity(text) });
  }
  if (/aliment|comida|dar de comer/.test(text)) {
    actions.push({ tipo: 'ALIMENTAR', cantidad: findQuantity(text) });
  }
  if (/limpi|retir|sacar|eliminar/.test(text) && /muert|cadaver|cad[aá]ver/.test(text)) {
    actions.push({ tipo: 'LIMPIAR_MUERTOS', cantidad: 1 });
  }
  if (/pausa|det[eé]n|detener/.test(text)) {
    actions.push({ tipo: 'CAMBIAR_TIEMPO', velocidad: 'pausado', cantidad: 1 });
  } else if (/muy r[aá]pid|super r[aá]pid|velocidad m[aá]xima/.test(text)) {
    actions.push({ tipo: 'CAMBIAR_TIEMPO', velocidad: 'muy_rapido', cantidad: 1 });
  } else if (/r[aá]pid|acelera/.test(text)) {
    actions.push({ tipo: 'CAMBIAR_TIEMPO', velocidad: 'rapido', cantidad: 1 });
  } else if (/lento|despacio/.test(text)) {
    actions.push({ tipo: 'CAMBIAR_TIEMPO', velocidad: 'lento', cantidad: 1 });
  } else if (/normal|reanuda|continua|contin[uú]a/.test(text) && /tiempo|velocidad|acuario/.test(text)) {
    actions.push({ tipo: 'CAMBIAR_TIEMPO', velocidad: 'normal', cantidad: 1 });
  }
  if (/calidad|agua|amonio|nitrito|nitrato|oxigen/.test(text) && /(como|c[oó]mo|estado|revisa|ver|consulta)/.test(text)) {
    actions.push({ tipo: 'CONSULTAR_ESTADO', cantidad: 1 });
  }

  return {
    acciones: actions,
    respuesta_chat: actions.length > 0
      ? buildResponse(actions)
      : 'No entendi una accion valida. Puedes pedirme peces, caracoles, gambas, plantas, algas, alimento, velocidad, estado del agua o limpiar muertos.'
  };
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

function normalizeSpeed(value) {
  return String(value || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
}

function buildResponse(actions) {
  if (actions.length === 0) return 'No hay cambios que aplicar en el acuario.';
  return 'Listo, aplicare esas acciones en el acuario.';
}

import { Ollama } from 'ollama';

const MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b';
const HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const ollama = new Ollama({ host: HOST });

const systemPrompt = `Eres el motor de IA de un juego de acuario virtual. Tu unica tarea es analizar el mensaje del usuario y extraer las acciones que desea realizar en el ecosistema.
Debes responder exclusivamente con un objeto JSON valido, sin texto adicional, saludos ni explicaciones.

Acciones permitidas:
- COMPRAR_PEZ con especie "neon" o "guppy".
- AGREGAR_PLANTA con especie "anubia" o "ambulia".
- ALIMENTAR con cantidad numerica.

Formato de respuesta requerido:
{
  "acciones": [
    { "tipo": "COMPRAR_PEZ", "especie": "neon", "cantidad": 1 },
    { "tipo": "AGREGAR_PLANTA", "especie": "anubia", "cantidad": 1 },
    { "tipo": "ALIMENTAR", "cantidad": 1 }
  ],
  "respuesta_chat": "Un mensaje amigable y breve en espanol confirmando lo que vas a hacer en el acuario."
}

Si no hay acciones validas, responde con "acciones": [] y explica brevemente que puede pedir peces neon, guppy, anubias, ambulias o alimentar.`;

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

    if (type === 'COMPRAR_PEZ' && ['neon', 'guppy'].includes(action.especie)) {
      validActions.push({ tipo: 'COMPRAR_PEZ', especie: action.especie, cantidad });
    }

    if (type === 'AGREGAR_PLANTA' && ['anubia', 'ambulia'].includes(action.especie)) {
      validActions.push({ tipo: 'AGREGAR_PLANTA', especie: action.especie, cantidad });
    }

    if (type === 'ALIMENTAR') {
      validActions.push({ tipo: 'ALIMENTAR', cantidad });
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

  if (/(ne[oó]n|neon)/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'neon', cantidad: findQuantity(text) });
  }
  if (/guppy|gupi/.test(text)) {
    actions.push({ tipo: 'COMPRAR_PEZ', especie: 'guppy', cantidad: findQuantity(text) });
  }
  if (/anubia/.test(text)) {
    actions.push({ tipo: 'AGREGAR_PLANTA', especie: 'anubia', cantidad: findQuantity(text) });
  }
  if (/ambulia/.test(text)) {
    actions.push({ tipo: 'AGREGAR_PLANTA', especie: 'ambulia', cantidad: findQuantity(text) });
  }
  if (/aliment|comida|dar de comer/.test(text)) {
    actions.push({ tipo: 'ALIMENTAR', cantidad: findQuantity(text) });
  }

  return {
    acciones: actions,
    respuesta_chat: actions.length > 0
      ? buildResponse(actions)
      : 'No entendi una accion valida. Puedes pedirme peces neon, guppy, anubias, ambulias o alimentar el acuario.'
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

function buildResponse(actions) {
  if (actions.length === 0) return 'No hay cambios que aplicar en el acuario.';
  return 'Listo, aplicare esas acciones en el acuario.';
}

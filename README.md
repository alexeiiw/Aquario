# Acuario Virtual 2D Inteligente

Simulador web estilo Tamagotchi con acuario 2D, chat lateral, backend Node.js y motor de intenciones con Ollama.

## Requisitos

- Node.js 20+
- Ollama instalado y ejecutándose en `http://localhost:11434`
- Modelo recomendado: `qwen2.5-coder:3b`

## Ejecutar localmente

```bash
cd backend
npm install
npm start
```

Abrir `http://localhost:3000`.

## Ollama

En Codespaces o Linux:

```bash
sudo apt-get update && sudo apt-get install -y zstd
curl -fsSL https://ollama.com/install.sh | sh
ollama serve > ollama.log 2>&1 &
ollama pull qwen2.5-coder:3b
```

Si estas en la raiz del repositorio en Codespaces, instala y ejecuta el backend asi:

```bash
cd backend
npm install
npm start
```

Puedes cambiar el modelo con la variable de entorno:

```bash
OLLAMA_MODEL=qwen2.5-coder:3b npm start
```

## Persistencia

El estado del acuario se guarda automáticamente en `backend/data/aquarium-state.json`. Esa carpeta está ignorada por Git para evitar subir partidas locales.

Si quieres reiniciar la partida en Codespaces, detén el servidor y borra ese archivo:

```bash
rm -f backend/data/aquarium-state.json
```

## Especies y tiempo

Peces disponibles:

- `neon`: pez pequeño, hambre baja, crecimiento rapido.
- `guppy`: pez mediano, hambre moderada, crecimiento estandar.

Plantas disponibles:

- `anubia`: crecimiento lento y resistente.
- `ambulia`: crecimiento mas rapido y alto.

Por defecto, `60` segundos reales equivalen a `1` hora del juego. Puedes cambiarlo antes de iniciar el servidor:

```bash
REAL_SECONDS_PER_GAME_HOUR=120 npm start
```

El contador de peces muestra `vivos/total`. Si ves `0/2`, esos peces murieron por hambre y ya no se moveran.

## Chat de ejemplo

- `Quiero comprar dos peces neon y una anubia`
- `Agrega un guppy y alimenta a los peces`
- `Pon tres ambulias en el fondo`

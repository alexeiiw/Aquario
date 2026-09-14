# Acuario Virtual 2D Inteligente

Version `1.1.0`.

Simulador web estilo Tamagotchi con acuario 2D de agua dulce, chat lateral, backend Node.js y motor de intenciones con Ollama.

## Requisitos

- Node.js 20+
- Ollama instalado y ejecutándose en `http://localhost:11434`
- Modelo recomendado: `qwen2.5-coder:3b`

## Ejecutar localmente

Desde la raiz del repositorio en Codespaces puedes arrancar todo con:

```bash
npm start
```

Ese comando instala `zstd` si falta, instala Ollama si falta, inicia Ollama, descarga el modelo configurado, instala dependencias del backend y arranca el servidor.

Arranque manual del backend:

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

## Especies de agua dulce y tiempo

Peces disponibles:

- `neon`: pez pequeño, hambre baja, crecimiento rapido.
- `guppy`: pez mediano, hambre moderada, crecimiento estandar.

Caracoles disponibles:

- `neritina`: caracol de agua dulce comedor de algas.
- `manzana`: caracol grande de agua dulce.
- `planorbis`: caracol pequeno de agua dulce.

Gambas disponibles:

- `cherry`: gamba roja de agua dulce.
- `amano`: gamba resistente y activa.
- `fantasma`: gamba clara/translucida.

Plantas disponibles:

- `anubia`: crecimiento lento y resistente.
- `ambulia`: crecimiento mas rapido y alto.

Por defecto, `60` segundos reales equivalen a `1` hora del juego. Puedes cambiarlo antes de iniciar el servidor:

```bash
REAL_SECONDS_PER_GAME_HOUR=120 npm start
```

El contador de peces e invertebrados muestra `vivos/total`. Si ves `0/2`, esos animales murieron por hambre y ya no se moveran.

Para retirar animales muertos del acuario, escribe en el chat:

- `limpia los muertos`
- `retira los cadaveres`
- `saca los animales muertos`

## Chat de ejemplo

- `Quiero comprar dos peces neon y una anubia`
- `Agrega tres gambas cherry y un caracol neritina`
- `Compra un caracol manzana y dos gambas amano`
- `Agrega un guppy y alimenta a los peces`
- `Pon tres ambulias en el fondo`
- `Limpia los muertos`

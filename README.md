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
curl -fsSL https://ollama.com | sh
ollama serve > ollama.log 2>&1 &
ollama pull qwen2.5-coder:3b
```

Puedes cambiar el modelo con la variable de entorno:

```bash
OLLAMA_MODEL=qwen2.5-coder:3b npm start
```

## Persistencia

El estado del acuario se guarda automáticamente en `backend/data/aquarium-state.json`. Esa carpeta está ignorada por Git para evitar subir partidas locales.

## Chat de ejemplo

- `Quiero comprar dos peces neon y una anubia`
- `Agrega un guppy y alimenta a los peces`
- `Pon tres ambulias en el fondo`

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODEL="${OLLAMA_MODEL:-qwen2.5-coder:3b}"

cd "$ROOT_DIR"

if ! command -v zstd >/dev/null 2>&1; then
  echo "Instalando zstd..."
  sudo apt-get update
  sudo apt-get install -y zstd
fi

if ! command -v ollama >/dev/null 2>&1; then
  echo "Instalando Ollama..."
  curl -fsSL https://ollama.com/install.sh | sh
fi

if ! pgrep -x ollama >/dev/null 2>&1; then
  echo "Iniciando Ollama..."
  ollama serve > ollama.log 2>&1 &
  sleep 3
fi

if ! ollama list | awk '{print $1}' | grep -qx "$MODEL"; then
  echo "Descargando modelo $MODEL..."
  ollama pull "$MODEL"
fi

cd backend
if [ ! -d node_modules ]; then
  echo "Instalando dependencias Node..."
  npm install
fi

echo "Iniciando acuario en http://localhost:3000"
npm start

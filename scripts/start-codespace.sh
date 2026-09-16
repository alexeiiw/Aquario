#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cd backend
if [ ! -d node_modules ]; then
  echo "Instalando dependencias Node..."
  npm install
fi

echo "Iniciando acuario local en http://localhost:3000"
npm start

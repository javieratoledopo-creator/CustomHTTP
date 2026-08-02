#!/usr/bin/env bash
# Actualiza CUSTOM HTTP (codigo, dependencias, migraciones, panel).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
set -a; . ./.env; set +a

git pull --ff-only || echo "Sin repositorio git: copia los archivos manualmente."

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  docker compose -f deployment/docker-compose.yml --env-file .env up -d --build
  docker compose -f deployment/docker-compose.yml --env-file .env exec -T api node src/migrate.js
else
  ( cd backend && npm install && node src/migrate.js )
  ( cd admin-panel && npm install && npm run build )
  sudo systemctl restart customhttp-api
fi
echo "Actualizacion completada."

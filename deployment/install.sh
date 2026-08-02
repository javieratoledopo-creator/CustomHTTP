#!/usr/bin/env bash
# Instalacion de CUSTOM HTTP en un VPS Ubuntu/Debian.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== CUSTOM HTTP :: instalacion =="

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Se creo .env desde .env.example. Editalo y volve a ejecutar este script."
  echo "Generar secretos con: openssl rand -hex 48"
  exit 1
fi
set -a; . ./.env; set +a

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "-- Modo Docker --"
  docker compose -f deployment/docker-compose.yml --env-file .env up -d --build
  echo "-- Migraciones --"
  docker compose -f deployment/docker-compose.yml --env-file .env exec -T api node src/migrate.js
  echo "-- Administrador inicial --"
  docker compose -f deployment/docker-compose.yml --env-file .env exec -T api node src/create-admin.js
  echo "API: http://127.0.0.1:8080   Panel: http://127.0.0.1:8081"
  echo "Publicar con Nginx usando config/nginx.conf y certbot."
  exit 0
fi

echo "-- Modo nativo (Node 20 + PostgreSQL) --"
command -v node >/dev/null || { echo "Instalar Node.js 20+"; exit 1; }
command -v psql >/dev/null || echo "Aviso: psql no encontrado; asegurate de que DATABASE_URL apunte a una base accesible."

( cd backend && npm install )
( cd backend && node src/migrate.js )
( cd backend && node src/create-admin.js )
( cd admin-panel && npm install && npm run build )

echo "Backend listo. Iniciar con systemd:"
echo "  sudo cp deployment/customhttp-api.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload && sudo systemctl enable --now customhttp-api"

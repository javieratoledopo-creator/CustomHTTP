# Despliegue en VPS

## Opcion A: Docker (recomendada)
```bash
cp .env.example .env && nano .env
docker compose -f deployment/docker-compose.yml --env-file .env up -d --build
docker compose -f deployment/docker-compose.yml --env-file .env exec api node src/migrate.js
docker compose -f deployment/docker-compose.yml --env-file .env exec api node src/create-admin.js
```
API en 127.0.0.1:8080, panel en 127.0.0.1:8081. Publicar con `config/nginx.conf` + certbot.

## Opcion B: nativa
```bash
bash deployment/install.sh
sudo cp deployment/customhttp-api.service /etc/systemd/system/
sudo systemctl enable --now customhttp-api
```

## Variables configurables
API_URL, SERVER_URL, DATABASE_URL, PORT, JWT_SECRET, CONFIG_SIGNING_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD,
SESSION_TTL_MINUTES, CONFIG_TTL_HOURS, MAX_SESSIONS_DEFAULT, CORS_ORIGINS, TLS_CERT_PATH, TLS_KEY_PATH.

## Copias de seguridad
```bash
pg_dump "$DATABASE_URL" > backup-$(date +%F).sql
```

## Actualizacion
```bash
bash deployment/update.sh
```

# CUSTOM HTTP

Sistema completo: aplicacion Android (Kotlin + Compose), backend/API (Node.js + Express + PostgreSQL),
panel de administrador web (React + Vite), base de datos con migraciones y archivos de configuracion
firmados `.chttp`.

> Nota legal: la aplicacion usa unicamente APIs y permisos oficiales de Android. No modifica APN, SIM,
> operador ni restricciones del proveedor, y no sirve para evadir limites de red.

## Estructura

```text
CustomHTTP/
  android-app/     Proyecto Android (Kotlin, Jetpack Compose, OkHttp)
  backend/         API REST (Node 20, Express, PostgreSQL, JWT, bcrypt)
  admin-panel/     Panel de administrador (React + Vite)
  database/        Migraciones SQL
  config/          Nginx / HTTPS
  deployment/      Docker Compose, systemd, install.sh, update.sh
  documentation/   API.md, ANDROID.md, DEPLOY.md, SECURITY.md
  .env.example
```

## Paso a paso

### 1. Instalar dependencias
```bash
sudo apt update && sudo apt install -y nodejs npm postgresql nginx certbot python3-certbot-nginx
cd backend && npm install && cd ../admin-panel && npm install && cd ..
```
Con Docker basta con `docker` + `docker compose`.

### 2. Configurar `.env`
```bash
cp .env.example .env
openssl rand -hex 48   # JWT_SECRET
openssl rand -hex 48   # CONFIG_SIGNING_SECRET
nano .env
```

### 3. Crear la base de datos
```bash
sudo -u postgres psql -c "create user customhttp with password 'TU_PASSWORD';"
sudo -u postgres psql -c "create database customhttp owner customhttp;"
cd backend && node src/migrate.js
```

### 4. Crear el primer administrador
```bash
cd backend && node src/create-admin.js            # usa ADMIN_EMAIL / ADMIN_PASSWORD
# o: node src/create-admin.js admin@midominio.com "MiClaveSegura"
```

### 5. Iniciar el backend
```bash
cd backend && npm start                            # desarrollo
sudo cp deployment/customhttp-api.service /etc/systemd/system/
sudo systemctl enable --now customhttp-api         # produccion
```

### 6. Iniciar el panel
```bash
cd admin-panel
cp .env.example .env     # VITE_API_URL=https://api.midominio.com
npm run dev              # desarrollo (http://localhost:5173)
npm run build            # produccion -> dist/ servido por Nginx
```

### 7. Configurar HTTPS
```bash
sudo cp config/nginx.conf /etc/nginx/sites-available/customhttp
sudo ln -s /etc/nginx/sites-available/customhttp /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.midominio.com -d panel.midominio.com
sudo systemctl reload nginx
```

### 8. Agregar el primer servidor
Panel > SERVIDORES > AGREGAR SERVIDOR. Completa nombre, dominio/IP, puerto, protocolo, URL HTTPS y
descripcion. Luego VERIFICAR SERVIDOR: el servidor debe responder `GET /health`.

### 9. Crear el primer usuario
Panel > USUARIOS > CREAR USUARIO: usuario, contrasena, fechas de inicio/expiracion, limite de sesiones y notas.

### 10. Asignar un servidor
En el formulario o con CAMBIAR SERVIDOR en la fila del usuario. Cada usuario se conecta solo a su servidor asignado.

### 11. Generar un archivo `.chttp`
Panel > USUARIOS > CREAR CONFIGURACION (descarga el archivo firmado), o desde la app en
CONFIGURACION > CREAR CONFIGURACION.

### 12. Compartirlo
Panel: el archivo se descarga y se envia por el medio que prefieras.
App: CONFIGURACION > COMPARTIR ARCHIVO usa el selector del sistema.

### 13. Importar en Android
Abrir el archivo `.chttp` desde el gestor de archivos, correo o mensajeria: Android abre CUSTOM HTTP,
que muestra CONFIGURACION DETECTADA, valida la firma en el servidor, verifica servidor, autorizacion y
vigencia, y muestra CONFIGURACION IMPORTADA · SERVIDOR VERIFICADO antes de conectar.

### 14. Verificar la conexion
Pantalla principal: SERVIDOR, ESTADO DEL SERVIDOR, CONEXION y RED. Panel: DASHBOARD y SESIONES.

### 15. Compilar el APK
```bash
cd android-app
cp app.properties.example app.properties   # API_URL=https://api.midominio.com
./gradlew assembleDebug                    # app/build/outputs/apk/debug/
./gradlew assembleRelease                  # firmar con tu keystore
```
En Android Studio: abrir `android-app/` y usar Build > Build APK(s).

### 16. Actualizar el sistema
```bash
bash deployment/update.sh
```

## Despliegue rapido con Docker
```bash
cp .env.example .env && nano .env
bash deployment/install.sh
```

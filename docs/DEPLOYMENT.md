# Guía de Despliegue - ERP Sistema Químico Industrial

## Requisitos Previos

### Sistema Operativo
- Windows 10/11, Linux (Ubuntu 20.04+), o macOS 10.15+
- Node.js 18.0.0 o superior
- PostgreSQL 14.0 o superior
- Git

### Software Adicional
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Cliente PostgreSQL (pgAdmin, DBeaver, o similar)
- Herramienta de línea de comandos

## Configuración del Entorno

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd chemical-erp-system
```

### 2. Instalar PostgreSQL
```bash
# Windows (usando Chocolatey)
choco install postgresql

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (usando Homebrew)
brew install postgresql
```

### 3. Crear Base de Datos
```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE chemical_erp;

# Crear usuario (opcional)
CREATE USER erp_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE chemical_erp TO erp_user;

# Salir de PostgreSQL
\q
```

### 4. Configurar Variables de Entorno

#### Backend
```bash
cd backend
cp .env.example .env
```

Editar el archivo `.env`:
```env
# Configuración del Servidor
PORT=3001
NODE_ENV=production

# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chemical_erp
DB_USER=erp_user
DB_PASSWORD=tu_contraseña_segura

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# Configuración de Archivos
UPLOAD_PATH=uploads
MAX_FILE_SIZE=10485760

# Configuración de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Frontend
```bash
cd frontend
cp .env.example .env
```

Editar el archivo `.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production
```

## Instalación y Configuración

### 1. Instalar Dependencias del Backend
```bash
cd backend
npm install --production
```

### 2. Ejecutar Migraciones de Base de Datos
```bash
# Ejecutar schema
psql -U erp_user -d chemical_erp -f database/schema.sql

# Ejecutar datos iniciales (seed)
psql -U erp_user -d chemical_erp -f database/seed.sql
```

### 3. Instalar Dependencias del Frontend
```bash
cd frontend
npm install
```

### 4. Construir Frontend para Producción
```bash
npm run build
```

## Ejecución en Desarrollo

### 1. Iniciar Backend
```bash
cd backend
npm run dev
```

### 2. Iniciar Frontend (en otra terminal)
```bash
cd frontend
npm start
```

### 3. Acceder a la Aplicación
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## Despliegue en Producción

### Opción 1: Servidor Tradicional

#### 1. Preparar Servidor
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Instalar Nginx
sudo apt install nginx

# Instalar PM2 (Process Manager)
sudo npm install -g pm2
```

#### 2. Configurar Base de Datos
```bash
# Seguir pasos de configuración de PostgreSQL anteriores
```

#### 3. Desplegar Backend
```bash
# Clonar repositorio
git clone <repository-url> /var/www/chemical-erp
cd /var/www/chemical-erp

# Configurar variables de entorno
cd backend
cp .env.example .env
# Editar .env con valores de producción

# Instalar dependencias
npm install --production

# Ejecutar migraciones
psql -U erp_user -d chemical_erp -f database/schema.sql
psql -U erp_user -d chemical_erp -f database/seed.sql

# Iniciar con PM2
pm2 start src/server.js --name "chemical-erp-backend"
pm2 save
pm2 startup
```

#### 4. Desplegar Frontend
```bash
cd /var/www/chemical-erp/frontend

# Instalar dependencias
npm install

# Construir para producción
npm run build

# Configurar Nginx para servir archivos estáticos
sudo nano /etc/nginx/sites-available/chemical-erp
```

Configuración de Nginx:
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        root /var/www/chemical-erp/frontend/build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

Activar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/chemical-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Configurar SSL con Let's Encrypt (Opcional pero recomendado)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

### Opción 2: Docker

#### 1. Crear Dockerfile para Backend
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

#### 2. Crear Dockerfile para Frontend
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Crear docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: chemical_erp
      POSTGRES_USER: erp_user
      POSTGRES_PASSWORD: tu_contraseña_segura
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/1-schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/2-seed.sql
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=chemical_erp
      - DB_USER=erp_user
      - DB_PASSWORD=tu_contraseña_segura
      - JWT_SECRET=your_super_secret_jwt_key_here
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### 4. Ejecutar con Docker
```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

### Opción 3: Cloud Services

#### Heroku
```bash
# Instalar Heroku CLI
npm install -g heroku

# Login
heroku login

# Crear aplicación
heroku create tu-app-name

# Configurar variables de entorno
heroku config:set NODE_ENV=production
heroku config:set DB_URL=postgresql://usuario:password@host:puerto/base_de_datos
heroku config:set JWT_SECRET=your_secret_key

# Desplegar
git push heroku main
```

#### Vercel (para frontend)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar frontend
cd frontend
vercel --prod
```

## Monitoreo y Mantenimiento

### 1. Logs y Monitoreo
```bash
# Ver logs de PM2
pm2 logs

# Ver estado de procesos
pm2 status

# Reiniciar aplicación
pm2 restart chemical-erp-backend

# Ver métricas
pm2 monit
```

### 2. Backups de Base de Datos
```bash
# Crear backup
pg_dump -U erp_user -h localhost chemical_erp > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
psql -U erp_user -h localhost chemical_erp < backup_20240324_120000.sql

# Backup automático (crontab)
0 2 * * * pg_dump -U erp_user -h localhost chemical_erp > /backups/chemical_erp_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

### 3. Actualizaciones
```bash
# Actualizar backend
cd /var/www/chemical-erp/backend
git pull origin main
npm install --production
pm2 restart chemical-erp-backend

# Actualizar frontend
cd /var/www/chemical-erp/frontend
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

## Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos
```bash
# Verificar estado de PostgreSQL
sudo systemctl status postgresql

# Verificar conexión
psql -U erp_user -h localhost -d chemical_erp

# Revisar logs de PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 2. Error de Puerto en Uso
```bash
# Verificar puertos en uso
sudo netstat -tlnp | grep :3001

# Matar proceso
sudo kill -9 <PID>
```

#### 3. Error de Permisos
```bash
# Corregir permisos
sudo chown -R www-data:www-data /var/www/chemical-erp
sudo chmod -R 755 /var/www/chemical-erp
```

#### 4. Error de Memoria
```bash
# Aumentar memoria de Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Configurar PM2 con límite de memoria
pm2 start src/server.js --name "chemical-erp-backend" --max-memory-restart 1G
```

### Logs Importantes

#### Backend Logs
```bash
# PM2 logs
pm2 logs chemical-erp-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Base de Datos Logs
```bash
# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

## Seguridad

### 1. Configuraciones de Seguridad
- Cambiar contraseñas por defecto
- Configurar firewall (UFW)
- Mantener software actualizado
- Usar HTTPS en producción
- Implementar rate limiting
- Validar todos los inputs

### 2. Firewall (UFW)
```bash
# Habilitar firewall
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Permitir PostgreSQL (solo local)
sudo ufw allow from 127.0.0.1 to any port 5432
```

### 3. Certificados SSL
```bash
# Renovar certificado Let's Encrypt
sudo certbot renew --dry-run

# Auto-renewal (crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

## Rendimiento

### 1. Optimización de Base de Datos
```sql
-- Crear índices adicionales si es necesario
CREATE INDEX CONCURRENTLY idx_production_orders_created_at 
ON production_orders(created_at);

-- Analizar tablas
ANALYZE production_orders;
ANALYZE quality_inspections;
ANALYZE laboratory_analyses;
```

### 2. Configuración de PM2 para Producción
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'chemical-erp-backend',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/chemical-erp-error.log',
    out_file: '/var/log/pm2/chemical-erp-out.log',
    log_file: '/var/log/pm2/chemical-erp-combined.log',
    time: true
  }]
};
```

Ejecutar con:
```bash
pm2 start ecosystem.config.js
```

## Soporte y Contacto

Para soporte técnico:
- Revisar logs de error
- Verificar documentación
- Contactar al equipo de desarrollo

---

**Nota**: Esta guía asume que tienes conocimientos básicos de administración de sistemas y bases de datos. Si necesitas ayuda adicional, considera contratar a un administrador de sistemas con experiencia en Node.js y PostgreSQL.

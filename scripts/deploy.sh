#!/bin/bash

# Script de Despliegue - ERP Sistema Químico Industrial
# Uso: ./scripts/deploy.sh [development|production|docker]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar requisitos
check_requirements() {
    log_info "Verificando requisitos..."
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js no está instalado. Por favor instala Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js versión 18+ requerida. Versión actual: $(node -v)"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        log_error "npm no está instalado"
        exit 1
    fi
    
    # Verificar PostgreSQL (si no es Docker)
    if [ "$ENVIRONMENT" != "docker" ]; then
        if ! command -v psql &> /dev/null; then
            log_error "PostgreSQL no está instalado"
            exit 1
        fi
    fi
    
    log_success "Requisitos verificados"
}

# Configurar variables de entorno
setup_environment() {
    log_info "Configurando variables de entorno..."
    
    # Backend
    if [ ! -f "backend/.env" ]; then
        log_warning "Creando archivo .env para backend..."
        cp backend/.env.example backend/.env
        
        # Generar JWT secret aleatorio
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s/your_super_secret_jwt_key_here/$JWT_SECRET/" backend/.env
        
        log_info "Por favor edita backend/.env con la configuración de tu base de datos"
    fi
    
    # Frontend
    if [ ! -f "frontend/.env" ]; then
        log_warning "Creando archivo .env para frontend..."
        cp frontend/.env.example frontend/.env
    fi
    
    log_success "Variables de entorno configuradas"
}

# Instalar dependencias
install_dependencies() {
    log_info "Instalando dependencias..."
    
    # Backend
    log_info "Instalando dependencias del backend..."
    cd backend
    npm ci --production
    cd ..
    
    # Frontend
    log_info "Instalando dependencias del frontend..."
    cd frontend
    npm ci
    cd ..
    
    log_success "Dependencias instaladas"
}

# Configurar base de datos
setup_database() {
    if [ "$ENVIRONMENT" = "docker" ]; then
        log_info "La base de datos se configurará automáticamente con Docker"
        return
    fi
    
    log_info "Configurando base de datos..."
    
    # Verificar si la base de datos existe
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
        log_warning "La base de datos ya existe. ¿Deseas reinicializarla? (y/N)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
            psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
        else
            log_info "Omitiendo configuración de base de datos"
            return
        fi
    else
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    fi
    
    # Ejecutar scripts SQL
    log_info "Ejecutando schema.sql..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql
    
    log_info "Ejecutando seed.sql..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/seed.sql
    
    log_success "Base de datos configurada"
}

# Construir frontend
build_frontend() {
    log_info "Construyendo frontend..."
    cd frontend
    npm run build
    cd ..
    log_success "Frontend construido"
}

# Despliegue de desarrollo
deploy_development() {
    log_info "Iniciando despliegue en modo desarrollo..."
    
    check_requirements
    setup_environment
    install_dependencies
    setup_database
    
    # Iniciar servicios en background
    log_info "Iniciando backend..."
    cd backend
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    log_info "Iniciando frontend..."
    cd frontend
    npm start > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # Guardar PIDs
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
    
    log_success "Despliegue en desarrollo completado"
    log_info "Backend: http://localhost:3001"
    log_info "Frontend: http://localhost:3000"
    log_info "Logs: logs/backend.log y logs/frontend.log"
    log_info "Para detener: ./scripts/stop.sh"
}

# Despliegue de producción
deploy_production() {
    log_info "Iniciando despliegue en modo producción..."
    
    check_requirements
    setup_environment
    install_dependencies
    setup_database
    build_frontend
    
    # Verificar PM2
    if ! command -v pm2 &> /dev/null; then
        log_info "Instalando PM2..."
        npm install -g pm2
    fi
    
    # Detener procesos existentes
    pm2 stop chemical-erp-backend 2>/dev/null || true
    pm2 delete chemical-erp-backend 2>/dev/null || true
    
    # Iniciar con PM2
    log_info "Iniciando backend con PM2..."
    cd backend
    pm2 start src/server.js --name "chemical-erp-backend" --env production
    cd ..
    
    pm2 save
    pm2 startup
    
    log_success "Despliegue en producción completado"
    log_info "Backend: http://localhost:3001"
    log_info "Para monitorear: pm2 monit"
    log_info "Para ver logs: pm2 logs"
}

# Despliegue con Docker
deploy_docker() {
    log_info "Iniciando despliegue con Docker..."
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose no está instalado"
        exit 1
    fi
    
    # Detener contenedores existentes
    log_info "Deteniendo contenedores existentes..."
    docker-compose down
    
    # Construir y ejecutar
    log_info "Construyendo y ejecutando contenedores..."
    docker-compose up --build -d
    
    # Esperar a que los servicios estén listos
    log_info "Esperando a que los servicios estén listos..."
    sleep 30
    
    # Verificar estado
    if docker-compose ps | grep -q "Up"; then
        log_success "Despliegue con Docker completado"
        log_info "Frontend: http://localhost:3000"
        log_info "Backend API: http://localhost:3001"
        log_info "Base de datos: localhost:5432"
        log_info "Para ver logs: docker-compose logs -f"
        log_info "Para detener: docker-compose down"
    else
        log_error "Error al iniciar los contenedores"
        docker-compose logs
        exit 1
    fi
}

# Función principal
main() {
    ENVIRONMENT=${1:-development}
    
    log_info "Iniciando despliegue - ERP Sistema Químico Industrial"
    log_info "Entorno: $ENVIRONMENT"
    
    # Crear directorio de logs
    mkdir -p logs
    
    case $ENVIRONMENT in
        "development")
            deploy_development
            ;;
        "production")
            deploy_production
            ;;
        "docker")
            deploy_docker
            ;;
        *)
            log_error "Entorno no válido. Opciones: development, production, docker"
            exit 1
            ;;
    esac
}

# Ejecutar script
main "$@"

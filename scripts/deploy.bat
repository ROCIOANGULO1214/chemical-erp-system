@echo off
REM Script de Despliegue - ERP Sistema Químico Industrial (Windows)
REM Uso: deploy.bat [development|production|docker]

setlocal enabledelayedexpansion

REM Configuración de colores (limitado en Windows)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Funciones de logging
:log_info
echo %INFO% %~1
goto :eof

:log_success
echo %SUCCESS% %~1
goto :eof

:log_warning
echo %WARNING% %~1
goto :eof

:log_error
echo %ERROR% %~1
goto :eof

REM Verificar requisitos
:check_requirements
call :log_info "Verificando requisitos..."

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Node.js no está instalado. Por favor instala Node.js 18+"
    exit /b 1
)

REM Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    call :log_error "npm no está instalado"
    exit /b 1
)

call :log_success "Requisitos verificados"
goto :eof

REM Configurar variables de entorno
:setup_environment
call :log_info "Configurando variables de entorno..."

REM Backend
if not exist "backend\.env" (
    call :log_warning "Creando archivo .env para backend..."
    copy "backend\.env.example" "backend\.env" >nul
    call :log_info "Por favor edita backend\.env con la configuración de tu base de datos"
)

REM Frontend
if not exist "frontend\.env" (
    call :log_warning "Creando archivo .env para frontend..."
    copy "frontend\.env.example" "frontend\.env" >nul
)

call :log_success "Variables de entorno configuradas"
goto :eof

REM Instalar dependencias
:install_dependencies
call :log_info "Instalando dependencias..."

REM Backend
call :log_info "Instalando dependencias del backend..."
cd backend
npm ci --production
if errorlevel 1 (
    call :log_error "Error instalando dependencias del backend"
    cd ..
    exit /b 1
)
cd ..

REM Frontend
call :log_info "Instalando dependencias del frontend..."
cd frontend
npm ci
if errorlevel 1 (
    call :log_error "Error instalando dependencias del frontend"
    cd ..
    exit /b 1
)
cd ..

call :log_success "Dependencias instaladas"
goto :eof

REM Construir frontend
:build_frontend
call :log_info "Construyendo frontend..."
cd frontend
npm run build
if errorlevel 1 (
    call :log_error "Error construyendo frontend"
    cd ..
    exit /b 1
)
cd ..
call :log_success "Frontend construido"
goto :eof

REM Despliegue de desarrollo
:deploy_development
call :log_info "Iniciando despliegue en modo desarrollo..."

call :check_requirements
call :setup_environment
call :install_dependencies

REM Crear directorio de logs
if not exist "logs" mkdir logs

REM Iniciar backend
call :log_info "Iniciando backend..."
cd backend
start "Backend" cmd /k "npm run dev"
cd ..

REM Esperar un momento
timeout /t 3 /nobreak >nul

REM Iniciar frontend
call :log_info "Iniciando frontend..."
cd frontend
start "Frontend" cmd /k "npm start"
cd ..

call :log_success "Despliegue en desarrollo completado"
call :log_info "Backend: http://localhost:3001"
call :log_info "Frontend: http://localhost:3000"
call :log_info "Las ventanas de consola se han abierto para cada servicio"
goto :eof

REM Despliegue de producción
:deploy_production
call :log_info "Iniciando despliegue en modo producción..."

call :check_requirements
call :setup_environment
call :install_dependencies
call :build_frontend

REM Verificar PM2
pm2 --version >nul 2>&1
if errorlevel 1 (
    call :log_info "Instalando PM2..."
    npm install -g pm2
)

REM Detener procesos existentes
pm2 stop chemical-erp-backend >nul 2>&1
pm2 delete chemical-erp-backend >nul 2>&1

REM Iniciar con PM2
call :log_info "Iniciando backend con PM2..."
cd backend
pm2 start src/server.js --name "chemical-erp-backend" --env production
cd ..

pm2 save
pm2 startup

call :log_success "Despliegue en producción completado"
call :log_info "Backend: http://localhost:3001"
call :log_info "Para monitorear: pm2 monit"
call :log_info "Para ver logs: pm2 logs"
goto :eof

REM Despliegue con Docker
:deploy_docker
call :log_info "Iniciando despliegue con Docker..."

REM Verificar Docker
docker --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker no está instalado"
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Docker Compose no está instalado"
    exit /b 1
)

REM Detener contenedores existentes
call :log_info "Deteniendo contenedores existentes..."
docker-compose down

REM Construir y ejecutar
call :log_info "Construyendo y ejecutando contenedores..."
docker-compose up --build -d

REM Esperar a que los servicios estén listos
call :log_info "Esperando a que los servicios estén listos..."
timeout /t 30 /nobreak >nul

REM Verificar estado
docker-compose ps | findstr "Up" >nul
if errorlevel 1 (
    call :log_error "Error al iniciar los contenedores"
    docker-compose logs
    exit /b 1
)

call :log_success "Despliegue con Docker completado"
call :log_info "Frontend: http://localhost:3000"
call :log_info "Backend API: http://localhost:3001"
call :log_info "Base de datos: localhost:5432"
call :log_info "Para ver logs: docker-compose logs -f"
call :log_info "Para detener: docker-compose down"
goto :eof

REM Función principal
:main
set "ENVIRONMENT=%1"
if "%ENVIRONMENT%"=="" set "ENVIRONMENT=development"

call :log_info "Iniciando despliegue - ERP Sistema Químico Industrial"
call :log_info "Entorno: %ENVIRONMENT%"

if "%ENVIRONMENT%"=="development" (
    call :deploy_development
) else if "%ENVIRONMENT%"=="production" (
    call :deploy_production
) else if "%ENVIRONMENT%"=="docker" (
    call :deploy_docker
) else (
    call :log_error "Entorno no válido. Opciones: development, production, docker"
    exit /b 1
)

goto :eof

REM Ejecutar script
call :main %*

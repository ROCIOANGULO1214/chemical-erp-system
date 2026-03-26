@echo off
echo ========================================
echo ERP Sistema Químico - MODO DEMO
echo ========================================
echo.
echo Este es un modo demostración que no requiere PostgreSQL
echo Incluye datos simulados para todos los módulos
echo.

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado.
    echo [INFO] Descargando e instalando Node.js automáticamente...
    
    :: Descargar Node.js usando PowerShell
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi' -OutFile 'node-installer.msi'}"
    
    echo [INFO] Ejecutando instalador de Node.js...
    msiexec /i node-installer.msi /quiet /norestart
    
    :: Esperar a que la instalación complete
    echo [INFO] Esperando instalación de Node.js...
    timeout /t 60 /nobreak >nul
    
    :: Limpiar archivo
    del node-installer.msi
    
    echo [SUCCESS] Node.js instalado. Por favor reinicia tu terminal y ejecuta este script nuevamente.
    pause
    exit /b 0
) else (
    echo [SUCCESS] Node.js encontrado:
    node --version
)

:: Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm no está instalado.
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm encontrado:
    npm --version
)

echo.
echo ========================================
echo Instalando dependencias del backend demo
echo ========================================
echo.

cd backend

:: Usar package-demo.json
if exist "package-demo.json" (
    echo [INFO] Usando configuración demo...
    copy package-demo.json package.json >nul
)

:: Instalar dependencias
echo [INFO] Instalando dependencias...
npm install
if errorlevel 1 (
    echo [ERROR] Error instalando dependencias
    cd ..
    pause
    exit /b 1
)

echo [SUCCESS] Dependencias instaladas
cd ..

echo.
echo ========================================
echo Instalando dependencias del frontend
echo ========================================
echo.

cd frontend
npm install
if errorlevel 1 (
    echo [ERROR] Error instalando dependencias del frontend
    cd ..
    pause
    exit /b 1
)

echo [SUCCESS] Dependencias del frontend instaladas
cd ..

echo.
echo ========================================
echo Configurando variables de entorno
echo ========================================
echo.

:: Backend .env
if not exist "backend\.env" (
    echo [INFO] Creando archivo .env para backend...
    copy "backend\.env.example" "backend\.env" >nul
) else (
    echo [SUCCESS] Archivo .env de backend ya existe
)

:: Frontend .env
if not exist "frontend\.env" (
    echo [INFO] Creando archivo .env para frontend...
    copy "frontend\.env.example" "frontend\.env" >nul
) else (
    echo [SUCCESS] Archivo .env de frontend ya existe
)

echo.
echo ========================================
echo Iniciando Sistema ERP - Modo Demo
echo ========================================
echo.

:: Crear directorio de logs
if not exist "logs" mkdir logs

:: Iniciar backend demo
echo [INFO] Iniciando backend en modo demo (puerto 3001)...
cd backend
start "Backend Demo - ERP Químico" cmd /k "node src/server-demo.js"
cd ..

:: Esperar a que el backend inicie
echo [INFO] Esperando a que el backend inicie...
timeout /t 5 /nobreak >nul

:: Iniciar frontend
echo [INFO] Iniciando frontend (puerto 3000)...
cd frontend
start "Frontend - ERP Químico" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo ¡ERP Sistema Químico INICIADO!
echo ========================================
echo.
echo 🚀 MODO DEMO ACTIVO
echo 📊 Base de datos: Simulada (no requiere PostgreSQL)
echo 🎯 Todos los módulos funcionales con datos de ejemplo
echo.
echo 📱 Acceso a la aplicación:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:3001
echo    Health Check: http://localhost:3001/api/health
echo.
echo 👤 Usuarios de demostración:
echo    • Administrador: admin / admin123
echo    • Operador: jsmith / operator123
echo.
echo 📋 Módulos disponibles:
echo    ✓ Producción - Órdenes de trabajo y procesos
echo    ✓ Calidad - Inspecciones y no conformidades  
echo    ✓ Inventario - Control de materias primas
echo    ✓ Laboratorio - Análisis químicos
echo    ✓ Clientes - Gestión de órdenes
echo    ✓ Reportes - KPIs y estadísticas
echo.
echo 📝 Las ventanas de consola se han abierto para cada servicio.
echo    Para detener: cierra las ventanas de consola.
echo.
echo 🔄 Para producción: instala PostgreSQL y ejecuta scripts\setup-postgres.bat
echo.

:: Esperar un momento antes de abrir el navegador
timeout /t 3 /nobreak >nul

:: Abrir navegador automáticamente
start http://localhost:3000

echo [SUCCESS] ¡Sistema demo iniciado correctamente!
echo.
echo 🎉 ¡Bienvenido al ERP Sistema Químico Industrial!
echo.
pause

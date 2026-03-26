@echo off
echo ========================================
echo Iniciando ERP Sistema Químico - Modo Desarrollo
echo ========================================
echo.

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no está instalado. Ejecuta scripts\install-dependencies.bat primero.
    pause
    exit /b 1
)

:: Verificar si las dependencias están instaladas
if not exist "backend\node_modules" (
    echo [ERROR] Dependencias del backend no instaladas. Ejecuta scripts\install-dependencies.bat primero.
    pause
    exit /b 1
)

if not exist "frontend\node_modules" (
    echo [ERROR] Dependencias del frontend no instaladas. Ejecuta scripts\install-dependencies.bat primero.
    pause
    exit /b 1
)

:: Verificar archivos .env
if not exist "backend\.env" (
    echo [WARNING] Archivo backend\.env no encontrado. Usando configuración por defecto.
    copy "backend\.env.example" "backend\.env" >nul
)

if not exist "frontend\.env" (
    echo [WARNING] Archivo frontend\.env no encontrado. Usando configuración por defecto.
    copy "frontend\.env.example" "frontend\.env" >nul
)

echo [INFO] Iniciando servicios...

:: Crear directorio de logs si no existe
if not exist "logs" mkdir logs

:: Iniciar backend
echo [INFO] Iniciando backend en puerto 3001...
cd backend
start "Backend - ERP Químico" cmd /k "npm run dev"
cd ..

:: Esperar un momento para que el backend inicie
echo [INFO] Esperando a que el backend inicie...
timeout /t 5 /nobreak >nul

:: Iniciar frontend
echo [INFO] Iniciando frontend en puerto 3000...
cd frontend
start "Frontend - ERP Químico" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo ¡ERP Sistema Químico iniciado!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:3001
echo Health Check: http://localhost:3001/api/health
echo.
echo Usuario por defecto:
echo   Usuario: admin
echo   Contraseña: admin123
echo.
echo Las ventanas de consola se han abierto para cada servicio.
echo Para detener los servicios, cierra las ventanas de consola.
echo.
echo Presiona cualquier tecla para abrir el navegador...
pause >nul

:: Abrir navegador
start http://localhost:3000

echo.
echo [SUCCESS] ¡Sistema iniciado correctamente!
echo Para detener: cierra las ventanas de consola abiertas.
echo.
pause

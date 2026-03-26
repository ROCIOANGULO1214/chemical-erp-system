@echo off
echo ========================================
echo Instalando Dependencias - ERP Quimico
echo ========================================
echo.

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [INFO] Node.js no está instalado. Descargando e instalando...
    
    :: Descargar Node.js usando PowerShell
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi' -OutFile 'node-installer.msi'}"
    
    echo [INFO] Ejecutando instalador de Node.js...
    msiexec /i node-installer.msi /quiet /norestart
    
    :: Esperar a que la instalación complete
    timeout /t 30 /nobreak >nul
    
    :: Limpiar archivo
    del node-installer.msi
    
    echo [SUCCESS] Node.js instalado. Por favor reinicia tu terminal y ejecuta este script nuevamente.
    pause
    exit /b 0
) else (
    echo [SUCCESS] Node.js ya está instalado:
    node --version
)

:: Verificar npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm no está instalado. Por favor reinstala Node.js.
    pause
    exit /b 1
) else (
    echo [SUCCESS] npm está instalado:
    npm --version
)

echo.
echo ========================================
echo Instalando dependencias del proyecto
echo ========================================
echo.

:: Backend
echo [INFO] Instalando dependencias del backend...
cd backend
npm install
if errorlevel 1 (
    echo [ERROR] Error instalando dependencias del backend
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] Dependencias del backend instaladas
cd ..

:: Frontend
echo [INFO] Instalando dependencias del frontend...
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
    echo [WARNING] Por favor edita backend\.env con tu configuración de base de datos
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
echo Instalación completada!
echo ========================================
echo.
echo Siguientes pasos:
echo 1. Instala PostgreSQL (https://www.postgresql.org/download/windows/)
echo 2. Crea una base de datos llamada 'chemical_erp'
echo 3. Ejecuta los scripts SQL:
echo    - database\schema.sql
echo    - database\seed.sql
echo 4. Ejecuta: scripts\deploy.bat development
echo.
echo Para iniciar rápido con datos de ejemplo, ejecuta:
echo scripts\deploy.bat development
echo.
pause

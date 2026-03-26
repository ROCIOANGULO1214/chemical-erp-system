@echo off
echo ========================================
echo Configuración de PostgreSQL - ERP Quimico
echo ========================================
echo.

:: Verificar si psql está disponible
psql --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PostgreSQL no está instalado o no está en el PATH
    echo [INFO] Por favor instala PostgreSQL desde: https://www.postgresql.org/download/windows/
    echo [INFO] Después de instalar, asegúrate de agregar PostgreSQL al PATH del sistema
    pause
    exit /b 1
)

echo [SUCCESS] PostgreSQL encontrado:
psql --version

echo.
echo [INFO] Configurando base de datos...

:: Variables de configuración
set DB_NAME=chemical_erp
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432

:: Crear base de datos
echo [INFO] Creando base de datos '%DB_NAME%'...
createdb -h %DB_HOST% -p %DB_PORT% -U %DB_USER% %DB_NAME% 2>nul
if errorlevel 1 (
    echo [WARNING] La base de datos ya existe o hubo un error al crearla
) else (
    echo [SUCCESS] Base de datos creada
)

:: Ejecutar schema.sql
echo [INFO] Ejecutando schema.sql...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database\schema.sql
if errorlevel 1 (
    echo [ERROR] Error ejecutando schema.sql
    pause
    exit /b 1
)
echo [SUCCESS] Schema creado

:: Ejecutar seed.sql
echo [INFO] Ejecutando seed.sql...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database\seed.sql
if errorlevel 1 (
    echo [ERROR] Error ejecutando seed.sql
    pause
    exit /b 1
)
echo [SUCCESS] Datos de ejemplo insertados

echo.
echo ========================================
echo Configuración de PostgreSQL completada!
echo ========================================
echo.
echo Base de datos: %DB_NAME%
echo Host: %DB_HOST%
echo Puerto: %DB_PORT%
echo Usuario: %DB_USER%
echo.
echo Ahora puedes ejecutar: scripts\deploy.bat development
echo.
pause

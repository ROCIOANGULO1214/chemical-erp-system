# 🚀 Inicio Rápido - ERP Sistema Químico Industrial

## Despliegue Inmediato

### Opción 1: Docker (Recomendado)
```bash
# Clonar el repositorio
git clone <repository-url>
cd chemical-erp-system

# Ejecutar con Docker
docker-compose up --build -d

# Acceder a la aplicación
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# Base de datos: localhost:5432
```

### Opción 2: Windows (Script Automatizado)
```cmd
# Ejecutar script de despliegue
scripts\deploy.bat docker
```

### Opción 3: Linux/Mac (Script Automatizado)
```bash
# Hacer ejecutable el script
chmod +x scripts/deploy.sh

# Ejecutar despliegue
./scripts/deploy.sh docker
```

## Acceso por Defecto

### Usuario Administrador
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Usuarios de Ejemplo
- **Operador**: `jsmith` / `operator123`
- **Calidad**: `mgarcia` / `quality123`
- **Laboratorio**: `rlopez` / `lab123`
- **Supervisor**: `amartinez` / `supervisor123`

## Características Principales

### 🏭 Producción
- Gestión de órdenes de trabajo
- Control de procesos químicos
- Trazabilidad por lote
- Líneas de producción (Anodizado, Zinc Plating, Cromatizado)

### 🔬 Calidad
- Inspecciones y no conformidades
- Acciones CAPA (Correctivas/Preventivas)
- Auditorías internas ISO 9001:2015
- Control de especificaciones

### 📦 Inventario
- Control de materias primas químicas
- Alertas de stock mínimo
- Gestión de consumo por lote
- Control de materiales peligrosos

### 🧪 Laboratorio
- Análisis químicos (pH, concentración, titulaciones)
- Tendencias y gráficos
- Control de baños químicos
- Validación de resultados

### 👥 Clientes
- Gestión de órdenes de cliente
- Especificaciones técnicas
- Historial de trabajos
- Tracking de entregas

### 📊 Reportes
- KPIs en tiempo real
- Reportes de producción y calidad
- Exportación a Excel/PDF
- Dashboard interactivo

## Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   React +       │◄──►│   Node.js +     │◄──►│   Database      │
│   Tailwind      │    │   Express       │    │                 │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Requisitos Mínimos

### Sistema
- **RAM**: 4GB mínimo, 8GB recomendado
- **CPU**: 2 cores mínimo, 4 cores recomendado
- **Almacenamiento**: 20GB disponible
- **SO**: Windows 10+, Linux, macOS

### Software
- Docker & Docker Compose (recomendado)
- Node.js 18+ (alternativa)
- PostgreSQL 14+ (alternativa)

## Verificación de Instalación

### Health Check
```bash
# Verificar estado del backend
curl http://localhost:3001/api/health

# Respuesta esperada:
# {
#   "status": "OK",
#   "timestamp": "2024-03-24T...",
#   "uptime": 123.45,
#   "environment": "production"
# }
```

### Verificación de Servicios
```bash
# Docker
docker-compose ps

# Debería mostrar todos los servicios como "Up"

# Logs
docker-compose logs -f
```

## Primeros Pasos

### 1. Iniciar Sesión
1. Abre http://localhost:3000 en tu navegador
2. Inicia sesión como `admin` / `admin123`
3. Explora el dashboard principal

### 2. Explorar Módulos
- **Producción**: Crea una orden de trabajo
- **Calidad**: Registra una inspección
- **Inventario**: Revisa las alertas de stock
- **Laboratorio**: Registra un análisis químico

### 3. Configurar Personalización
- Modifica usuarios y roles
- Configura líneas de producción
- Ajusta especificaciones de cliente

## Soporte y Troubleshooting

### Problemas Comunes

#### Docker no inicia
```bash
# Verificar Docker
docker --version
docker-compose --version

# Reiniciar Docker
sudo systemctl restart docker  # Linux
# O reiniciar Docker Desktop (Windows/Mac)
```

#### Error de conexión a base de datos
```bash
# Verificar contenedor de base de datos
docker-compose logs postgres

# Reiniciar base de datos
docker-compose restart postgres
```

#### Puerto en uso
```bash
# Verificar puertos
netstat -tlnp | grep :3000
netstat -tlnp | grep :3001

# Cambiar puertos en docker-compose.yml
```

### Logs y Monitoreo
```bash
# Ver todos los logs
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Resetear Sistema
```bash
# Detener y eliminar todo
docker-compose down -v

# Reiniciar desde cero
docker-compose up --build -d
```

## Personalización

### Cambiar Contraseñas
1. Inicia sesión como admin
2. Ve a Configuración > Usuarios
3. Modifica las contraseñas por defecto

### Configurar Empresa
1. Ve a Configuración > Empresa
2. Actualiza nombre, logo y datos de contacto

### Personalizar Especificaciones
1. Ve a Clientes > Especificaciones
2. Crea tus propias especificaciones técnicas

## Próximos Pasos

### Producción
- Configurar dominio personalizado
- Implementar SSL/TLS
- Configurar backups automáticos
- Monitoreo y alertas

### Extensiones
- Integración con sistemas externos
- Módulos adicionales
- APIs personalizadas
- Reportes avanzados

---

## 📞 Soporte

Para soporte técnico:
1. Revisa los logs del sistema
2. Consulta la documentación completa
3. Contacta al equipo de desarrollo

**¡Bienvenido al ERP Sistema Químico Industrial!** 🎉

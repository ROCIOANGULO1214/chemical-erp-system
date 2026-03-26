const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const productionRoutes = require('./routes/production');
const qualityRoutes = require('./routes/quality');
const inventoryRoutes = require('./routes/inventory');
const laboratoryRoutes = require('./routes/laboratory');
const customersRoutes = require('./routes/customers');
const reportsRoutes = require('./routes/reports');
const productsRoutes = require('./routes/products');

const errorHandler = require('./middleware/errorHandler');
const { connectDB } = require('./config/database-demo'); // Usar base de datos demo

const app = express();
const PORT = process.env.PORT || 3001;

// Conexión a la base de datos demo
connectDB();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Middlewares generales
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/laboratory', laboratoryRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/products', productsRoutes);

// Ruta de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'demo',
    database: 'demo-mode',
    message: 'Running in demo mode with simulated data'
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'demo'}`);
  console.log(`🗄️ Database: Demo Mode (Simulated Data)`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`⚠️  This is a demo version with simulated data`);
  console.log(`📝 To use real database, install PostgreSQL and run: npm run dev`);
});

module.exports = app;

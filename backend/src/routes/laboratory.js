const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getLaboratoryAnalyses,
  getLaboratoryAnalysisById,
  createLaboratoryAnalysis,
  getLaboratoryTrends,
  getAnalysesByBath,
  getRecentBathAnalyses,
  getLaboratoryKPIs
} = require('../controllers/laboratoryController');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Análisis de Laboratorio
router.get('/analyses', getLaboratoryAnalyses);
router.get('/analyses/:id', getLaboratoryAnalysisById);
router.post('/analyses', authorizeRole(['admin', 'lab_technician', 'quality']), createLaboratoryAnalysis);

// Tendencias de Laboratorio
router.get('/trends', getLaboratoryTrends);

// Análisis por Baño
router.get('/bath/:bath_name/analyses', getAnalysesByBath);

// Análisis Recientes por Baño
router.get('/bath/recent-analyses', getRecentBathAnalyses);

// KPIs de Laboratorio
router.get('/kpis', getLaboratoryKPIs);

module.exports = router;

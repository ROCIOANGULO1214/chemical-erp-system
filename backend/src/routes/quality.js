const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getQualityInspections,
  getQualityInspectionById,
  createQualityInspection,
  updateQualityInspection,
  getNonConformities,
  createNonConformity,
  getCapaActions,
  createCapaAction,
  getInternalAudits,
  getQualityKPIs
} = require('../controllers/qualityController');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Inspecciones de calidad
router.get('/inspections', getQualityInspections);
router.get('/inspections/:id', getQualityInspectionById);
router.post('/inspections', authorizeRole(['admin', 'quality', 'supervisor']), createQualityInspection);
router.put('/inspections/:id', authorizeRole(['admin', 'quality', 'supervisor']), updateQualityInspection);

// No conformidades
router.get('/non-conformities', getNonConformities);
router.post('/non-conformities', authorizeRole(['admin', 'quality', 'supervisor']), createNonConformity);

// Acciones CAPA
router.get('/capa-actions', getCapaActions);
router.post('/capa-actions', authorizeRole(['admin', 'quality', 'supervisor']), createCapaAction);

// Auditorías internas
router.get('/audits', getInternalAudits);

// KPIs de calidad
router.get('/kpis', getQualityKPIs);

module.exports = router;

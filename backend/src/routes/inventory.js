const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getRawMaterials,
  getRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  getMaterialConsumption,
  createMaterialConsumption,
  getInventoryAlerts,
  getInventoryKPIs
} = require('../controllers/inventoryController');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Materias Primas
router.get('/raw-materials', getRawMaterials);
router.get('/raw-materials/:id', getRawMaterialById);
router.post('/raw-materials', authorizeRole(['admin', 'supervisor']), createRawMaterial);
router.put('/raw-materials/:id', authorizeRole(['admin', 'supervisor']), updateRawMaterial);

// Consumo de Materias Primas
router.get('/consumption', getMaterialConsumption);
router.post('/consumption', authorizeRole(['admin', 'supervisor', 'operator']), createMaterialConsumption);

// Alertas de Inventario
router.get('/alerts', getInventoryAlerts);

// KPIs de Inventario
router.get('/kpis', getInventoryKPIs);

module.exports = router;

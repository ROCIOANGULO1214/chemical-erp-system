const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getProductionOrders,
  getProductionOrderById,
  createProductionOrder,
  updateProductionOrder,
  getProductionLines,
  getChemicalProcesses,
  createProcessRecord,
  getProcessRecords,
  getProductionKPIs
} = require('../controllers/productionController');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Órdenes de producción
router.get('/orders', getProductionOrders);
router.get('/orders/:id', getProductionOrderById);
router.post('/orders', authorizeRole(['admin', 'supervisor']), createProductionOrder);
router.put('/orders/:id', authorizeRole(['admin', 'supervisor', 'operator']), updateProductionOrder);

// Líneas de producción
router.get('/lines', getProductionLines);

// Procesos químicos
router.get('/lines/:production_line_id/processes', getChemicalProcesses);

// Registros de proceso
router.post('/process-records', authorizeRole(['admin', 'supervisor', 'operator']), createProcessRecord);
router.get('/orders/:production_order_id/process-records', getProcessRecords);

// KPIs de producción
router.get('/kpis', getProductionKPIs);

module.exports = router;

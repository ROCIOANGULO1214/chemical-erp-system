const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerSpecifications,
  createCustomerSpecification,
  getCustomerOrders,
  createCustomerOrder,
  getCustomersKPIs
} = require('../controllers/customersController');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Clientes
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', authorizeRole(['admin', 'supervisor']), createCustomer);
router.put('/:id', authorizeRole(['admin', 'supervisor']), updateCustomer);

// Especificaciones de Cliente
router.get('/specifications', getCustomerSpecifications);
router.post('/specifications', authorizeRole(['admin', 'supervisor']), createCustomerSpecification);

// Órdenes de Cliente
router.get('/orders/all', getCustomerOrders);
router.post('/orders', authorizeRole(['admin', 'supervisor']), createCustomerOrder);

// KPIs de Clientes
router.get('/kpis', getCustomersKPIs);

module.exports = router;

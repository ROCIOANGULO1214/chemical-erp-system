const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Generar número de orden de trabajo
const generateWorkOrderNumber = async () => {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM production_orders 
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    
    const result = await pool.query(query);
    const count = parseInt(result.rows[0].count) + 1;
    
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = String(count).padStart(4, '0');
    
    return `WO-${year}-${month}-${sequence}`;
  } catch (error) {
    console.error('Error generating work order number:', error);
    throw new Error('No se pudo generar el número de orden de trabajo');
  }
};

// Generar número de análisis
const generateAnalysisNumber = async () => {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM laboratory_analyses 
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    
    const result = await pool.query(query);
    const count = parseInt(result.rows[0].count) + 1;
    
    const date = new Date();
    const year = date.getFullYear();
    const sequence = String(count).padStart(5, '0');
    
    return `AN-${year}-${sequence}`;
  } catch (error) {
    console.error('Error generating analysis number:', error);
    throw new Error('No se pudo generar el número de análisis');
  }
};

// Generar número de orden de cliente
const generateCustomerOrderNumber = async () => {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM customer_orders 
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    
    const result = await pool.query(query);
    const count = parseInt(result.rows[0].count) + 1;
    
    const date = new Date();
    const year = date.getFullYear();
    const sequence = String(count).padStart(4, '0');
    
    return `ORD-${year}-${sequence}`;
  } catch (error) {
    console.error('Error generating customer order number:', error);
    throw new Error('No se pudo generar el número de orden de cliente');
  }
};

// Generar número de inspección
const generateInspectionNumber = async () => {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM quality_inspections 
      WHERE DATE(created_at) = CURRENT_DATE
    `;
    
    const result = await pool.query(query);
    const count = parseInt(result.rows[0].count) + 1;
    
    const date = new Date();
    const year = date.getFullYear();
    const sequence = String(count).padStart(4, '0');
    
    return `IN-${year}-${sequence}`;
  } catch (error) {
    console.error('Error generating inspection number:', error);
    throw new Error('No se pudo generar el número de inspección');
  }
};

// Validar formato de email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validar formato de teléfono (mexicano)
const validatePhone = (phone) => {
  const phoneRegex = /^(\+52)?\s?(\d{2,3})?\s?\d{3}\s?\d{4}$/;
  return phoneRegex.test(phone);
};

// Formatear fecha para base de datos
const formatDateForDB = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString();
};

// Calcular días entre dos fechas
const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Generar código aleatorio
const generateRandomCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Calcular eficiencia de producción
const calculateProductionEfficiency = (planned, produced, scrap = 0) => {
  if (!planned || planned === 0) return 0;
  const effectiveProduced = produced - scrap;
  return ((effectiveProduced / planned) * 100).toFixed(2);
};

// Calcular tasa de scrap
const calculateScrapRate = (planned, scrap) => {
  if (!planned || planned === 0) return 0;
  return ((scrap / planned) * 100).toFixed(2);
};

// Formatear moneda
const formatCurrency = (amount, currency = 'MXN') => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Validar que un valor esté dentro de un rango
const isWithinRange = (value, min, max) => {
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  return true;
};

// Generar UUID
const generateUUID = () => {
  return uuidv4();
};

// Sanitizar string para prevenir SQL injection (básico)
const sanitizeString = (str) => {
  if (!str) return '';
  return str.replace(/['"\\;]/g, '');
};

// Paginar resultados
const paginateResults = (data, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: data.slice(startIndex, endIndex),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: data.length,
      totalPages: Math.ceil(data.length / limit),
      hasNext: endIndex < data.length,
      hasPrev: page > 1
    }
  };
};

module.exports = {
  generateWorkOrderNumber,
  generateAnalysisNumber,
  generateCustomerOrderNumber,
  generateInspectionNumber,
  validateEmail,
  validatePhone,
  formatDateForDB,
  calculateDaysBetween,
  generateRandomCode,
  calculateProductionEfficiency,
  calculateScrapRate,
  formatCurrency,
  isWithinRange,
  generateUUID,
  sanitizeString,
  paginateResults
};

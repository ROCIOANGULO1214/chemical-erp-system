const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Reportes de Producción
router.get('/production', async (req, res) => {
  try {
    const { start_date, end_date, production_line_id } = req.query;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        po.work_order_number,
        po.quantity_planned,
        po.quantity_produced,
        po.quantity_scrap,
        po.start_date,
        po.end_date,
        po.status,
        c.name as customer_name,
        pl.name as production_line_name,
        pl.process_type,
        u.first_name || ' ' || u.last_name as operator_name,
        CASE 
          WHEN po.quantity_planned > 0 THEN 
            ROUND((po.quantity_produced::DECIMAL / po.quantity_planned::DECIMAL) * 100, 2)
          ELSE 0 
        END as efficiency_percentage
      FROM production_orders po
      LEFT JOIN customer_orders co ON po.customer_order_id = co.id
      LEFT JOIN customers c ON co.customer_id = c.id
      LEFT JOIN production_lines pl ON po.production_line_id = pl.id
      LEFT JOIN users u ON po.operator_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (start_date) {
      query += ` AND po.start_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND po.start_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    if (production_line_id) {
      query += ` AND po.production_line_id = $${paramIndex++}`;
      params.push(production_line_id);
    }
    
    query += ' ORDER BY po.start_date DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error generating production report:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Reportes de Calidad
router.get('/quality', async (req, res) => {
  try {
    const { start_date, end_date, inspection_type } = req.query;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        qi.inspection_date,
        qi.inspection_type,
        qi.status,
        qi.non_conformities_found,
        po.work_order_number,
        c.name as customer_name,
        pl.name as production_line_name,
        u.first_name || ' ' || u.last_name as inspector_name
      FROM quality_inspections qi
      LEFT JOIN production_orders po ON qi.production_order_id = po.id
      LEFT JOIN customer_orders co ON po.customer_order_id = co.id
      LEFT JOIN customers c ON co.customer_id = c.id
      LEFT JOIN production_lines pl ON po.production_line_id = pl.id
      LEFT JOIN users u ON qi.inspector_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (start_date) {
      query += ` AND qi.inspection_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND qi.inspection_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    if (inspection_type) {
      query += ` AND qi.inspection_type = $${paramIndex++}`;
      params.push(inspection_type);
    }
    
    query += ' ORDER BY qi.inspection_date DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error generating quality report:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Reportes de Inventario
router.get('/inventory', async (req, res) => {
  try {
    const { category, stock_status } = req.query;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        rm.code,
        rm.name,
        rm.chemical_type,
        rm.current_stock,
        rm.minimum_stock,
        rm.maximum_stock,
        rm.unit_of_measure,
        rm.cost_per_unit,
        ROUND(rm.current_stock * rm.cost_per_unit, 2) as total_value,
        CASE 
          WHEN rm.current_stock <= rm.minimum_stock THEN 'CRITICAL'
          WHEN rm.current_stock <= (rm.minimum_stock * 1.2) THEN 'LOW'
          WHEN rm.current_stock >= rm.maximum_stock THEN 'OVERSTOCK'
          ELSE 'NORMAL'
        END as stock_status,
        rm.hazardous
      FROM raw_materials rm
      WHERE rm.is_active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND rm.chemical_type = $${paramIndex++}`;
      params.push(category);
    }
    
    if (stock_status) {
      if (stock_status === 'critical') {
        query += ` AND rm.current_stock <= rm.minimum_stock`;
      } else if (stock_status === 'low') {
        query += ` AND rm.current_stock > rm.minimum_stock AND rm.current_stock <= (rm.minimum_stock * 1.2)`;
      } else if (stock_status === 'overstock') {
        query += ` AND rm.current_stock >= rm.maximum_stock`;
      } else if (stock_status === 'normal') {
        query += ` AND rm.current_stock > (rm.minimum_stock * 1.2) AND rm.current_stock < rm.maximum_stock`;
      }
    }
    
    query += ' ORDER BY rm.name';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error generating inventory report:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Reportes de Laboratorio
router.get('/laboratory', async (req, res) => {
  try {
    const { start_date, end_date, analysis_type, bath_name } = req.query;
    
    const { pool } = require('../config/database');
    
    let query = `
      SELECT 
        la.analysis_number,
        la.analysis_date,
        la.analysis_type,
        la.bath_name,
        la.is_within_specification,
        la.observations,
        pl.name as production_line_name,
        u.first_name || ' ' || u.last_name as analyst_name
      FROM laboratory_analyses la
      LEFT JOIN production_lines pl ON la.production_line_id = pl.id
      LEFT JOIN users u ON la.analyst_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (start_date) {
      query += ` AND la.analysis_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND la.analysis_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    if (analysis_type) {
      query += ` AND la.analysis_type = $${paramIndex++}`;
      params.push(analysis_type);
    }
    
    if (bath_name) {
      query += ` AND la.bath_name ILIKE $${paramIndex++}`;
      params.push(`%${bath_name}%`);
    }
    
    query += ' ORDER BY la.analysis_date DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error generating laboratory report:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// KPIs Generales
router.get('/kpis', async (req, res) => {
  try {
    const { period_start, period_end } = req.query;
    
    const { pool } = require('../config/database');
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (period_start) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(period_start);
    }
    
    if (period_end) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(period_end);
    }
    
    // KPIs de Producción
    const productionQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        SUM(quantity_planned) as total_planned,
        SUM(quantity_produced) as total_produced,
        SUM(quantity_scrap) as total_scrap,
        ROUND(AVG(CASE 
          WHEN quantity_planned > 0 THEN 
            (quantity_produced::DECIMAL / quantity_planned::DECIMAL) * 100 
          ELSE 0 
        END), 2) as avg_efficiency
      FROM production_orders
      ${whereClause}
    `;
    
    // KPIs de Calidad
    const qualityQuery = `
      SELECT 
        COUNT(*) as total_inspections,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_inspections,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_inspections,
        SUM(non_conformities_found) as total_non_conformities
      FROM quality_inspections
      ${whereClause.replace('created_at', 'inspection_date')}
    `;
    
    // KPIs de Inventario
    const inventoryQuery = `
      SELECT 
        COUNT(*) as total_materials,
        COUNT(CASE WHEN hazardous = true THEN 1 END) as hazardous_materials,
        SUM(current_stock * cost_per_unit) as total_value,
        COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as critical_stock
      FROM raw_materials
      WHERE is_active = true
    `;
    
    // KPIs de Laboratorio
    const laboratoryQuery = `
      SELECT 
        COUNT(*) as total_analyses,
        COUNT(CASE WHEN is_within_specification = true THEN 1 END) as within_spec_analyses,
        COUNT(DISTINCT bath_name) as unique_baths_analyzed
      FROM laboratory_analyses
      ${whereClause.replace('created_at', 'analysis_date')}
    `;
    
    const [productionResult, qualityResult, inventoryResult, laboratoryResult] = await Promise.all([
      pool.query(productionQuery, params),
      pool.query(qualityQuery, params),
      pool.query(inventoryQuery),
      pool.query(laboratoryQuery, params)
    ]);
    
    const production = productionResult.rows[0];
    const quality = qualityResult.rows[0];
    const inventory = inventoryResult.rows[0];
    const laboratory = laboratoryResult.rows[0];
    
    const totalInspections = parseInt(quality.total_inspections || 0);
    const totalAnalyses = parseInt(laboratory.total_analyses || 0);
    
    const kpis = {
      production: {
        total_orders: parseInt(production.total_orders || 0),
        completed_orders: parseInt(production.completed_orders || 0),
        completion_rate: production.total_orders > 0 
          ? ((production.completed_orders / production.total_orders) * 100).toFixed(2)
          : 0,
        total_planned: parseInt(production.total_planned || 0),
        total_produced: parseInt(production.total_produced || 0),
        total_scrap: parseInt(production.total_scrap || 0),
        avg_efficiency: parseFloat(production.avg_efficiency || 0)
      },
      quality: {
        total_inspections: totalInspections,
        approved_inspections: parseInt(quality.approved_inspections || 0),
        rejected_inspections: parseInt(quality.rejected_inspections || 0),
        approval_rate: totalInspections > 0 
          ? ((quality.approved_inspections / totalInspections) * 100).toFixed(2)
          : 0,
        total_non_conformities: parseInt(quality.total_non_conformities || 0)
      },
      inventory: {
        total_materials: parseInt(inventory.total_materials || 0),
        hazardous_materials: parseInt(inventory.hazardous_materials || 0),
        total_value: parseFloat(inventory.total_value || 0).toFixed(2),
        critical_stock_items: parseInt(inventory.critical_stock || 0)
      },
      laboratory: {
        total_analyses: totalAnalyses,
        within_spec_analyses: parseInt(laboratory.within_spec_analyses || 0),
        compliance_rate: totalAnalyses > 0 
          ? ((laboratory.within_spec_analyses / totalAnalyses) * 100).toFixed(2)
          : 0,
        unique_baths_analyzed: parseInt(laboratory.unique_baths_analyzed || 0)
      }
    };
    
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error generating KPIs report:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;

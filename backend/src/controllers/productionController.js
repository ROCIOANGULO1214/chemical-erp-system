const { pool } = require('../config/database');
const { generateWorkOrderNumber } = require('../utils/helpers');

// Obtener todas las órdenes de producción
const getProductionOrders = async (req, res) => {
  try {
    const { status, start_date, end_date, production_line_id } = req.query;
    
    let query = `
      SELECT po.*, co.order_number, c.name as customer_name, 
             pl.name as production_line_name, pl.process_type,
             u.first_name || ' ' || u.last_name as operator_name,
             s.first_name || ' ' || s.last_name as supervisor_name
      FROM production_orders po
      LEFT JOIN customer_orders co ON po.customer_order_id = co.id
      LEFT JOIN customers c ON co.customer_id = c.id
      LEFT JOIN production_lines pl ON po.production_line_id = pl.id
      LEFT JOIN users u ON po.operator_id = u.id
      LEFT JOIN users s ON po.supervisor_id = s.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND po.status = $${paramIndex++}`;
      params.push(status);
    }
    
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
    
    query += ' ORDER BY po.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting production orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener una orden de producción por ID
const getProductionOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT po.*, co.order_number, c.name as customer_name, 
             pl.name as production_line_name, pl.process_type,
             u.first_name || ' ' || u.last_name as operator_name,
             s.first_name || ' ' || s.last_name as supervisor_name
      FROM production_orders po
      LEFT JOIN customer_orders co ON po.customer_order_id = co.id
      LEFT JOIN customers c ON co.customer_id = c.id
      LEFT JOIN production_lines pl ON po.production_line_id = pl.id
      LEFT JOIN users u ON po.operator_id = u.id
      LEFT JOIN users s ON po.supervisor_id = s.id
      WHERE po.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de producción no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting production order:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva orden de producción
const createProductionOrder = async (req, res) => {
  try {
    const {
      customer_order_id,
      production_line_id,
      batch_number,
      quantity_planned,
      operator_id,
      supervisor_id,
      notes
    } = req.body;
    
    // Generar número de orden de trabajo
    const work_order_number = await generateWorkOrderNumber();
    
    const query = `
      INSERT INTO production_orders (
        work_order_number, customer_order_id, production_line_id,
        batch_number, quantity_planned, operator_id, supervisor_id,
        notes, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;
    
    const values = [
      work_order_number,
      customer_order_id,
      production_line_id,
      batch_number,
      quantity_planned,
      operator_id,
      supervisor_id,
      notes
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Orden de producción creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating production order:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar orden de producción
const updateProductionOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      batch_number,
      quantity_planned,
      quantity_produced,
      quantity_scrap,
      start_date,
      end_date,
      status,
      operator_id,
      supervisor_id,
      notes
    } = req.body;
    
    const query = `
      UPDATE production_orders SET
        batch_number = COALESCE($1, batch_number),
        quantity_planned = COALESCE($2, quantity_planned),
        quantity_produced = COALESCE($3, quantity_produced),
        quantity_scrap = COALESCE($4, quantity_scrap),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        status = COALESCE($7, status),
        operator_id = COALESCE($8, operator_id),
        supervisor_id = COALESCE($9, supervisor_id),
        notes = COALESCE($10, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;
    
    const values = [
      batch_number,
      quantity_planned,
      quantity_produced,
      quantity_scrap,
      start_date,
      end_date,
      status,
      operator_id,
      supervisor_id,
      notes,
      id
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Orden de producción no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Orden de producción actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating production order:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener líneas de producción
const getProductionLines = async (req, res) => {
  try {
    const query = `
      SELECT pl.*, 
             COUNT(po.id) as active_orders
      FROM production_lines pl
      LEFT JOIN production_orders po ON pl.id = po.production_line_id 
        AND po.status IN ('pending', 'in_progress')
      WHERE pl.is_active = true
      GROUP BY pl.id
      ORDER BY pl.name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting production lines:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener procesos químicos por línea de producción
const getChemicalProcesses = async (req, res) => {
  try {
    const { production_line_id } = req.params;
    
    const query = `
      SELECT * FROM chemical_processes
      WHERE production_line_id = $1
      ORDER BY sequence_order
    `;
    
    const result = await pool.query(query, [production_line_id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting chemical processes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Registrar proceso
const createProcessRecord = async (req, res) => {
  try {
    const {
      production_order_id,
      chemical_process_id,
      operator_id,
      start_time,
      end_time,
      actual_temperature,
      actual_time,
      actual_ph,
      actual_concentration,
      observations
    } = req.body;
    
    const query = `
      INSERT INTO process_records (
        production_order_id, chemical_process_id, operator_id,
        start_time, end_time, actual_temperature, actual_time,
        actual_ph, actual_concentration, observations, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed'
      ) RETURNING *
    `;
    
    const values = [
      production_order_id,
      chemical_process_id,
      operator_id,
      start_time,
      end_time,
      actual_temperature,
      actual_time,
      actual_ph,
      actual_concentration,
      observations
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Registro de proceso creado exitosamente'
    });
  } catch (error) {
    console.error('Error creating process record:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener registros de proceso por orden de producción
const getProcessRecords = async (req, res) => {
  try {
    const { production_order_id } = req.params;
    
    const query = `
      SELECT pr.*, cp.name as process_name, cp.sequence_order,
             u.first_name || ' ' || u.last_name as operator_name
      FROM process_records pr
      LEFT JOIN chemical_processes cp ON pr.chemical_process_id = cp.id
      LEFT JOIN users u ON pr.operator_id = u.id
      WHERE pr.production_order_id = $1
      ORDER BY cp.sequence_order, pr.start_time
    `;
    
    const result = await pool.query(query, [production_order_id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting process records:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener KPIs de producción
const getProductionKPIs = async (req, res) => {
  try {
    const { period_start, period_end, production_line_id } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (period_start) {
      whereClause += ` AND po.start_date >= $${paramIndex++}`;
      params.push(period_start);
    }
    
    if (period_end) {
      whereClause += ` AND po.start_date <= $${paramIndex++}`;
      params.push(period_end);
    }
    
    if (production_line_id) {
      whereClause += ` AND po.production_line_id = $${paramIndex++}`;
      params.push(production_line_id);
    }
    
    // Eficiencia de producción
    const efficiencyQuery = `
      SELECT 
        AVG(CASE 
          WHEN po.quantity_planned > 0 THEN 
            (po.quantity_produced::DECIMAL / po.quantity_planned::DECIMAL) * 100 
          ELSE 0 
        END) as efficiency,
        COUNT(*) as total_orders,
        SUM(po.quantity_planned) as total_planned,
        SUM(po.quantity_produced) as total_produced,
        SUM(po.quantity_scrap) as total_scrap
      FROM production_orders po
      ${whereClause}
    `;
    
    // Órdenes por estado
    const statusQuery = `
      SELECT po.status, COUNT(*) as count
      FROM production_orders po
      ${whereClause}
      GROUP BY po.status
    `;
    
    // Tiempos promedio
    const timeQuery = `
      SELECT 
        AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_process_time
      FROM process_records pr
      LEFT JOIN production_orders po ON pr.production_order_id = po.id
      ${whereClause.replace('po.start_date', 'pr.start_time')}
    `;
    
    const [efficiencyResult, statusResult, timeResult] = await Promise.all([
      pool.query(efficiencyQuery, params),
      pool.query(statusQuery, params),
      pool.query(timeQuery, params)
    ]);
    
    const efficiency = efficiencyResult.rows[0];
    const statusCounts = statusResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});
    
    const kpis = {
      efficiency: parseFloat(efficiency.efficiency || 0).toFixed(2),
      total_orders: parseInt(efficiency.total_orders || 0),
      total_planned: parseInt(efficiency.total_planned || 0),
      total_produced: parseInt(efficiency.total_produced || 0),
      total_scrap: parseInt(efficiency.total_scrap || 0),
      scrap_rate: efficiency.total_planned > 0 
        ? ((efficiency.total_scrap / efficiency.total_planned) * 100).toFixed(2)
        : 0,
      status_distribution: statusCounts,
      avg_process_time: parseFloat(timeResult.rows[0].avg_process_time || 0).toFixed(2)
    };
    
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error getting production KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getProductionOrders,
  getProductionOrderById,
  createProductionOrder,
  updateProductionOrder,
  getProductionLines,
  getChemicalProcesses,
  createProcessRecord,
  getProcessRecords,
  getProductionKPIs
};

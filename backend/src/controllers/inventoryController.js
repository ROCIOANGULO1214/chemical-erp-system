const { pool } = require('../config/database');

// Obtener materias primas
const getRawMaterials = async (req, res) => {
  try {
    const { chemical_type, stock_status, hazardous } = req.query;
    
    let query = `
      SELECT rm.*,
        CASE 
          WHEN rm.current_stock <= rm.minimum_stock THEN 'CRITICAL'
          WHEN rm.current_stock <= (rm.minimum_stock * 1.2) THEN 'LOW'
          WHEN rm.current_stock >= rm.maximum_stock THEN 'OVERSTOCK'
          ELSE 'NORMAL'
        END as stock_status,
        ROUND(rm.current_stock * rm.cost_per_unit, 2) as total_value
      FROM raw_materials rm
      WHERE rm.is_active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (chemical_type) {
      query += ` AND rm.chemical_type = $${paramIndex++}`;
      params.push(chemical_type);
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
    
    if (hazardous !== undefined) {
      query += ` AND rm.hazardous = $${paramIndex++}`;
      params.push(hazardous === 'true');
    }
    
    query += ' ORDER BY rm.name';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting raw materials:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener materia prima por ID
const getRawMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT rm.*,
        CASE 
          WHEN rm.current_stock <= rm.minimum_stock THEN 'CRITICAL'
          WHEN rm.current_stock <= (rm.minimum_stock * 1.2) THEN 'LOW'
          WHEN rm.current_stock >= rm.maximum_stock THEN 'OVERSTOCK'
          ELSE 'NORMAL'
        END as stock_status,
        ROUND(rm.current_stock * rm.cost_per_unit, 2) as total_value
      FROM raw_materials rm
      WHERE rm.id = $1 AND rm.is_active = true
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Materia prima no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting raw material:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva materia prima
const createRawMaterial = async (req, res) => {
  try {
    const {
      code,
      name,
      chemical_type,
      cas_number,
      supplier,
      safety_data_sheet,
      storage_requirements,
      hazardous,
      unit_of_measure,
      current_stock,
      minimum_stock,
      maximum_stock,
      cost_per_unit
    } = req.body;
    
    const query = `
      INSERT INTO raw_materials (
        code, name, chemical_type, cas_number, supplier,
        safety_data_sheet, storage_requirements, hazardous,
        unit_of_measure, current_stock, minimum_stock, maximum_stock,
        cost_per_unit, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;
    
    const values = [
      code,
      name,
      chemical_type,
      cas_number,
      supplier,
      safety_data_sheet,
      storage_requirements,
      hazardous || false,
      unit_of_measure,
      current_stock || 0,
      minimum_stock || 0,
      maximum_stock,
      cost_per_unit
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Materia prima creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating raw material:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'El código de materia prima ya existe'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar materia prima
const updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      chemical_type,
      cas_number,
      supplier,
      safety_data_sheet,
      storage_requirements,
      hazardous,
      unit_of_measure,
      current_stock,
      minimum_stock,
      maximum_stock,
      cost_per_unit
    } = req.body;
    
    const query = `
      UPDATE raw_materials SET
        name = COALESCE($1, name),
        chemical_type = COALESCE($2, chemical_type),
        cas_number = COALESCE($3, cas_number),
        supplier = COALESCE($4, supplier),
        safety_data_sheet = COALESCE($5, safety_data_sheet),
        storage_requirements = COALESCE($6, storage_requirements),
        hazardous = COALESCE($7, hazardous),
        unit_of_measure = COALESCE($8, unit_of_measure),
        current_stock = COALESCE($9, current_stock),
        minimum_stock = COALESCE($10, minimum_stock),
        maximum_stock = COALESCE($11, maximum_stock),
        cost_per_unit = COALESCE($12, cost_per_unit),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND is_active = true
      RETURNING *
    `;
    
    const values = [
      name,
      chemical_type,
      cas_number,
      supplier,
      safety_data_sheet,
      storage_requirements,
      hazardous,
      unit_of_measure,
      current_stock,
      minimum_stock,
      maximum_stock,
      cost_per_unit,
      id
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Materia prima no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Materia prima actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating raw material:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener consumo de materias primas
const getMaterialConsumption = async (req, res) => {
  try {
    const { start_date, end_date, raw_material_id, production_order_id } = req.query;
    
    let query = `
      SELECT mc.*, rm.name as material_name, rm.code as material_code,
             rm.unit_of_measure, po.work_order_number,
             u.first_name || ' ' || u.last_name as recorded_by_name
      FROM material_consumption mc
      LEFT JOIN raw_materials rm ON mc.raw_material_id = rm.id
      LEFT JOIN production_orders po ON mc.production_order_id = po.id
      LEFT JOIN users u ON mc.recorded_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (start_date) {
      query += ` AND mc.recorded_at >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND mc.recorded_at <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    if (raw_material_id) {
      query += ` AND mc.raw_material_id = $${paramIndex++}`;
      params.push(raw_material_id);
    }
    
    if (production_order_id) {
      query += ` AND mc.production_order_id = $${paramIndex++}`;
      params.push(production_order_id);
    }
    
    query += ' ORDER BY mc.recorded_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting material consumption:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Registrar consumo de materia prima
const createMaterialConsumption = async (req, res) => {
  try {
    const {
      production_order_id,
      raw_material_id,
      quantity_used,
      unit_cost,
      recorded_by
    } = req.body;
    
    // Verificar stock disponible
    const stockQuery = 'SELECT current_stock FROM raw_materials WHERE id = $1 AND is_active = true';
    const stockResult = await pool.query(stockQuery, [raw_material_id]);
    
    if (stockResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Materia prima no encontrada'
      });
    }
    
    const currentStock = parseFloat(stockResult.rows[0].current_stock);
    const quantityToUse = parseFloat(quantity_used);
    
    if (currentStock < quantityToUse) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuficiente para registrar el consumo'
      });
    }
    
    // Iniciar transacción
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insertar registro de consumo
      const consumptionQuery = `
        INSERT INTO material_consumption (
          production_order_id, raw_material_id, quantity_used,
          unit_cost, recorded_by, recorded_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      
      const consumptionResult = await client.query(consumptionQuery, [
        production_order_id,
        raw_material_id,
        quantity_used,
        unit_cost,
        recorded_by
      ]);
      
      // Actualizar stock
      const updateStockQuery = `
        UPDATE raw_materials 
        SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;
      
      await client.query(updateStockQuery, [quantity_used, raw_material_id]);
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        data: consumptionResult.rows[0],
        message: 'Consumo registrado exitosamente'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating material consumption:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener alertas de inventario
const getInventoryAlerts = async (req, res) => {
  try {
    const query = `
      SELECT 
        rm.id,
        rm.code,
        rm.name,
        rm.current_stock,
        rm.minimum_stock,
        rm.maximum_stock,
        rm.unit_of_measure,
        CASE 
          WHEN rm.current_stock <= rm.minimum_stock THEN 'CRITICAL'
          WHEN rm.current_stock <= (rm.minimum_stock * 1.2) THEN 'LOW'
          WHEN rm.current_stock >= rm.maximum_stock THEN 'OVERSTOCK'
          ELSE 'NORMAL'
        END as alert_type,
        CASE 
          WHEN rm.current_stock <= rm.minimum_stock THEN 
            'Stock crítico - Requiere reabastecimiento inmediato'
          WHEN rm.current_stock <= (rm.minimum_stock * 1.2) THEN 
            'Stock bajo - Considerar reabastecimiento pronto'
          WHEN rm.current_stock >= rm.maximum_stock THEN 
            'Sobrestock - Stock excesivo'
          ELSE 
            'Stock normal'
        END as alert_message,
        rm.hazardous
      FROM raw_materials rm
      WHERE rm.is_active = true 
        AND (
          rm.current_stock <= rm.minimum_stock 
          OR rm.current_stock <= (rm.minimum_stock * 1.2)
          OR rm.current_stock >= rm.maximum_stock
        )
      ORDER BY 
        CASE 
          WHEN rm.current_stock <= rm.minimum_stock THEN 1
          WHEN rm.current_stock <= (rm.minimum_stock * 1.2) THEN 2
          WHEN rm.current_stock >= rm.maximum_stock THEN 3
          ELSE 4
        END,
        rm.current_stock ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting inventory alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener KPIs de inventario
const getInventoryKPIs = async (req, res) => {
  try {
    // Totales de inventario
    const totalsQuery = `
      SELECT 
        COUNT(*) as total_materials,
        COUNT(CASE WHEN hazardous = true THEN 1 END) as hazardous_materials,
        SUM(current_stock * cost_per_unit) as total_value,
        COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as critical_stock,
        COUNT(CASE WHEN current_stock <= (minimum_stock * 1.2) AND current_stock > minimum_stock THEN 1 END) as low_stock,
        COUNT(CASE WHEN current_stock >= maximum_stock THEN 1 END) as overstock
      FROM raw_materials
      WHERE is_active = true
    `;
    
    // Consumo por período
    const consumptionQuery = `
      SELECT 
        SUM(quantity_used * unit_cost) as total_consumption_cost,
        SUM(quantity_used) as total_quantity_consumed
      FROM material_consumption
      WHERE recorded_at >= NOW() - INTERVAL '30 days'
    `;
    
    // Materiales por tipo químico
    const byTypeQuery = `
      SELECT chemical_type, COUNT(*) as count, SUM(current_stock * cost_per_unit) as total_value
      FROM raw_materials
      WHERE is_active = true
      GROUP BY chemical_type
      ORDER BY count DESC
    `;
    
    const [totalsResult, consumptionResult, byTypeResult] = await Promise.all([
      pool.query(totalsQuery),
      pool.query(consumptionQuery),
      pool.query(byTypeQuery)
    ]);
    
    const totals = totalsResult.rows[0];
    const consumption = consumptionResult.rows[0];
    const byType = byTypeResult.rows;
    
    const kpis = {
      total_materials: parseInt(totals.total_materials || 0),
      hazardous_materials: parseInt(totals.hazardous_materials || 0),
      total_inventory_value: parseFloat(totals.total_value || 0).toFixed(2),
      critical_stock_items: parseInt(totals.critical_stock || 0),
      low_stock_items: parseInt(totals.low_stock || 0),
      overstock_items: parseInt(totals.overstock || 0),
      last_30_days_consumption_cost: parseFloat(consumption.total_consumption_cost || 0).toFixed(2),
      last_30_days_quantity_consumed: parseFloat(consumption.total_quantity_consumed || 0),
      materials_by_type: byType.reduce((acc, row) => {
        acc[row.chemical_type] = {
          count: parseInt(row.count),
          value: parseFloat(row.total_value || 0).toFixed(2)
        };
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error getting inventory KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getRawMaterials,
  getRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  getMaterialConsumption,
  createMaterialConsumption,
  getInventoryAlerts,
  getInventoryKPIs
};

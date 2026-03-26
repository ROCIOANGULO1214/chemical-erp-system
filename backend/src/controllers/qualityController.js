const { pool } = require('../config/database');

// Obtener inspecciones de calidad
const getQualityInspections = async (req, res) => {
  try {
    const { status, inspection_type, start_date, end_date, production_order_id } = req.query;
    
    let query = `
      SELECT qi.*, po.work_order_number, c.name as customer_name,
             u.first_name || ' ' || u.last_name as inspector_name,
             pl.name as production_line_name
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
    
    if (status) {
      query += ` AND qi.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (inspection_type) {
      query += ` AND qi.inspection_type = $${paramIndex++}`;
      params.push(inspection_type);
    }
    
    if (start_date) {
      query += ` AND qi.inspection_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND qi.inspection_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    if (production_order_id) {
      query += ` AND qi.production_order_id = $${paramIndex++}`;
      params.push(production_order_id);
    }
    
    query += ' ORDER BY qi.inspection_date DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting quality inspections:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener inspección por ID
const getQualityInspectionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT qi.*, po.work_order_number, c.name as customer_name,
             u.first_name || ' ' || u.last_name as inspector_name,
             pl.name as production_line_name
      FROM quality_inspections qi
      LEFT JOIN production_orders po ON qi.production_order_id = po.id
      LEFT JOIN customer_orders co ON po.customer_order_id = co.id
      LEFT JOIN customers c ON co.customer_id = c.id
      LEFT JOIN production_lines pl ON po.production_line_id = pl.id
      LEFT JOIN users u ON qi.inspector_id = u.id
      WHERE qi.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inspección no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting quality inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nueva inspección de calidad
const createQualityInspection = async (req, res) => {
  try {
    const {
      production_order_id,
      inspector_id,
      inspection_type,
      results,
      status,
      notes
    } = req.body;
    
    // Contar no conformidades en los resultados
    const non_conformities_found = results && typeof results === 'object' 
      ? Object.values(results).filter(result => 
          result && typeof result === 'object' && result.result === 'fail'
        ).length
      : 0;
    
    const query = `
      INSERT INTO quality_inspections (
        production_order_id, inspector_id, inspection_type,
        results, status, non_conformities_found, notes,
        inspection_date, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;
    
    const values = [
      production_order_id,
      inspector_id,
      inspection_type,
      JSON.stringify(results),
      status || 'pending',
      non_conformities_found,
      notes
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Inspección creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating quality inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar inspección de calidad
const updateQualityInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      inspector_id,
      results,
      status,
      notes
    } = req.body;
    
    // Recalcular no conformidades si se actualizan resultados
    let non_conformities_found;
    if (results) {
      non_conformities_found = typeof results === 'object' 
        ? Object.values(results).filter(result => 
            result && typeof result === 'object' && result.result === 'fail'
          ).length
        : 0;
    }
    
    const query = `
      UPDATE quality_inspections SET
        inspector_id = COALESCE($1, inspector_id),
        results = COALESCE($2::jsonb, results),
        status = COALESCE($3, status),
        non_conformities_found = COALESCE($4, non_conformities_found),
        notes = COALESCE($5, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    
    const values = [
      inspector_id,
      results ? JSON.stringify(results) : null,
      status,
      non_conformities_found,
      notes,
      id
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inspección no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Inspección actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating quality inspection:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener no conformidades
const getNonConformities = async (req, res) => {
  try {
    const { status, type, start_date, end_date } = req.query;
    
    let query = `
      SELECT nc.*, qi.inspection_date, po.work_order_number,
             c.name as customer_name, pl.name as production_line_name,
             d.first_name || ' ' || d.last_name as detected_by_name
      FROM non_conformities nc
      LEFT JOIN quality_inspections qi ON nc.inspection_id = qi.id
      LEFT JOIN production_orders po ON nc.production_order_id = po.id
      LEFT JOIN customer_orders co ON po.customer_order_id = co.id
      LEFT JOIN customers c ON co.customer_id = c.id
      LEFT JOIN production_lines pl ON po.production_line_id = pl.id
      LEFT JOIN users d ON nc.detected_by = d.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND nc.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND nc.type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (start_date) {
      query += ` AND nc.detection_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND nc.detection_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    query += ' ORDER BY nc.detection_date DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting non-conformities:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear no conformidad
const createNonConformity = async (req, res) => {
  try {
    const {
      inspection_id,
      production_order_id,
      type,
      description,
      severity,
      detected_by,
      affected_quantity,
      images_urls,
      root_cause
    } = req.body;
    
    const query = `
      INSERT INTO non_conformities (
        inspection_id, production_order_id, type, description,
        severity, detected_by, affected_quantity, images_urls,
        root_cause, status, detection_date, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 'open',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;
    
    const values = [
      inspection_id,
      production_order_id,
      type,
      description,
      severity || 'minor',
      detected_by,
      affected_quantity,
      images_urls || [],
      root_cause
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'No conformidad creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating non-conformity:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener acciones CAPA
const getCapaActions = async (req, res) => {
  try {
    const { status, type, start_date, end_date } = req.query;
    
    let query = `
      SELECT ca.*, nc.type as non_conformity_type, nc.description as non_conformity_description,
             po.work_order_number, c.name as customer_name,
             a.first_name || ' ' || a.last_name as assigned_to_name,
             cb.first_name || ' ' || cb.last_name as created_by_name
      FROM capa_actions ca
      LEFT JOIN non_conformities nc ON ca.non_conformity_id = nc.id
      LEFT JOIN production_orders po ON nc.production_order_id = po.id
      LEFT JOIN customer_orders co ON po.customer_order_id = co.id
      LEFT JOIN customers c ON co.customer_id = c.id
      LEFT JOIN users a ON ca.assigned_to = a.id
      LEFT JOIN users cb ON ca.created_by = cb.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND ca.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (type) {
      query += ` AND ca.type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (start_date) {
      query += ` AND ca.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND ca.created_at <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    query += ' ORDER BY ca.created_at DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting CAPA actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear acción CAPA
const createCapaAction = async (req, res) => {
  try {
    const {
      non_conformity_id,
      type,
      title,
      description,
      assigned_to,
      due_date,
      created_by
    } = req.body;
    
    const query = `
      INSERT INTO capa_actions (
        non_conformity_id, type, title, description,
        assigned_to, due_date, created_by, status,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'pending',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;
    
    const values = [
      non_conformity_id,
      type,
      title,
      description,
      assigned_to,
      due_date,
      created_by
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Acción CAPA creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating CAPA action:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener auditorías internas
const getInternalAudits = async (req, res) => {
  try {
    const { status, audit_type, start_date, end_date } = req.query;
    
    let query = `
      SELECT ia.*, u.first_name || ' ' || u.last_name as auditor_name
      FROM internal_audits ia
      LEFT JOIN users u ON ia.auditor_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (status) {
      query += ` AND ia.status = $${paramIndex++}`;
      params.push(status);
    }
    
    if (audit_type) {
      query += ` AND ia.audit_type = $${paramIndex++}`;
      params.push(audit_type);
    }
    
    if (start_date) {
      query += ` AND ia.audit_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND ia.audit_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    query += ' ORDER BY ia.audit_date DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting internal audits:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener KPIs de calidad
const getQualityKPIs = async (req, res) => {
  try {
    const { period_start, period_end } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (period_start) {
      whereClause += ` AND qi.inspection_date >= $${paramIndex++}`;
      params.push(period_start);
    }
    
    if (period_end) {
      whereClause += ` AND qi.inspection_date <= $${paramIndex++}`;
      params.push(period_end);
    }
    
    // Tasa de aprobación de calidad
    const passRateQuery = `
      SELECT 
        COUNT(*) as total_inspections,
        COUNT(CASE WHEN qi.status = 'approved' THEN 1 END) as approved_inspections,
        COUNT(CASE WHEN qi.status = 'rejected' THEN 1 END) as rejected_inspections,
        COUNT(CASE WHEN qi.status = 'rework' THEN 1 END) as rework_inspections,
        SUM(qi.non_conformities_found) as total_non_conformities
      FROM quality_inspections qi
      ${whereClause}
    `;
    
    // No conformidades por tipo
    const ncByTypeQuery = `
      SELECT nc.type, COUNT(*) as count
      FROM non_conformities nc
      LEFT JOIN quality_inspections qi ON nc.inspection_id = qi.id
      ${whereClause.replace('qi.inspection_date', 'nc.detection_date')}
      GROUP BY nc.type
    `;
    
    // CAPA pendientes
    const capaPendingQuery = `
      SELECT 
        COUNT(*) as total_capas,
        COUNT(CASE WHEN ca.status = 'pending' THEN 1 END) as pending_capas,
        COUNT(CASE WHEN ca.status = 'in_progress' THEN 1 END) as in_progress_capas,
        COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_capas
      FROM capa_actions ca
      LEFT JOIN non_conformities nc ON ca.non_conformity_id = nc.id
      LEFT JOIN quality_inspections qi ON nc.inspection_id = qi.id
      ${whereClause.replace('qi.inspection_date', 'ca.created_at')}
    `;
    
    const [passRateResult, ncByTypeResult, capaPendingResult] = await Promise.all([
      pool.query(passRateQuery, params),
      pool.query(ncByTypeQuery, params),
      pool.query(capaPendingQuery, params)
    ]);
    
    const passRate = passRateResult.rows[0];
    const ncByType = ncByTypeResult.rows;
    const capaStats = capaPendingResult.rows[0];
    
    const totalInspections = parseInt(passRate.total_inspections || 0);
    const qualityPassRate = totalInspections > 0 
      ? ((passRate.approved_inspections / totalInspections) * 100).toFixed(2)
      : 0;
    
    const kpis = {
      total_inspections: totalInspections,
      approved_inspections: parseInt(passRate.approved_inspections || 0),
      rejected_inspections: parseInt(passRate.rejected_inspections || 0),
      rework_inspections: parseInt(passRate.rework_inspections || 0),
      quality_pass_rate: parseFloat(qualityPassRate),
      total_non_conformities: parseInt(passRate.total_non_conformities || 0),
      non_conformities_by_type: ncByType.reduce((acc, row) => {
        acc[row.type] = parseInt(row.count);
        return acc;
      }, {}),
      total_capas: parseInt(capaStats.total_capas || 0),
      pending_capas: parseInt(capaStats.pending_capas || 0),
      in_progress_capas: parseInt(capaStats.in_progress_capas || 0),
      completed_capas: parseInt(capaStats.completed_capas || 0)
    };
    
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error getting quality KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
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
};

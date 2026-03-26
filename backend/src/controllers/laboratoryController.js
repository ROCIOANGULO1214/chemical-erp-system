const { pool } = require('../config/database');
const { generateAnalysisNumber } = require('../utils/helpers');

// Obtener análisis de laboratorio
const getLaboratoryAnalyses = async (req, res) => {
  try {
    const { analysis_type, bath_name, start_date, end_date, production_line_id, is_within_specification } = req.query;
    
    let query = `
      SELECT la.*, pl.name as production_line_name, pl.process_type,
             u.first_name || ' ' || u.last_name as analyst_name
      FROM laboratory_analyses la
      LEFT JOIN production_lines pl ON la.production_line_id = pl.id
      LEFT JOIN users u ON la.analyst_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (analysis_type) {
      query += ` AND la.analysis_type = $${paramIndex++}`;
      params.push(analysis_type);
    }
    
    if (bath_name) {
      query += ` AND la.bath_name ILIKE $${paramIndex++}`;
      params.push(`%${bath_name}%`);
    }
    
    if (start_date) {
      query += ` AND la.analysis_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND la.analysis_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    if (production_line_id) {
      query += ` AND la.production_line_id = $${paramIndex++}`;
      params.push(production_line_id);
    }
    
    if (is_within_specification !== undefined) {
      query += ` AND la.is_within_specification = $${paramIndex++}`;
      params.push(is_within_specification === 'true');
    }
    
    query += ' ORDER BY la.analysis_date DESC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting laboratory analyses:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener análisis por ID
const getLaboratoryAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT la.*, pl.name as production_line_name, pl.process_type,
             u.first_name || ' ' || u.last_name as analyst_name
      FROM laboratory_analyses la
      LEFT JOIN production_lines pl ON la.production_line_id = pl.id
      LEFT JOIN users u ON la.analyst_id = u.id
      WHERE la.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Análisis no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting laboratory analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo análisis de laboratorio
const createLaboratoryAnalysis = async (req, res) => {
  try {
    const {
      sample_id,
      sample_date,
      analysis_type,
      bath_name,
      production_line_id,
      analyst_id,
      results,
      specification_limits,
      observations
    } = req.body;
    
    // Generar número de análisis
    const analysis_number = await generateAnalysisNumber();
    
    // Determinar si está dentro de especificaciones
    let is_within_specification = true;
    if (results && specification_limits) {
      for (const [key, value] of Object.entries(results)) {
        const limits = specification_limits[key];
        if (limits && typeof limits === 'object') {
          if (limits.min !== undefined && value < limits.min) {
            is_within_specification = false;
            break;
          }
          if (limits.max !== undefined && value > limits.max) {
            is_within_specification = false;
            break;
          }
        }
      }
    }
    
    const query = `
      INSERT INTO laboratory_analyses (
        analysis_number, sample_id, sample_date, analysis_type,
        bath_name, production_line_id, analyst_id, analysis_date,
        results, specification_limits, is_within_specification, observations
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP,
        $8, $9, $10, $11
      ) RETURNING *
    `;
    
    const values = [
      analysis_number,
      sample_id,
      sample_date,
      analysis_type,
      bath_name,
      production_line_id,
      analyst_id,
      JSON.stringify(results),
      JSON.stringify(specification_limits),
      is_within_specification,
      observations
    ];
    
    const result = await pool.query(query, values);
    
    // Crear registros de tendencias si es análisis de concentración o pH
    if (results && (analysis_type === 'concentration' || analysis_type === 'ph')) {
      for (const [paramName, paramValue] of Object.entries(results)) {
        if (typeof paramValue === 'number') {
          const trendQuery = `
            INSERT INTO laboratory_trends (
              analysis_id, parameter_name, parameter_value, recorded_at
            ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
          `;
          
          await pool.query(trendQuery, [result.rows[0].id, paramName, paramValue]);
        }
      }
    }
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Análisis creado exitosamente'
    });
  } catch (error) {
    console.error('Error creating laboratory analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener tendencias de laboratorio
const getLaboratoryTrends = async (req, res) => {
  try {
    const { bath_name, parameter_name, start_date, end_date, production_line_id } = req.query;
    
    let query = `
      SELECT lt.*, la.analysis_number, la.bath_name,
             pl.name as production_line_name,
             la.analysis_date
      FROM laboratory_trends lt
      LEFT JOIN laboratory_analyses la ON lt.analysis_id = la.id
      LEFT JOIN production_lines pl ON la.production_line_id = pl.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (bath_name) {
      query += ` AND la.bath_name ILIKE $${paramIndex++}`;
      params.push(`%${bath_name}%`);
    }
    
    if (parameter_name) {
      query += ` AND lt.parameter_name = $${paramIndex++}`;
      params.push(parameter_name);
    }
    
    if (start_date) {
      query += ` AND la.analysis_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    
    if (end_date) {
      query += ` AND la.analysis_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    
    if (production_line_id) {
      query += ` AND la.production_line_id = $${paramIndex++}`;
      params.push(production_line_id);
    }
    
    query += ' ORDER BY la.analysis_date ASC, lt.recorded_at ASC';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting laboratory trends:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener análisis por baño
const getAnalysesByBath = async (req, res) => {
  try {
    const { bath_name } = req.params;
    const { limit = 50 } = req.query;
    
    const query = `
      SELECT la.*, pl.name as production_line_name,
             u.first_name || ' ' || u.last_name as analyst_name
      FROM laboratory_analyses la
      LEFT JOIN production_lines pl ON la.production_line_id = pl.id
      LEFT JOIN users u ON la.analyst_id = u.id
      WHERE la.bath_name = $1
      ORDER BY la.analysis_date DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [bath_name, limit]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting analyses by bath:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener baños con análisis recientes
const getRecentBathAnalyses = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const query = `
      SELECT DISTINCT ON (la.bath_name) 
        la.bath_name,
        la.analysis_date,
        la.is_within_specification,
        la.analysis_number,
        pl.name as production_line_name,
        u.first_name || ' ' || u.last_name as analyst_name,
        la.results
      FROM laboratory_analyses la
      LEFT JOIN production_lines pl ON la.production_line_id = pl.id
      LEFT JOIN users u ON la.analyst_id = u.id
      WHERE la.analysis_date >= CURRENT_DATE - INTERVAL '${days} days'
        AND la.bath_name IS NOT NULL
      ORDER BY la.bath_name, la.analysis_date DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting recent bath analyses:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener KPIs de laboratorio
const getLaboratoryKPIs = async (req, res) => {
  try {
    const { period_start, period_end } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (period_start) {
      whereClause += ` AND la.analysis_date >= $${paramIndex++}`;
      params.push(period_start);
    }
    
    if (period_end) {
      whereClause += ` AND la.analysis_date <= $${paramIndex++}`;
      params.push(period_end);
    }
    
    // Análisis totales y cumplimiento
    const totalsQuery = `
      SELECT 
        COUNT(*) as total_analyses,
        COUNT(CASE WHEN is_within_specification = true THEN 1 END) as within_spec_analyses,
        COUNT(CASE WHEN is_within_specification = false THEN 1 END) as out_of_spec_analyses,
        COUNT(DISTINCT bath_name) as unique_baths_analyzed
      FROM laboratory_analyses la
      ${whereClause}
    `;
    
    // Análisis por tipo
    const byTypeQuery = `
      SELECT analysis_type, COUNT(*) as count
      FROM laboratory_analyses la
      ${whereClause}
      GROUP BY analysis_type
      ORDER BY count DESC
    `;
    
    // Baños con más desviaciones
    const bathDeviationsQuery = `
      SELECT 
        la.bath_name,
        COUNT(*) as total_analyses,
        COUNT(CASE WHEN is_within_specification = false THEN 1 END) as out_of_spec_count,
        ROUND(
          (COUNT(CASE WHEN is_within_specification = false THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
        ) as deviation_percentage
      FROM laboratory_analyses la
      ${whereClause}
      WHERE la.bath_name IS NOT NULL
      GROUP BY la.bath_name
      HAVING COUNT(*) >= 3
      ORDER BY deviation_percentage DESC
      LIMIT 10
    `;
    
    // Tendencias recientes
    const recentTrendsQuery = `
      SELECT 
        lt.parameter_name,
        AVG(lt.parameter_value) as avg_value,
        MIN(lt.parameter_value) as min_value,
        MAX(lt.parameter_value) as max_value,
        COUNT(*) as sample_count
      FROM laboratory_trends lt
      LEFT JOIN laboratory_analyses la ON lt.analysis_id = la.id
      ${whereClause.replace('la.analysis_date', 'la.analysis_date')}
      GROUP BY lt.parameter_name
      ORDER BY sample_count DESC
    `;
    
    const [totalsResult, byTypeResult, bathDeviationsResult, recentTrendsResult] = await Promise.all([
      pool.query(totalsQuery, params),
      pool.query(byTypeQuery, params),
      pool.query(bathDeviationsQuery, params),
      pool.query(recentTrendsQuery, params)
    ]);
    
    const totals = totalsResult.rows[0];
    const totalAnalyses = parseInt(totals.total_analyses || 0);
    
    const kpis = {
      total_analyses: totalAnalyses,
      within_spec_analyses: parseInt(totals.within_spec_analyses || 0),
      out_of_spec_analyses: parseInt(totals.out_of_spec_analyses || 0),
      unique_baths_analyzed: parseInt(totals.unique_baths_analyzed || 0),
      compliance_rate: totalAnalyses > 0 
        ? ((totals.within_spec_analyses / totalAnalyses) * 100).toFixed(2)
        : 0,
      analyses_by_type: byTypeResult.rows.reduce((acc, row) => {
        acc[row.analysis_type] = parseInt(row.count);
        return acc;
      }, {}),
      bath_deviations: bathDeviationsResult.rows.map(row => ({
        bath_name: row.bath_name,
        total_analyses: parseInt(row.total_analyses),
        out_of_spec_count: parseInt(row.out_of_spec_count),
        deviation_percentage: parseFloat(row.deviation_percentage)
      })),
      parameter_trends: recentTrendsResult.rows.map(row => ({
        parameter_name: row.parameter_name,
        avg_value: parseFloat(row.avg_value),
        min_value: parseFloat(row.min_value),
        max_value: parseFloat(row.max_value),
        sample_count: parseInt(row.sample_count)
      }))
    };
    
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error getting laboratory KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getLaboratoryAnalyses,
  getLaboratoryAnalysisById,
  createLaboratoryAnalysis,
  getLaboratoryTrends,
  getAnalysesByBath,
  getRecentBathAnalyses,
  getLaboratoryKPIs
};

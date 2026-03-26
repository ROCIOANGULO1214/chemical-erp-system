const { pool } = require('../config/database-demo');

// Obtener productos
const getProducts = async (req, res) => {
  try {
    const { customer_id, process_type, search } = req.query;
    
    let query = `
      SELECT p.*, c.name as customer_name, c.code as customer_code
      FROM products p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (customer_id) {
      query += ` AND p.customer_id = $${paramIndex++}`;
      params.push(customer_id);
    }
    
    if (process_type) {
      query += ` AND p.process_type = $${paramIndex++}`;
      params.push(process_type);
    }
    
    if (search) {
      query += ` AND (p.part_number ILIKE $${paramIndex++} OR p.description ILIKE $${paramIndex++})`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY p.part_number';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener producto por ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT p.*, c.name as customer_name, c.code as customer_code
      FROM products p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo producto
const createProduct = async (req, res) => {
  try {
    const {
      part_number,
      revision,
      description,
      customer_id,
      process_type,
      quality_tests,
      part_image,
      drawing_pdf,
      specifications,
      notes
    } = req.body;
    
    const query = `
      INSERT INTO products (
        part_number, revision, description, customer_id, process_type,
        quality_tests, part_image, drawing_pdf, specifications, notes,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;
    
    const values = [
      part_number,
      revision || 'A',
      description,
      customer_id,
      process_type,
      JSON.stringify(quality_tests || []),
      part_image,
      drawing_pdf,
      specifications,
      notes
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Producto creado exitosamente'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar producto
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      part_number,
      revision,
      description,
      customer_id,
      process_type,
      quality_tests,
      part_image,
      drawing_pdf,
      specifications,
      notes,
      is_active
    } = req.body;
    
    const query = `
      UPDATE products SET
        part_number = COALESCE($1, part_number),
        revision = COALESCE($2, revision),
        description = COALESCE($3, description),
        customer_id = COALESCE($4, customer_id),
        process_type = COALESCE($5, process_type),
        quality_tests = COALESCE($6, quality_tests),
        part_image = COALESCE($7, part_image),
        drawing_pdf = COALESCE($8, drawing_pdf),
        specifications = COALESCE($9, specifications),
        notes = COALESCE($10, notes),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;
    
    const values = [
      part_number,
      revision,
      description,
      customer_id,
      process_type,
      JSON.stringify(quality_tests || []),
      part_image,
      drawing_pdf,
      specifications,
      notes,
      is_active,
      id
    ];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Producto actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar producto
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Subir imagen de producto
const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      });
    }
    
    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: imageUrl
      },
      message: 'Imagen subida exitosamente'
    });
  } catch (error) {
    console.error('Error uploading product image:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Subir PDF de dibujo
const uploadDrawingPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún archivo'
      });
    }
    
    const pdfUrl = `/uploads/products/drawings/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: pdfUrl
      },
      message: 'PDF subido exitosamente'
    });
  } catch (error) {
    console.error('Error uploading drawing PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener pruebas de calidad disponibles
const getQualityTestTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 'thickness',
        name: 'Medición de Espesor',
        description: 'Medición del espesor del recubrimiento',
        unit: 'μm',
        method: 'Micrómetro o calibrador',
        standard: 'ASTM B633'
      },
      {
        id: 'adhesion',
        name: 'Prueba de Adhesión',
        description: 'Prueba de cinta para verificar adhesión',
        unit: 'N/A',
        method: 'Tape test',
        standard: 'ASTM D3359'
      },
      {
        id: 'salt_spray',
        name: 'Prueba de Niebla Salina',
        description: 'Resistencia a corrosión en cámara de niebla salina',
        unit: 'horas',
        method: 'Cámara de niebla salina',
        standard: 'ASTM B117'
      },
      {
        id: 'hardness',
        name: 'Dureza',
        description: 'Medición de dureza superficial',
        unit: 'HV',
        method: 'Durómetro Vickers',
        standard: 'ASTM E384'
      },
      {
        id: 'appearance',
        name: 'Inspección Visual',
        description: 'Inspección visual de defectos superficiales',
        unit: 'N/A',
        method: 'Visual',
        standard: 'Customer specification'
      },
      {
        id: 'coating_weight',
        name: 'Peso de Recubrimiento',
        description: 'Peso del recubrimiento por área',
        unit: 'g/m²',
        method: 'Gravimétrico',
        standard: 'ASTM B201'
      }
    ];
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error getting quality test templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener KPIs de productos
const getProductsKPIs = async (req, res) => {
  try {
    const kpis = {
      total_products: 15,
      active_products: 12,
      inactive_products: 3,
      products_by_process: {
        'zinc_plating': 6,
        'anodizing': 4,
        'chromating': 3,
        'passivation': 2
      },
      products_by_customer: [
        { customer: 'Automotriz del Norte S.A.', count: 5 },
        { customer: 'Componentes Aeroespaciales Ltd.', count: 4 },
        { customer: 'Electrodomésticos del Centro', count: 3 },
        { customer: 'Industria Naval S.A.', count: 3 }
      ],
      recent_products: 3,
      products_with_images: 10,
      products_with_drawings: 8
    };
    
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error getting products KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  uploadDrawingPdf,
  getQualityTestTemplates,
  getProductsKPIs
};

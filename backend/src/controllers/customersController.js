const { pool } = require('../config/database-demo');

// Obtener clientes
const getCustomers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener cliente por ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo cliente
const createCustomer = async (req, res) => {
  try {
    const { code, name, contact_name, email, phone, address, tax_id } = req.body;
    
    const result = await pool.query(
      'INSERT INTO customers (code, name, contact_name, email, phone, address, tax_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
      [code, name, contact_name, email, phone, address, tax_id]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar cliente
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_name, email, phone, address, tax_id, is_active } = req.body;
    
    const result = await pool.query(
      'UPDATE customers SET name = COALESCE($1, name), contact_name = COALESCE($2, contact_name), email = COALESCE($3, email), phone = COALESCE($4, phone), address = COALESCE($5, address), tax_id = COALESCE($6, tax_id), is_active = COALESCE($7, is_active), updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [name, contact_name, email, phone, address, tax_id, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener especificaciones de cliente
const getCustomerSpecifications = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer_specifications WHERE is_active = true');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting customer specifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear especificación de cliente
const createCustomerSpecification = async (req, res) => {
  try {
    const { customer_id, specification_code, description, standard_reference, coating_type, thickness_min, thickness_max, adhesion_test, salt_spray_hours, color_requirement, special_requirements } = req.body;
    
    const result = await pool.query(
      'INSERT INTO customer_specifications (customer_id, specification_code, description, standard_reference, coating_type, thickness_min, thickness_max, adhesion_test, salt_spray_hours, color_requirement, special_requirements, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
      [customer_id, specification_code, description, standard_reference, coating_type, thickness_min, thickness_max, adhesion_test, salt_spray_hours, color_requirement, special_requirements]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Especificación creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating customer specification:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener órdenes de cliente
const getCustomerOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer_orders ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear orden de cliente
const createCustomerOrder = async (req, res) => {
  try {
    const { customer_id, specification_id, part_number, part_description, quantity_ordered, unit_price, delivery_date, priority, notes } = req.body;
    
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    
    const result = await pool.query(
      'INSERT INTO customer_orders (order_number, customer_id, specification_id, part_number, part_description, quantity_ordered, unit_price, delivery_date, priority, notes, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, \'pending\', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *',
      [orderNumber, customer_id, specification_id, part_number, part_description, quantity_ordered, unit_price, delivery_date, priority, notes]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Orden de cliente creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating customer order:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener KPIs de clientes
const getCustomersKPIs = async (req, res) => {
  try {
    const kpis = {
      total_customers: 1,
      active_customers: 1,
      total_orders: 2,
      on_time_delivery_rate: 95.5,
      overdue_orders: 0,
      top_customers: [
        {
          id: 'c-1',
          name: 'Automotriz del Norte S.A.',
          code: 'C001',
          total_orders: 2,
          total_quantity: 700,
          total_value: 35000
        }
      ],
      popular_specifications: [
        {
          coating_type: 'Zinc Plating',
          usage_count: 2,
          customer_count: 1
        }
      ]
    };
    
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error getting customers KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  getCustomerSpecifications,
  createCustomerSpecification,
  getCustomerOrders,
  createCustomerOrder,
  getCustomersKPIs
};

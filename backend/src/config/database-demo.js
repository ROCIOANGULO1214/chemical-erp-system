// Base de datos simulada para demostración sin PostgreSQL
// Esto permite que el sistema funcione para demostración sin configurar base de datos

const demoData = {
  users: [
    {
      id: 'admin-id',
      username: 'admin',
      email: 'admin@chemical-erp.com',
      password_hash: '$2b$10$rQZ8ZkZkZkZkZkZkZkZkZOZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZk',
      first_name: 'Administrador',
      last_name: 'Sistema',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'operator-id',
      username: 'jsmith',
      email: 'juan.smith@chemical-erp.com',
      password_hash: '$2b$10$rQZ8ZkZkZkZkZkZkZkZkZOZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZkZk',
      first_name: 'Juan',
      last_name: 'Smith',
      role: 'operator',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  production_orders: [
    {
      id: 'po-1',
      work_order_number: 'WO-2024-03-0001',
      customer_order_id: 'co-1',
      production_line_id: 'pl-1',
      batch_number: 'BATCH-ZN-001',
      quantity_planned: 500,
      quantity_produced: 480,
      quantity_scrap: 20,
      start_date: new Date().toISOString(),
      end_date: new Date().toISOString(),
      status: 'completed',
      operator_id: 'operator-id',
      supervisor_id: 'admin-id',
      notes: 'Proceso completado con scrap dentro de límites',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'po-2',
      work_order_number: 'WO-2024-03-0002',
      customer_order_id: 'co-2',
      production_line_id: 'pl-1',
      batch_number: 'BATCH-ZN-002',
      quantity_planned: 200,
      quantity_produced: 0,
      quantity_scrap: 0,
      start_date: new Date().toISOString(),
      end_date: null,
      status: 'in_progress',
      operator_id: 'operator-id',
      supervisor_id: 'admin-id',
      notes: 'En proceso de zincado',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  quality_inspections: [
    {
      id: 'qi-1',
      production_order_id: 'po-1',
      inspector_id: 'admin-id',
      inspection_date: new Date().toISOString(),
      inspection_type: 'final',
      results: {
        thickness: { measured: 8.5, spec_min: 5.0, spec_max: 12.0, result: 'pass' },
        adhesion: { result: 'pass', method: 'tape_test' },
        appearance: { result: 'pass', defects: 'none' }
      },
      status: 'approved',
      non_conformities_found: 0,
      notes: 'Inspección final aprobada',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  raw_materials: [
    {
      id: 'rm-1',
      code: 'RM001',
      name: 'Soda Cáustica',
      chemical_type: 'base',
      cas_number: '1310-73-2',
      supplier: 'Química Industrial S.A.',
      hazardous: true,
      unit_of_measure: 'kg',
      current_stock: 500.0,
      minimum_stock: 100.0,
      maximum_stock: 2000.0,
      cost_per_unit: 2.50,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'rm-2',
      code: 'RM002',
      name: 'Ácido Sulfúrico',
      chemical_type: 'acid',
      cas_number: '7664-93-9',
      supplier: 'Ácidos del Norte S.A.',
      hazardous: true,
      unit_of_measure: 'L',
      current_stock: 800.0,
      minimum_stock: 200.0,
      maximum_stock: 3000.0,
      cost_per_unit: 1.80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  laboratory_analyses: [
    {
      id: 'la-1',
      analysis_number: 'AN-2024-00001',
      sample_id: 'BATH-ZN-001',
      sample_date: new Date().toISOString(),
      analysis_type: 'concentration',
      bath_name: 'Baño de Zinc',
      production_line_id: 'pl-1',
      analyst_id: 'admin-id',
      analysis_date: new Date().toISOString(),
      results: {
        zinc_concentration: 28.5,
        ph: 5.1,
        temperature: 28.0
      },
      specification_limits: {
        zinc_concentration: { min: 20.0, max: 35.0 },
        ph: { min: 4.5, max: 5.5 },
        temperature: { min: 25.0, max: 35.0 }
      },
      is_within_specification: true,
      observations: 'Baño dentro de especificaciones',
      created_at: new Date().toISOString()
    }
  ],
  
  customers: [
    {
      id: 'c-1',
      code: 'C001',
      name: 'Automotriz del Norte S.A.',
      contact_name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@automotriznorte.com',
      phone: '555-0101',
      address: 'Av. Industrial 123, Monterrey, NL',
      tax_id: 'AUT010101ABC',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  
  products: [
    {
      id: 'p-1',
      part_number: 'AUTO-001',
      revision: 'A',
      description: 'Tuerca de rueda zincada M12x1.75',
      customer_id: 'c-1',
      process_type: 'zinc_plating',
      quality_tests: [
        { test_id: 'thickness', required: true, min_value: 5, max_value: 12, unit: 'μm' },
        { test_id: 'adhesion', required: true, method: 'tape_test' },
        { test_id: 'salt_spray', required: true, min_value: 96, unit: 'horas' }
      ],
      part_image: '/uploads/products/images/tuerca-m12.jpg',
      drawing_pdf: '/uploads/products/drawings/auto-001-rev-a.pdf',
      specifications: 'Material: Acero 8.8, Rosca: M12x1.75, Recubrimiento: Zinc 5-12μm',
      notes: 'Producto estándar para línea automotriz',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-2',
      part_number: 'AERO-002',
      revision: 'B',
      description: 'Soporte estructural anodizado',
      customer_id: 'c-1',
      process_type: 'anodizing',
      quality_tests: [
        { test_id: 'thickness', required: true, min_value: 15, max_value: 25, unit: 'μm' },
        { test_id: 'hardness', required: true, min_value: 300, max_value: 500, unit: 'HV' },
        { test_id: 'appearance', required: true }
      ],
      part_image: '/uploads/products/images/soporte-aero.jpg',
      drawing_pdf: '/uploads/products/drawings/aero-002-rev-b.pdf',
      specifications: 'Material: Aluminio 6061-T6, Anodizado: Tipo II, Espesor: 15-25μm',
      notes: 'Componente crítico para aplicación aeroespacial',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'p-3',
      part_number: 'ELEC-003',
      revision: 'A',
      description: 'Carcaza de motor cromada',
      customer_id: 'c-1',
      process_type: 'chromating',
      quality_tests: [
        { test_id: 'appearance', required: true },
        { test_id: 'coating_weight', required: true, min_value: 20, max_value: 40, unit: 'g/m²' },
        { test_id: 'salt_spray', required: true, min_value: 48, unit: 'horas' }
      ],
      part_image: '/uploads/products/images/carcaza-motor.jpg',
      drawing_pdf: '/uploads/products/drawings/elec-003-rev-a.pdf',
      specifications: 'Material: Acero 1010, Cromatizado: Conversion coating',
      notes: 'Aplicación en motores eléctricos industriales',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

// Simulación de pool de base de datos
class DemoPool {
  async query(text, params = []) {
    console.log(`[DEMO DB] Query: ${text}`);
    console.log(`[DEMO DB] Params:`, params);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Parsear la consulta y retornar datos simulados
    if (text.includes('users')) {
      if (text.includes('WHERE username')) {
        const user = demoData.users.find(u => u.username === params[0]);
        return { rows: user ? [user] : [] };
      }
      return { rows: demoData.users };
    }
    
    if (text.includes('production_orders')) {
      return { rows: demoData.production_orders };
    }
    
    if (text.includes('quality_inspections')) {
      return { rows: demoData.quality_inspections };
    }
    
    if (text.includes('raw_materials')) {
      return { rows: demoData.raw_materials };
    }
    
    if (text.includes('laboratory_analyses')) {
      return { rows: demoData.laboratory_analyses };
    }
    
    if (text.includes('customers')) {
      return { rows: demoData.customers };
    }
    
    if (text.includes('products')) {
      return { rows: demoData.products };
    }
    
    // Para consultas de conteo
    if (text.includes('COUNT')) {
      if (text.includes('users')) {
        return { rows: [{ count: demoData.users.length }] };
      }
    }
    
    // Para KPIs
    if (text.includes('total_orders')) {
      return { rows: [{ total_orders: demoData.production_orders.length }] };
    }
    
    // Por defecto, retornar array vacío
    return { rows: [] };
  }
}

const pool = new DemoPool();

// Función de conexión (simulada)
const connectDB = async () => {
  console.log('🗄️ Connected to Demo Database (PostgreSQL simulation)');
  console.log('⚠️  This is a demo mode with simulated data');
  console.log('📝 To use real database, install PostgreSQL and run the migration scripts');
};

module.exports = {
  pool,
  connectDB,
  query: (text, params) => pool.query(text, params),
};

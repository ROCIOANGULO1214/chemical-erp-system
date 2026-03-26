import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Simulación de datos para demo
const demoProductionOrders = [
  {
    id: 'po-1',
    order_number: 'OP-2024-001',
    customer_id: 'c-1',
    customer_name: 'Automotriz del Norte S.A.',
    product_id: 'p-1',
    part_number: 'ZP-001-001',
    quantity: 1000,
    status: 'in_production',
    priority: 'normal',
    start_date: new Date('2024-03-20'),
    delivery_date: new Date('2024-03-30'),
    actual_completion_date: null,
    process_id: 'proc-1',
    process_name: 'Zinc Plating',
    quality_tests: [
      {
        test_id: 'QT-001',
        name: 'Espesor de recubrimiento',
        samples: 5,
        aql: 0.65,
        specifications: '25-35 μm',
        results: [
          { sample: 1, value: 28, status: 'passed' },
          { sample: 2, value: 30, status: 'passed' },
          { sample: 3, value: 27, status: 'passed' },
          { sample: 4, value: 29, status: 'passed' },
          { sample: 5, value: 31, status: 'passed' }
        ],
        overall_status: 'passed'
      },
      {
        test_id: 'QT-002',
        name: 'Adherencia',
        samples: 3,
        aql: 0.65,
        specifications: '8-10 MPa',
        results: [
          { sample: 1, value: 9.2, status: 'passed' },
          { sample: 2, value: 8.8, status: 'passed' },
          { sample: 3, value: 9.5, status: 'passed' }
        ],
        overall_status: 'passed'
      }
    ],
    release_parameters: [
      {
        subprocess_name: 'Desengrase',
        sequence: 1,
        parameters: [
          { name: 'Temperatura', value: 60, unit: '°C', type: 'exact', actual: 60 },
          { name: 'Tiempo', value: 5, unit: 'min', type: 'exact', actual: 5 }
        ]
      },
      {
        subprocess_name: 'Decapado',
        sequence: 2,
        parameters: [
          { name: 'Ácido', value: 'HCl', unit: '%', type: 'range', min: 10, max: 15, actual: 12 },
          { name: 'Tiempo', value: 3, unit: 'min', type: 'exact', actual: 3 }
        ]
      }
    ],
    notes: 'Orden de producción en progreso. Calidad aprobando muestras.',
    created_at: new Date('2024-03-20'),
    updated_at: new Date('2024-03-22')
  },
  {
    id: 'po-2',
    order_number: 'OP-2024-002',
    customer_id: 'c-2',
    customer_name: 'Componentes Aeroespaciales Ltd.',
    product_id: 'p-2',
    part_number: 'AN-002-002',
    quantity: 500,
    status: 'pending',
    priority: 'high',
    start_date: new Date('2024-03-25'),
    delivery_date: new Date('2024-04-05'),
    actual_completion_date: null,
    process_id: 'proc-2',
    process_name: 'Anodizado',
    quality_tests: [],
    release_parameters: [],
    notes: 'Orden pendiente de iniciar. Materiales listos.',
    created_at: new Date('2024-03-22'),
    updated_at: new Date('2024-03-22')
  },
  {
    id: 'po-3',
    order_number: 'OP-2024-003',
    customer_id: 'c-3',
    customer_name: 'Electrodomésticos del Centro',
    product_id: 'p-3',
    part_number: 'CR-003-003',
    quantity: 750,
    status: 'completed',
    priority: 'normal',
    start_date: new Date('2024-03-15'),
    delivery_date: new Date('2024-03-25'),
    actual_completion_date: new Date('2024-03-24'),
    process_id: 'proc-3',
    process_name: 'Cromatizado',
    quality_tests: [
      {
        test_id: 'QT-005',
        name: 'Resistencia a corrosión',
        samples: 3,
        aql: 0.65,
        specifications: '>96 horas',
        results: [
          { sample: 1, value: 85, status: 'failed' },
          { sample: 2, value: 82, status: 'failed' },
          { sample: 3, value: 88, status: 'failed' }
        ],
        overall_status: 'failed'
      }
    ],
    release_parameters: [
      {
        subprocess_name: 'Preparación',
        sequence: 1,
        parameters: [
          { name: 'pH', value: 7, unit: 'pH', type: 'range', min: 6.5, max: 7.5, actual: 7.1 }
        ]
      }
    ],
    notes: 'Orden completada pero con falla en calidad. Se requiere reprocesamiento.',
    created_at: new Date('2024-03-15'),
    updated_at: new Date('2024-03-24')
  }
];

const productionService = {
  // Órdenes de Producción CRUD
  getProductionOrders: async (filters = {}) => {
    try {
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Filtrado local
      let filteredOrders = [...demoProductionOrders];
      
      if (filters.status) {
        filteredOrders = filteredOrders.filter(order => 
          order.status === filters.status
        );
      }
      
      if (filters.priority) {
        filteredOrders = filteredOrders.filter(order => 
          order.priority === filters.priority
        );
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredOrders = filteredOrders.filter(order => 
          order.order_number.toLowerCase().includes(searchLower) ||
          order.part_number.toLowerCase().includes(searchLower) ||
          order.customer_name.toLowerCase().includes(searchLower)
        );
      }
      
      return filteredOrders;
    } catch (error) {
      console.error('Error fetching production orders:', error);
      return demoProductionOrders;
    }
  },

  getProductionOrderById: async (id) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const order = demoProductionOrders.find(o => o.id === id);
      if (!order) {
        throw new Error('Orden de producción no encontrada');
      }
      return order;
    } catch (error) {
      console.error('Error fetching production order:', error);
      throw error;
    }
  },

  createProductionOrder: async (orderData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newOrder = {
        ...orderData,
        id: `po-${Date.now()}`,
        order_number: `OP-2024-${Date.now()}`,
        status: 'pending',
        quality_tests: [],
        release_parameters: [],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Agregar a la lista local
      demoProductionOrders.push(newOrder);
      
      return newOrder;
    } catch (error) {
      console.error('Error creating production order:', error);
      throw error;
    }
  },

  updateProductionOrder: async (id, orderData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const index = demoProductionOrders.findIndex(o => o.id === id);
      if (index === -1) {
        throw new Error('Orden de producción no encontrada');
      }
      
      const updatedOrder = {
        ...demoProductionOrders[index],
        ...orderData,
        updated_at: new Date()
      };
      
      demoProductionOrders[index] = updatedOrder;
      
      return updatedOrder;
    } catch (error) {
      console.error('Error updating production order:', error);
      throw error;
    }
  },

  deleteProductionOrder: async (id) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = demoProductionOrders.findIndex(o => o.id === id);
      if (index === -1) {
        throw new Error('Orden de producción no encontrada');
      }
      
      demoProductionOrders.splice(index, 1);
      
      return { id, deleted: true };
    } catch (error) {
      console.error('Error deleting production order:', error);
      throw error;
    }
  },

  // KPIs de producción
  getProductionKPIs: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const pendingOrders = demoProductionOrders.filter(o => o.status === 'pending').length;
      const inProductionOrders = demoProductionOrders.filter(o => o.status === 'in_production').length;
      const completedOrders = demoProductionOrders.filter(o => o.status === 'completed').length;
      const delayedOrders = demoProductionOrders.filter(o => 
        o.status !== 'completed' && new Date() > new Date(o.delivery_date)
      ).length;
      
      return {
        total_orders: demoProductionOrders.length,
        pending_orders: pendingOrders,
        in_production_orders: inProductionOrders,
        completed_orders: completedOrders,
        delayed_orders: delayedOrders
      };
    } catch (error) {
      console.error('Error fetching production KPIs:', error);
      return {
        total_orders: demoProductionOrders.length,
        pending_orders: demoProductionOrders.filter(o => o.status === 'pending').length,
        in_production_orders: demoProductionOrders.filter(o => o.status === 'in_production').length,
        completed_orders: demoProductionOrders.filter(o => o.status === 'completed').length,
        delayed_orders: demoProductionOrders.filter(o => 
          o.status !== 'completed' && new Date() > new Date(o.delivery_date)
        ).length
      };
    }
  },

  // Estados de orden
  getOrderStatuses: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [
        { id: 'pending', name: 'Pendiente', description: 'Orden creada pero no iniciada' },
        { id: 'in_production', name: 'En Producción', description: 'Orden actualmente en proceso' },
        { id: 'quality_review', name: 'Revisión Calidad', description: 'Esperando aprobación de calidad' },
        { id: 'completed', name: 'Completada', description: 'Orden finalizada y entregada' },
        { id: 'cancelled', name: 'Cancelada', description: 'Orden cancelada por cliente' }
      ];
    } catch (error) {
      console.error('Error fetching order statuses:', error);
      return [];
    }
  },

  // Prioridades
  getPriorities: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [
        { id: 'low', name: 'Baja', description: 'Prioridad baja' },
        { id: 'normal', name: 'Normal', description: 'Prioridad normal' },
        { id: 'high', name: 'Alta', description: 'Prioridad alta' },
        { id: 'urgent', name: 'Urgente', description: 'Prioridad urgente' }
      ];
    } catch (error) {
      console.error('Error fetching priorities:', error);
      return [];
    }
  }
};

export default productionService;

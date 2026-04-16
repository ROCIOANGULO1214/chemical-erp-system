import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Simulación de datos para demo
const demoCustomers = [
  {
    id: 'c-1',
    name: 'Automotriz del Norte S.A.',
    contact_name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@automotriznorte.com',
    phone: '555-0101',
    address: 'Av. Industrial 123, Monterrey, NL',
    tax_id: 'AUT010101ABC',
    is_active: true,
    total_orders: 25,
    last_order_date: new Date('2024-03-20'),
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-03-20')
  },
  {
    id: 'c-2',
    name: 'Componentes Aeroespaciales Ltd.',
    contact_name: 'María González',
    email: 'maria.gonzalez@aeroespacial.com',
    phone: '555-0102',
    address: 'Blvd. Tecnológico 456, Querétaro, QRO',
    tax_id: 'AER020202XYZ',
    is_active: true,
    total_orders: 18,
    last_order_date: new Date('2024-03-22'),
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-03-22')
  },
  {
    id: 'c-3',
    name: 'Electrodomésticos del Centro',
    contact_name: 'Juan Pérez',
    email: 'juan.perez@electrodomesticos.com',
    phone: '555-0103',
    address: 'Calzada Comercial 789, Guadalajara, JL',
    tax_id: 'ELE030303DEF',
    is_active: true,
    total_orders: 32,
    last_order_date: new Date('2024-03-21'),
    created_at: new Date('2024-01-20'),
    updated_at: new Date('2024-03-21')
  },
  {
    id: 'c-4',
    name: 'Industria Naval S.A.',
    contact_name: 'Roberto Silva',
    email: 'roberto.silva@industrianaval.com',
    phone: '555-0104',
    address: 'Puerto Industrial 321, Veracruz, VER',
    tax_id: 'NAV040404GHI',
    is_active: false,
    total_orders: 12,
    last_order_date: new Date('2024-02-15'),
    created_at: new Date('2023-12-10'),
    updated_at: new Date('2024-02-15')
  }
];

const customersService = {
  // Clientes CRUD
  getCustomers: async (filters = {}) => {
    try {
      // Obtener desde Firebase
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const firebaseCustomers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Combinar con datos demo para tener datos iniciales
      let allCustomers = [...demoCustomers, ...firebaseCustomers];
      
      // Eliminar duplicados (priorizar datos de Firebase)
      const uniqueCustomers = [];
      const seenIds = new Set();
      
      for (const customer of allCustomers) {
        if (!seenIds.has(customer.id)) {
          seenIds.add(customer.id);
          uniqueCustomers.push(customer);
        }
      }
      
      let filteredCustomers = uniqueCustomers;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.name.toLowerCase().includes(searchLower) ||
          customer.contact_name.toLowerCase().includes(searchLower) ||
          customer.email.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.status) {
        const isActive = filters.status === 'active';
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.is_active === isActive
        );
      }
      
      return filteredCustomers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return demoCustomers;
    }
  },

  getCustomerById: async (id) => {
    try {
      // Obtener de Firebase primero
      const customerRef = doc(db, 'customers', id);
      const customerSnapshot = await getDoc(customerRef);
      
      if (customerSnapshot.exists()) {
        console.log('✅ Cliente cargado desde Firestore:', id);
        return {
          id: customerSnapshot.id,
          ...customerSnapshot.data()
        };
      }
      
      // Fallback a demo data
      const customer = demoCustomers.find(c => c.id === id);
      if (!customer) {
        throw new Error('Cliente no encontrado');
      }
      return customer;
    } catch (error) {
      console.error('❌ Error al obtener cliente:', error);
      throw error;
    }
  },

  createCustomer: async (customerData) => {
    try {
      // Guardar en Firebase
      const docRef = await addDoc(collection(db, 'customers'), {
        ...customerData,
        total_orders: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const newCustomer = {
        ...customerData,
        id: docRef.id,
        total_orders: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // También agregar a la lista local para consistencia
      demoCustomers.push(newCustomer);
      
      console.log('Cliente guardado en Firebase con ID:', docRef.id);
      return newCustomer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id, customerData) => {
    try {
      // Actualizar en Firebase
      const customerRef = doc(db, 'customers', id);
      const updatedData = {
        ...customerData,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(customerRef, updatedData);
      console.log('✅ Cliente actualizado en Firestore:', id);
      
      // Actualizar en la lista local también
      const index = demoCustomers.findIndex(c => c.id === id);
      if (index !== -1) {
        demoCustomers[index] = {
          ...demoCustomers[index],
          ...customerData,
          updated_at: new Date()
        };
      }
      
      return {
        ...demoCustomers[index],
        ...customerData,
        id,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error al actualizar cliente en Firestore:', error);
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    try {
      // Eliminar de Firebase
      const customerRef = doc(db, 'customers', id);
      await deleteDoc(customerRef);
      console.log('✅ Cliente eliminado de Firestore:', id);
      
      // Eliminar de la lista local también
      const index = demoCustomers.findIndex(c => c.id === id);
      if (index !== -1) {
        demoCustomers.splice(index, 1);
      }
      
      return { id, deleted: true };
    } catch (error) {
      console.error('❌ Error al eliminar cliente de Firestore:', error);
      throw error;
    }
  },

  // KPIs de clientes
  getCustomersKPIs: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const activeCustomers = demoCustomers.filter(c => c.is_active).length;
      const newCustomersThisMonth = demoCustomers.filter(c => 
        new Date(c.created_at).getMonth() === new Date().getMonth()
      ).length;
      const totalOrders = demoCustomers.reduce((sum, c) => sum + c.total_orders, 0);
      
      return {
        total_customers: demoCustomers.length,
        active_customers: activeCustomers,
        new_customers: newCustomersThisMonth,
        total_orders: totalOrders
      };
    } catch (error) {
      console.error('Error fetching customers KPIs:', error);
      return {
        total_customers: demoCustomers.length,
        active_customers: demoCustomers.filter(c => c.is_active).length,
        new_customers: 0,
        total_orders: demoCustomers.reduce((sum, c) => sum + c.total_orders, 0)
      };
    }
  }
};

export default customersService;

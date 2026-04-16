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

const inventoryService = {
  // Clientes (para el filtro de productos)
  getCustomers: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return demoCustomers;
    } catch (error) {
      console.error('Error fetching customers:', error);
      return demoCustomers;
    }
  },

  // Materias Primas
  getRawMaterials: async (filters = {}) => {
    try {
      // Cargar desde Firebase
      const querySnapshot = await getDocs(collection(db, 'rawMaterials'));
      let materials = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Si Firebase está vacío, retornar array demo
      if (materials.length === 0) {
        console.log('⚠️ No hay materias primas en Firestore');
        materials = [];
      }
      
      console.log('✅ Materias primas cargadas desde Firestore:', materials.length);
      return materials;
    } catch (error) {
      console.error('❌ Error al cargar materias primas:', error);
      return [];
    }
  },

  getRawMaterialById: async (id) => {
    try {
      // Obtener de Firebase
      const materialRef = doc(db, 'rawMaterials', id);
      const materialSnapshot = await getDoc(materialRef);
      
      if (materialSnapshot.exists()) {
        console.log('✅ Materia prima cargada:', id);
        return { id: materialSnapshot.id, ...materialSnapshot.data() };
      }
      return null;
    } catch (error) {
      console.error('❌ Error al obtener materia prima:', error);
      return null;
    }
  },

  createRawMaterial: async (materialData) => {
    try {
      const docRef = await addDoc(collection(db, 'rawMaterials'), {
        ...materialData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('✅ Materia prima guardada en Firestore:', docRef.id);
      return { id: docRef.id, ...materialData };
    } catch (error) {
      console.error('❌ Error al crear materia prima:', error);
      throw error;
    }
  },

  updateRawMaterial: async (id, materialData) => {
    try {
      const materialRef = doc(db, 'rawMaterials', id);
      await updateDoc(materialRef, {
        ...materialData,
        updated_at: new Date().toISOString()
      });
      console.log('✅ Materia prima actualizada en Firestore:', id);
      return { id, ...materialData };
    } catch (error) {
      console.error('❌ Error al actualizar materia prima:', error);
      throw error;
    }
  },

  deleteRawMaterial: async (id) => {
    try {
      const materialRef = doc(db, 'rawMaterials', id);
      await deleteDoc(materialRef);
      console.log('✅ Materia prima eliminada de Firestore:', id);
      return { id, deleted: true };
    } catch (error) {
      console.error('❌ Error al eliminar materia prima:', error);
      throw error;
    }
  },

  // Consumo de Materias Primas
  getMaterialConsumption: async (filters = {}) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [];
    } catch (error) {
      console.error('Error fetching material consumption:', error);
      return [];
    }
  },

  // KPIs de inventario
  getInventoryKPIs: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        total_materials: 0,
        low_stock_materials: 0,
        total_consumption: 0
      };
    } catch (error) {
      console.error('Error fetching inventory KPIs:', error);
      return {
        total_materials: 0,
        low_stock_materials: 0,
        total_consumption: 0
      };
    }
  },

  // Alertas de Inventario
  getInventoryAlerts: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return [];
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      return [];
    }
  }
};

export default inventoryService;

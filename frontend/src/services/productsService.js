import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const demoProducts = [
  {
    id: 'p-1',
    part_number: 'ZP-001-001',
    revision: 'A',
    description: 'Pieza de automóvil para proceso de zinc plating',
    customer_id: 'c-1',
    customer_name: 'Automotriz del Norte S.A.',
    process_type: 'zinc_plating',
    is_active: true,
    part_image: '/images/zp-001-001.jpg',
    drawing_pdf: '/drawings/zp-001-001.pdf',
    quality_tests: [
      {
        test_id: 'QT-001',
        description: 'Espesor de recubrimiento',
        status: 'passed',
        specifications: { min: 25, max: 35, unit: 'μm' }
      },
      {
        test_id: 'QT-002',
        description: 'Adherencia',
        status: 'passed',
        specifications: { min: 8, max: 10, unit: 'MPa' }
      }
    ],
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-03-20')
  },
  {
    id: 'p-2',
    part_number: 'AN-002-002',
    revision: 'B',
    description: 'Componente aeronáutico para anodizado',
    customer_id: 'c-2',
    customer_name: 'Componentes Aeroespaciales Ltd.',
    process_type: 'anodizing',
    is_active: true,
    part_image: '/images/an-002-002.jpg',
    drawing_pdf: '/drawings/an-002-002.pdf',
    quality_tests: [
      {
        test_id: 'QT-003',
        description: 'Dureza superficial',
        status: 'passed',
        specifications: { min: 350, max: 450, unit: 'HV' }
      },
      {
        test_id: 'QT-004',
        description: 'Espesor de capa anódica',
        status: 'pending',
        specifications: { min: 15, max: 25, unit: 'μm' }
      }
    ],
    created_at: new Date('2024-02-01'),
    updated_at: new Date('2024-03-22')
  },
  {
    id: 'p-3',
    part_number: 'CR-003-003',
    revision: 'A',
    description: 'Parte decorativa para cromatizado',
    customer_id: 'c-3',
    customer_name: 'Electrodomésticos del Centro',
    process_type: 'chromating',
    is_active: true,
    part_image: '/images/cr-003-003.jpg',
    drawing_pdf: '/drawings/cr-003-003.pdf',
    quality_tests: [
      {
        test_id: 'QT-005',
        description: 'Resistencia a corrosión',
        status: 'failed',
        specifications: { min: 96, max: 100, unit: 'horas' }
      }
    ],
    created_at: new Date('2024-02-10'),
    updated_at: new Date('2024-03-21')
  },
  {
    id: 'p-4',
    part_number: 'PS-004-004',
    revision: 'C',
    description: 'Componente de acero inoxidable para pasivado',
    customer_id: 'c-4',
    customer_name: 'Industria Naval S.A.',
    process_type: 'passivation',
    is_active: false,
    part_image: null,
    drawing_pdf: '/drawings/ps-004-004.pdf',
    quality_tests: [
      {
        test_id: 'QT-006',
        description: 'Concentración de cromo',
        status: 'passed',
        specifications: { min: 200, max: 400, unit: 'mg/L' }
      }
    ],
    created_at: new Date('2023-12-10'),
    updated_at: new Date('2024-02-15')
  }
];

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

const demoQualityTests = [
  {
    id: 'qt-1',
    test_id: 'QT-001',
    name: 'Espesor de recubrimiento',
    description: 'Medición de espesor de capa de zinc',
    method: 'Coating Thickness Gauge',
    status: 'active',
    created_at: new Date('2024-01-10')
  },
  {
    id: 'qt-2',
    test_id: 'QT-002',
    name: 'Adherencia',
    description: 'Prueba de adherencia de recubrimiento',
    method: 'Cross-cut test',
    status: 'active',
    created_at: new Date('2024-01-10')
  },
  {
    id: 'qt-3',
    test_id: 'QT-003',
    name: 'Dureza superficial',
    description: 'Medición de dureza Vickers',
    method: 'Vickers Hardness Test',
    status: 'active',
    created_at: new Date('2024-01-15')
  },
  {
    id: 'qt-4',
    test_id: 'QT-004',
    name: 'Espesor de capa anódica',
    description: 'Medición de espesor de anodizado',
    method: 'Eddy Current Test',
    status: 'active',
    created_at: new Date('2024-01-15')
  },
  {
    id: 'qt-5',
    test_id: 'QT-005',
    name: 'Resistencia a corrosión',
    description: 'Prueba de cámara de sal nebulizada',
    method: 'Salt Spray Test',
    status: 'active',
    created_at: new Date('2024-01-20')
  },
  {
    id: 'qt-6',
    test_id: 'QT-006',
    name: 'Concentración de cromo',
    description: 'Análisis químico de concentración',
    method: 'Spectrophotometry',
    status: 'active',
    created_at: new Date('2024-01-25')
  }
];

const productsService = {
  // Productos CRUD
  getProducts: async (filters = {}) => {
    try {
      // Obtener desde Firebase
      const querySnapshot = await getDocs(collection(db, 'products'));
      const firebaseProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Productos desde Firebase:', firebaseProducts);
      
      // Combinar con datos demo para tener datos iniciales
      let allProducts = [...demoProducts, ...firebaseProducts];
      
      // Eliminar duplicados (priorizar datos de Firebase)
      const uniqueProducts = [];
      const seenIds = new Set();
      
      for (const product of allProducts) {
        if (!seenIds.has(product.id)) {
          seenIds.add(product.id);
          uniqueProducts.push(product);
        }
      }
      
      let filteredProducts = uniqueProducts;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.part_number.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters.customer_id) {
        filteredProducts = filteredProducts.filter(product => 
          product.customer_id === filters.customer_id
        );
      }
      
      if (filters.process_type) {
        filteredProducts = filteredProducts.filter(product => 
          product.process_type === filters.process_type
        );
      }
      
      return filteredProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      return demoProducts;
    }
  },

  getProductById: async (id) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const product = demoProducts.find(p => p.id === id);
      if (!product) {
        throw new Error('Producto no encontrado');
      }
      return product;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  createProduct: async (productData) => {
    try {
      // Guardar en Firebase
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const newProduct = {
        ...productData,
        id: docRef.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // También agregar a la lista local para consistencia
      demoProducts.push(newProduct);
      
      console.log('Producto guardado en Firebase con ID:', docRef.id);
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      // Actualizar en Firebase
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...productData,
        updated_at: new Date().toISOString()
      });
      
      // Actualizar localmente también
      const index = demoProducts.findIndex(p => p.id === id);
      if (index !== -1) {
        demoProducts[index] = {
          ...demoProducts[index],
          ...productData,
          id,
          updated_at: new Date().toISOString()
        };
      }
      
      console.log('Producto actualizado en Firebase:', id);
      return { ...productData, id, updated_at: new Date().toISOString() };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      // Eliminar de Firebase
      const docRef = doc(db, 'products', id);
      await deleteDoc(docRef);
      
      // Eliminar localmente también
      const index = demoProducts.findIndex(p => p.id === id);
      if (index !== -1) {
        demoProducts.splice(index, 1);
      }
      
      console.log('Producto eliminado de Firebase:', id);
      return { id, deleted: true };
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Subida de archivos
  uploadProductImage: async (file) => {
    try {
      // Convertir archivo a base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      console.log('✅ Imagen convertida a base64:', file.name, '-', base64.length, 'chars');
      
      return {
        url: base64, // Guardar base64 completo con prefijo data:image
        filename: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  uploadDrawingPdf: async (file) => {
    try {
      // Convertir PDF a base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      console.log('✅ PDF convertido a base64:', file.name, '-', base64.length, 'chars');
      
      return {
        url: base64, // Guardar base64 completo
        filename: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  },

  // Pruebas de calidad
  getQualityTestTemplates: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      return demoQualityTests;
    } catch (error) {
      console.error('Error fetching quality tests:', error);
      return demoQualityTests;
    }
  },

  // KPIs de productos
  getProductsKPIs: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const activeProducts = demoProducts.filter(p => p.is_active).length;
      const productsWithImages = demoProducts.filter(p => p.part_image).length;
      const productsWithDrawings = demoProducts.filter(p => p.drawing_pdf).length;
      
      return {
        total_products: demoProducts.length,
        active_products: activeProducts,
        products_with_images: productsWithImages,
        products_with_drawings: productsWithDrawings
      };
    } catch (error) {
      console.error('Error fetching products KPIs:', error);
      return {
        total_products: demoProducts.length,
        active_products: demoProducts.filter(p => p.is_active).length,
        products_with_images: demoProducts.filter(p => p.part_image).length,
        products_with_drawings: demoProducts.filter(p => p.drawing_pdf).length
      };
    }
  }
};

export default productsService;

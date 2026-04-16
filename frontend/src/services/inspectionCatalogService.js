// Servicio para el catálogo de inspecciones
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Datos mock del catálogo (para inicialización)
const mockInspections = [
  {
    id: 'insp-1',
    name: 'Espesor de Recubrimiento',
    type: 'medicion',
    description: 'Medición del espesor del recubrimiento de zinc en piezas metálicas',
    acceptance_criteria: 'Espesor mínimo según especificación de cliente',
    tolerance_min: 25,
    tolerance_max: 35,
    unit: 'μm',
    observations: 'Realizar en 3 puntos diferentes y promediar',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'insp-2',
    name: 'Prueba de Adhesión',
    type: 'laboratorio',
    description: 'Verificación de la adhesión del recubrimiento mediante prueba de cinta',
    acceptance_criteria: 'Sin desprendimiento del recubrimiento',
    tolerance_min: null,
    tolerance_max: null,
    unit: null,
    observations: 'Según ASTM D3359',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'insp-3',
    name: 'Inspección Visual de Superficie',
    type: 'visual',
    description: 'Revisión visual de defectos superficiales',
    acceptance_criteria: 'Sin grietas, porosidades o defectos visibles',
    tolerance_min: null,
    tolerance_max: null,
    unit: null,
    observations: 'Iluminación mínima de 500 lux',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  }
];

const inspectionCatalogService = {
  // Obtener todas las inspecciones del catálogo
  getAllInspections: async () => {
    try {
      // Cargar desde Firebase
      const querySnapshot = await getDocs(collection(db, 'inspectionCatalog'));
      let firebaseInspections = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Si Firebase está vacío, agregar datos mock
      if (firebaseInspections.length === 0) {
        console.log('⚠️ No hay inspecciones en Firestore, usando datos de demostración');
        return mockInspections;
      }
      
      console.log('✅ Inspecciones cargadas desde Firestore:', firebaseInspections.length);
      return firebaseInspections;
    } catch (error) {
      console.error('❌ Error al cargar inspecciones de Firestore:', error);
      return mockInspections;
    }
  },

  // Crear nueva inspección
  createInspection: async (inspectionData) => {
    try {
      // Guardar en Firebase
      const docRef = await addDoc(collection(db, 'inspectionCatalog'), {
        ...inspectionData,
        is_active: inspectionData.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const newInspection = {
        id: docRef.id,
        ...inspectionData,
        is_active: inspectionData.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('✅ Inspección guardada en Firestore:', docRef.id);
      return newInspection;
    } catch (error) {
      console.error('❌ Error al crear inspección en Firestore:', error);
      throw error;
    }
  },

  // Actualizar inspección existente
  updateInspection: async (id, inspectionData) => {
    try {
      // Actualizar en Firebase
      const inspectionRef = doc(db, 'inspectionCatalog', id);
      const updatedData = {
        ...inspectionData,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(inspectionRef, updatedData);
      console.log('✅ Inspección actualizada en Firestore:', id);
      
      return {
        id,
        ...inspectionData,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error al actualizar inspección en Firestore:', error);
      throw error;
    }
  },

  // Eliminar inspección
  deleteInspection: async (id) => {
    try {
      // Eliminar de Firebase
      const inspectionRef = doc(db, 'inspectionCatalog', id);
      await deleteDoc(inspectionRef);
      console.log('✅ Inspección eliminada de Firestore:', id);
      return true;
    } catch (error) {
      console.error('❌ Error al eliminar inspección de Firestore:', error);
      throw error;
    }
  },

  // Obtener inspección por ID
  getInspectionById: async (id) => {
    try {
      // Obtener de Firebase
      const inspectionRef = doc(db, 'inspectionCatalog', id);
      const inspectionSnapshot = await getDoc(inspectionRef);
      
      if (inspectionSnapshot.exists()) {
        console.log('✅ Inspección cargada desde Firestore:', id);
        return {
          id: inspectionSnapshot.id,
          ...inspectionSnapshot.data()
        };
      }
      
      // Fallback a mock
      const inspection = mockInspections.find(i => i.id === id);
      if (!inspection) throw new Error('Inspección no encontrada');
      return inspection;
    } catch (error) {
      console.error('❌ Error al obtener inspección:', error);
      throw error;
    }
  },

  // Obtener inspecciones por tipo
  getInspectionsByType: async (type) => {
    try {
      // Cargar desde Firebase
      const q = query(collection(db, 'inspectionCatalog'), where('type', '==', type));
      const querySnapshot = await getDocs(q);
      const inspections = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Inspecciones de tipo', type, 'cargadas desde Firestore:', inspections.length);
      return inspections;
    } catch (error) {
      console.error('❌ Error al cargar inspecciones por tipo:', error);
      return mockInspections.filter(i => i.type === type);
    }
  },

  // Obtener inspecciones activas
  getActiveInspections: async () => {
    try {
      // Cargar desde Firebase
      const q = query(collection(db, 'inspectionCatalog'), where('is_active', '==', true));
      const querySnapshot = await getDocs(q);
      const inspections = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Inspecciones activas cargadas desde Firestore:', inspections.length);
      return inspections;
    } catch (error) {
      console.error('❌ Error al cargar inspecciones activas:', error);
      return mockInspections.filter(i => i.is_active);
    }
  }
};

export default inspectionCatalogService;

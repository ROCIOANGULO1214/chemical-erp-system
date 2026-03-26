// Servicio para el catálogo de inspecciones
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Datos mock del catálogo
const mockInspections = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    await new Promise(resolve => setTimeout(resolve, 200));
    return [...mockInspections];
  },

  // Crear nueva inspección
  createInspection: async (inspectionData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newInspection = {
      ...inspectionData,
      id: Date.now(),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockInspections.push(newInspection);
    return newInspection;
  },

  // Actualizar inspección existente
  updateInspection: async (id, inspectionData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockInspections.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Inspección no encontrada');
    
    mockInspections[index] = {
      ...mockInspections[index],
      ...inspectionData,
      updated_at: new Date().toISOString()
    };
    return mockInspections[index];
  },

  // Eliminar inspección
  deleteInspection: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockInspections.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Inspección no encontrada');
    
    mockInspections.splice(index, 1);
    return true;
  },

  // Obtener inspección por ID
  getInspectionById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const inspection = mockInspections.find(i => i.id === id);
    if (!inspection) throw new Error('Inspección no encontrada');
    return inspection;
  },

  // Obtener inspecciones por tipo
  getInspectionsByType: async (type) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockInspections.filter(i => i.type === type);
  },

  // Obtener inspecciones activas
  getActiveInspections: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockInspections.filter(i => i.is_active);
  }
};

export default inspectionCatalogService;

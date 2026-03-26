import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Simulación de datos para demo
const demoAnalysis = [
  {
    id: 'lab-1',
    analysis_id: 'LAB-001',
    sample_id: 'SMP-001',
    product_id: 'p-1',
    part_number: 'ZP-001-001',
    customer_name: 'Automotriz del Norte S.A.',
    analysis_type: 'chemical',
    status: 'completed',
    requested_date: new Date('2024-03-20'),
    completed_date: new Date('2024-03-22'),
    technician: 'Carlos Ruiz',
    parameters: [
      { name: 'pH', value: 7.2, unit: 'pH', specification: '6.5-8.0', status: 'passed' },
      { name: 'Conductividad', value: 150, unit: 'μS/cm', specification: '100-200', status: 'passed' },
      { name: 'Cloruros', value: 25, unit: 'ppm', specification: '<50', status: 'passed' }
    ],
    notes: 'Análisis completado satisfactoriamente. Todos los parámetros dentro de especificaciones.',
    created_at: new Date('2024-03-20'),
    updated_at: new Date('2024-03-22')
  },
  {
    id: 'lab-2',
    analysis_id: 'LAB-002',
    sample_id: 'SMP-002',
    product_id: 'p-2',
    part_number: 'AN-002-002',
    customer_name: 'Componentes Aeroespaciales Ltd.',
    analysis_type: 'physical',
    status: 'in_progress',
    requested_date: new Date('2024-03-21'),
    completed_date: null,
    technician: 'María López',
    parameters: [
      { name: 'Dureza', value: null, unit: 'HV', specification: '350-450', status: 'pending' },
      { name: 'Espesor', value: null, unit: 'μm', specification: '15-25', status: 'pending' }
    ],
    notes: 'Análisis en progreso. Esperando resultados de pruebas físicas.',
    created_at: new Date('2024-03-21'),
    updated_at: new Date('2024-03-21')
  },
  {
    id: 'lab-3',
    analysis_id: 'LAB-003',
    sample_id: 'SMP-003',
    product_id: 'p-3',
    part_number: 'CR-003-003',
    customer_name: 'Electrodomésticos del Centro',
    analysis_type: 'corrosion',
    status: 'failed',
    requested_date: new Date('2024-03-19'),
    completed_date: new Date('2024-03-21'),
    technician: 'Juan Martínez',
    parameters: [
      { name: 'Resistencia a corrosión', value: 85, unit: 'horas', specification: '>96', status: 'failed' }
    ],
    notes: 'El producto no cumple con los requisitos de resistencia a corrosión. Se requiere reprocesamiento.',
    created_at: new Date('2024-03-19'),
    updated_at: new Date('2024-03-21')
  }
];

const laboratoryService = {
  // Análisis CRUD
  getAnalysis: async (filters = {}) => {
    try {
      // Obtener desde Firebase
      const querySnapshot = await getDocs(collection(db, 'analysis'));
      const firebaseAnalysis = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Combinar con datos demo para tener datos iniciales
      let allAnalysis = [...demoAnalysis, ...firebaseAnalysis];
      
      // Eliminar duplicados (priorizar datos de Firebase)
      const uniqueAnalysis = [];
      const seenIds = new Set();
      
      for (const analysis of allAnalysis) {
        if (!seenIds.has(analysis.id)) {
          seenIds.add(analysis.id);
          uniqueAnalysis.push(analysis);
        }
      }
      
      let filteredAnalysis = uniqueAnalysis;
      
      if (filters.status) {
        filteredAnalysis = filteredAnalysis.filter(analysis => 
          analysis.status === filters.status
        );
      }
      
      if (filters.analysis_type) {
        filteredAnalysis = filteredAnalysis.filter(analysis => 
          analysis.analysis_type === filters.analysis_type
        );
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredAnalysis = filteredAnalysis.filter(analysis => 
          analysis.analysis_id.toLowerCase().includes(searchLower) ||
          analysis.part_number.toLowerCase().includes(searchLower) ||
          analysis.customer_name.toLowerCase().includes(searchLower)
        );
      }
      
      return filteredAnalysis;
    } catch (error) {
      console.error('Error fetching analysis:', error);
      return demoAnalysis;
    }
  },

  getAnalysisById: async (id) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const analysis = demoAnalysis.find(a => a.id === id);
      if (!analysis) {
        throw new Error('Análisis no encontrado');
      }
      return analysis;
    } catch (error) {
      console.error('Error fetching analysis:', error);
      throw error;
    }
  },

  createAnalysis: async (analysisData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newAnalysis = {
        ...analysisData,
        id: `lab-${Date.now()}`,
        analysis_id: `LAB-${Date.now()}`,
        status: 'pending',
        parameters: [],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Agregar a la lista local
      demoAnalysis.push(newAnalysis);
      
      return newAnalysis;
    } catch (error) {
      console.error('Error creating analysis:', error);
      throw error;
    }
  },

  updateAnalysis: async (id, analysisData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const index = demoAnalysis.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('Análisis no encontrado');
      }
      
      const updatedAnalysis = {
        ...demoAnalysis[index],
        ...analysisData,
        updated_at: new Date()
      };
      
      demoAnalysis[index] = updatedAnalysis;
      
      return updatedAnalysis;
    } catch (error) {
      console.error('Error updating analysis:', error);
      throw error;
    }
  },

  deleteAnalysis: async (id) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = demoAnalysis.findIndex(a => a.id === id);
      if (index === -1) {
        throw new Error('Análisis no encontrado');
      }
      
      demoAnalysis.splice(index, 1);
      
      return { id, deleted: true };
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  },

  // KPIs de laboratorio
  getLaboratoryKPIs: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const completedAnalysis = demoAnalysis.filter(a => a.status === 'completed').length;
      const pendingAnalysis = demoAnalysis.filter(a => a.status === 'pending').length;
      const inProgressAnalysis = demoAnalysis.filter(a => a.status === 'in_progress').length;
      const failedAnalysis = demoAnalysis.filter(a => a.status === 'failed').length;
      
      return {
        total_analysis: demoAnalysis.length,
        completed_analysis: completedAnalysis,
        pending_analysis: pendingAnalysis,
        in_progress_analysis: inProgressAnalysis,
        failed_analysis: failedAnalysis
      };
    } catch (error) {
      console.error('Error fetching laboratory KPIs:', error);
      return {
        total_analysis: demoAnalysis.length,
        completed_analysis: demoAnalysis.filter(a => a.status === 'completed').length,
        pending_analysis: demoAnalysis.filter(a => a.status === 'pending').length,
        in_progress_analysis: demoAnalysis.filter(a => a.status === 'in_progress').length,
        failed_analysis: demoAnalysis.filter(a => a.status === 'failed').length
      };
    }
  },

  // Tipos de análisis
  getAnalysisTypes: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [
        { id: 'chemical', name: 'Análisis Químico', description: 'Análisis de composición química' },
        { id: 'physical', name: 'Análisis Físico', description: 'Pruebas físicas y mecánicas' },
        { id: 'corrosion', name: 'Prueba de Corrosión', description: 'Ensayos de resistencia a corrosión' },
        { id: 'coating', name: 'Análisis de Recubrimiento', description: 'Medición de espesor y adherencia' }
      ];
    } catch (error) {
      console.error('Error fetching analysis types:', error);
      return [];
    }
  }
};

export default laboratoryService;

// Servicio para ejecución de inspecciones - MIGRADO A FIRESTORE
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const inspectionExecutionService = {
  // Obtener inspecciones pendientes para ejecutar
  getPendingInspections: async () => {
    try {
      // Cargar desde Firestore
      const q = query(collection(db, 'inspectionExecution'), where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      const inspections = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Inspecciones pendientes cargadas desde Firestore:', inspections.length);
      return inspections.length > 0 ? inspections : [];
    } catch (error) {
      console.error('❌ Error al cargar inspecciones pendientes:', error);
      return [];
    }
  },

  // Obtener inspecciones por orden de trabajo
  getInspectionsByWorkOrder: async (workOrderId) => {
    try {
      // Cargar desde Firestore
      const q = query(collection(db, 'inspectionExecution'), where('work_order_id', '==', workOrderId));
      const querySnapshot = await getDocs(q);
      const inspections = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Inspecciones por orden cargadas desde Firestore:', inspections.length);
      return inspections;
    } catch (error) {
      console.error('❌ Error al cargar inspecciones por orden:', error);
      return [];
    }
  },

  // Crear nueva ejecución de inspección
  createInspectionExecution: async (executionData) => {
    try {
      // Guardar en Firestore
      const docRef = await addDoc(collection(db, 'inspectionExecution'), {
        ...executionData,
        status: executionData.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const newExecution = {
        id: docRef.id,
        ...executionData,
        status: executionData.status || 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('✅ Ejecución de inspección guardada en Firestore:', docRef.id);
      return newExecution;
    } catch (error) {
      console.error('❌ Error al crear ejecución de inspección:', error);
      throw error;
    }
  },

  // Registrar resultado de inspección
  registerInspectionResult: async (executionId, inspectionId, resultData) => {
    try {
      // Actualizar en Firestore
      const executionRef = doc(db, 'inspectionExecution', executionId);
      const executionSnapshot = await getDoc(executionRef);
      
      if (executionSnapshot.exists()) {
        const execution = executionSnapshot.data();
        const inspections = execution.inspections || [];
        
        // Buscar y actualizar la inspección
        const updatedInspections = inspections.map(insp => 
          insp.id === inspectionId 
            ? { ...insp, status: 'completed', result: resultData, result_date: new Date().toISOString() }
            : insp
        );
        
        await updateDoc(executionRef, {
          inspections: updatedInspections,
          updated_at: new Date().toISOString()
        });
        
        console.log('✅ Resultado de inspección registrado en Firestore');
        return { success: true, inspectionId };
      }
      
      throw new Error('Ejecución de inspección no encontrada');
    } catch (error) {
      console.error('❌ Error al registrar resultado de inspección:', error);
      throw error;
    }
  },

  // Completar ejecución de inspección
  completeInspectionExecution: async (executionId) => {
    try {
      const executionRef = doc(db, 'inspectionExecution', executionId);
      await updateDoc(executionRef, {
        status: 'completed',
        completed_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      console.log('✅ Ejecución de inspección completada en Firestore');
      return { success: true, executionId };
    } catch (error) {
      console.error('❌ Error al completar ejecución de inspección:', error);
      throw error;
    }
  },

  // Obtener historial de ejecuciones
  getExecutionHistory: async (filters = {}) => {
    try {
      // Cargar desde Firestore
      const q = query(
        collection(db, 'inspectionExecution'),
        where('status', '==', 'completed'),
        orderBy('completed_date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Historial de ejecuciones cargado desde Firestore:', history.length);
      return history;
    } catch (error) {
      console.error('❌ Error al cargar historial de ejecuciones:', error);
      return [];
    }
  },

  // Obtener detalles de ejecución específica
  getExecutionDetails: async (executionId) => {
    try {
      // Obtener de Firestore
      const executionRef = doc(db, 'inspectionExecution', executionId);
      const executionSnapshot = await getDoc(executionRef);
      
      if (executionSnapshot.exists()) {
        console.log('✅ Detalles de ejecución cargados desde Firestore');
        return {
          id: executionSnapshot.id,
          ...executionSnapshot.data()
        };
      }
      
      throw new Error('Ejecución no encontrada');
    } catch (error) {
      console.error('❌ Error al cargar detalles de ejecución:', error);
      throw error;
    }
  },

  // Validar resultado contra tolerancias
  validateResult: (result, toleranceMin, toleranceMax, inspectionType) => {
    if (inspectionType === 'visual' || inspectionType === 'laboratorio') {
      // Para inspecciones visuales o de laboratorio, generalmente es pass/fail
      return result === 'pass' || result === 'aprobado' || result === 'conforme';
    }
    
    if (toleranceMin !== null && toleranceMax !== null) {
      const numericResult = parseFloat(result);
      return numericResult >= toleranceMin && numericResult <= toleranceMax;
    }
    
    return true; // Si no hay tolerancias definidas, se considera aprobado
  },

  // Calcular tamaño de muestra basado en AQL y nivel de muestreo
  calculateSampleSize: (batchSize, aql, samplingLevel) => {
    // Tabla simplificada de muestreo (ANSI/ASQ Z1.4)
    const sampleSizeTable = {
      'I': { '2-8': 2, '9-15': 3, '16-25': 5, '26-50': 8, '51-90': 13, '91-150': 20 },
      'II': { '2-8': 2, '9-15': 3, '16-25': 5, '26-50': 8, '51-90': 13, '91-150': 20 },
      'III': { '2-8': 3, '9-15': 5, '16-25': 8, '26-50': 13, '51-90': 20, '91-150': 32 }
    };

    const range = Object.keys(sampleSizeTable[samplingLevel]).find(range => {
      const [min, max] = range.split('-').map(Number);
      return batchSize >= min && batchSize <= max;
    });

    return range ? sampleSizeTable[samplingLevel][range] : 20;
  }
};

export default inspectionExecutionService;

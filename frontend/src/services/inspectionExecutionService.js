// Servicio para ejecución de inspecciones
const API_BASE_URL = 'http://localhost:3001/api';

const inspectionExecutionService = {
  // Obtener inspecciones pendientes para ejecutar
  getPendingInspections: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inspection-execution/pending`);
      if (!response.ok) throw new Error('Error fetching pending inspections');
      return await response.json();
    } catch (error) {
      console.error('Error fetching pending inspections:', error);
      // Retornar datos mock para desarrollo
      return [
        {
          id: 'exec-1',
          product_id: 'prod-1',
          product_name: 'Pieza Zinc Plating #001',
          product_part_number: 'ZP-001',
          work_order_id: 'wo-001',
          work_order_number: 'PO-2024-001',
          batch_number: 'BATCH-001',
          scheduled_date: '2024-01-20T08:00:00Z',
          status: 'pending',
          inspections: [
            {
              id: 'insp-exec-1',
              inspection_id: 1,
              inspection_name: 'Espesor de Recubrimiento',
              inspection_type: 'medicion',
              tolerance_min: 25,
              tolerance_max: 35,
              unit: 'μm',
              acceptance_criteria: 'Espesor mínimo según especificación de cliente',
              aql: '2.5',
              sampling_level: 'II',
              is_required: true,
              sequence_order: 1,
              status: 'pending',
              results: []
            },
            {
              id: 'insp-exec-2',
              inspection_id: 2,
              inspection_name: 'Prueba de Adhesión',
              inspection_type: 'laboratorio',
              tolerance_min: null,
              tolerance_max: null,
              unit: null,
              acceptance_criteria: 'Sin desprendimiento del recubrimiento',
              aql: '1.0',
              sampling_level: 'I',
              is_required: true,
              sequence_order: 2,
              status: 'pending',
              results: []
            }
          ]
        }
      ];
    }
  },

  // Obtener inspecciones por orden de trabajo
  getInspectionsByWorkOrder: async (workOrderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inspection-execution/work-order/${workOrderId}`);
      if (!response.ok) throw new Error('Error fetching work order inspections');
      return await response.json();
    } catch (error) {
      console.error('Error fetching work order inspections:', error);
      throw error;
    }
  },

  // Crear nueva ejecución de inspección
  createInspectionExecution: async (executionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inspection-execution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(executionData),
      });
      if (!response.ok) throw new Error('Error creating inspection execution');
      return await response.json();
    } catch (error) {
      console.error('Error creating inspection execution:', error);
      throw error;
    }
  },

  // Registrar resultado de inspección
  registerInspectionResult: async (executionId, inspectionId, resultData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inspection-execution/${executionId}/inspections/${inspectionId}/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultData),
      });
      if (!response.ok) throw new Error('Error registering inspection result');
      return await response.json();
    } catch (error) {
      console.error('Error registering inspection result:', error);
      throw error;
    }
  },

  // Completar ejecución de inspección
  completeInspectionExecution: async (executionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inspection-execution/${executionId}/complete`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Error completing inspection execution');
      return await response.json();
    } catch (error) {
      console.error('Error completing inspection execution:', error);
      throw error;
    }
  },

  // Obtener historial de ejecuciones
  getExecutionHistory: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/inspection-execution/history?${queryParams}`);
      if (!response.ok) throw new Error('Error fetching execution history');
      return await response.json();
    } catch (error) {
      console.error('Error fetching execution history:', error);
      // Retornar datos mock para desarrollo
      return [
        {
          id: 'exec-1',
          product_name: 'Pieza Zinc Plating #001',
          work_order_number: 'PO-2024-001',
          batch_number: 'BATCH-001',
          execution_date: '2024-01-20T10:30:00Z',
          completed_date: '2024-01-20T11:45:00Z',
          status: 'completed',
          inspector: 'Juan Pérez',
          total_inspections: 2,
          passed_inspections: 2,
          failed_inspections: 0,
          non_conformities: 0
        },
        {
          id: 'exec-2',
          product_name: 'Bracket Assembly #002',
          work_order_number: 'PO-2024-002',
          batch_number: 'BATCH-002',
          execution_date: '2024-01-21T09:00:00Z',
          completed_date: '2024-01-21T10:15:00Z',
          status: 'completed',
          inspector: 'María García',
          total_inspections: 3,
          passed_inspections: 2,
          failed_inspections: 1,
          non_conformities: 1
        }
      ];
    }
  },

  // Obtener detalles de ejecución específica
  getExecutionDetails: async (executionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/inspection-execution/${executionId}`);
      if (!response.ok) throw new Error('Error fetching execution details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching execution details:', error);
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

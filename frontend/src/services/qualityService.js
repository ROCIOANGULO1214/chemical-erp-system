import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

// Simulación de datos para demo
const demoQualityControls = [
  {
    id: 'qc-1',
    control_id: 'QC-001',
    production_order_id: 'po-1',
    order_number: 'OP-2024-001',
    part_number: 'ZP-001-001',
    customer_name: 'Automotriz del Norte S.A.',
    control_type: 'incoming',
    status: 'approved',
    inspection_date: new Date('2024-03-22'),
    inspector: 'Ana García',
    batch_size: 1000,
    sample_size: 32,
    aql: 0.65,
    tests: [
      {
        test_id: 'QT-001',
        name: 'Espesor de recubrimiento',
        specification: '25-35 μm',
        results: [
          { sample: 1, value: 28, status: 'passed' },
          { sample: 2, value: 30, status: 'passed' },
          { sample: 3, value: 27, status: 'passed' },
          { sample: 4, value: 29, status: 'passed' },
          { sample: 5, value: 31, status: 'passed' }
        ],
        defects: 0,
        overall_status: 'passed'
      },
      {
        test_id: 'QT-002',
        name: 'Adherencia',
        specification: '8-10 MPa',
        results: [
          { sample: 1, value: 9.2, status: 'passed' },
          { sample: 2, value: 8.8, status: 'passed' },
          { sample: 3, value: 9.5, status: 'passed' }
        ],
        defects: 0,
        overall_status: 'passed'
      }
    ],
    overall_status: 'approved',
    notes: 'Control de calidad aprobado. Todos los parámetros dentro de especificaciones.',
    created_at: new Date('2024-03-22'),
    updated_at: new Date('2024-03-22')
  },
  {
    id: 'qc-2',
    control_id: 'QC-002',
    production_order_id: 'po-3',
    order_number: 'OP-2024-003',
    part_number: 'CR-003-003',
    customer_name: 'Electrodomésticos del Centro',
    control_type: 'final',
    status: 'rejected',
    inspection_date: new Date('2024-03-24'),
    inspector: 'Roberto Silva',
    batch_size: 750,
    sample_size: 25,
    aql: 0.65,
    tests: [
      {
        test_id: 'QT-005',
        name: 'Resistencia a corrosión',
        specification: '>96 horas',
        results: [
          { sample: 1, value: 85, status: 'failed' },
          { sample: 2, value: 82, status: 'failed' },
          { sample: 3, value: 88, status: 'failed' }
        ],
        defects: 3,
        overall_status: 'failed'
      }
    ],
    overall_status: 'rejected',
    notes: 'Control de calidad rechazado por falla en prueba de corrosión. Se requiere reprocesamiento completo del lote.',
    created_at: new Date('2024-03-24'),
    updated_at: new Date('2024-03-24')
  }
];

const demoQualityStandards = [
  {
    id: 'qs-1',
    standard_id: 'QS-001',
    name: 'Estándar Zinc Plating Automotriz',
    description: 'Requisitos de calidad para recubrimiento de zinc en industria automotriz',
    tests: [
      {
        test_id: 'QT-001',
        name: 'Espesor de recubrimiento',
        method: 'Coating Thickness Gauge',
        specification_min: 25,
        specification_max: 35,
        unit: 'μm',
        aql: 0.65
      },
      {
        test_id: 'QT-002',
        name: 'Adherencia',
        method: 'Cross-cut test',
        specification_min: 8,
        specification_max: 10,
        unit: 'MPa',
        aql: 0.65
      }
    ],
    created_at: new Date('2024-01-10'),
    updated_at: new Date('2024-01-10')
  },
  {
    id: 'qs-2',
    standard_id: 'QS-002',
    name: 'Estándar Anodizado Aeroespacial',
    description: 'Requisitos especiales para componentes aeroespaciales anodizados',
    tests: [
      {
        test_id: 'QT-003',
        name: 'Dureza superficial',
        method: 'Vickers Hardness Test',
        specification_min: 350,
        specification_max: 450,
        unit: 'HV',
        aql: 0.40
      },
      {
        test_id: 'QT-004',
        name: 'Espesor de capa anódica',
        method: 'Eddy Current Test',
        specification_min: 15,
        specification_max: 25,
        unit: 'μm',
        aql: 0.40
      }
    ],
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  }
];

const qualityService = {
  // Controles de Calidad CRUD
  getQualityControls: async (filters = {}) => {
    try {
      // Cargar desde Firebase
      const querySnapshot = await getDocs(collection(db, 'qualityControls'));
      let firebaseControls = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Combinar con datos demo
      let allControls = [...demoQualityControls, ...firebaseControls];
      
      // Eliminar duplicados
      const uniqueControls = [];
      const seenIds = new Set();
      for (const control of allControls) {
        if (!seenIds.has(control.id)) {
          seenIds.add(control.id);
          uniqueControls.push(control);
        }
      }
      
      let filteredControls = uniqueControls;
      
      if (filters.status) {
        filteredControls = filteredControls.filter(control => 
          control.status === filters.status
        );
      }
      
      if (filters.control_type) {
        filteredControls = filteredControls.filter(control => 
          control.control_type === filters.control_type
        );
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredControls = filteredControls.filter(control => 
          control.control_id.toLowerCase().includes(searchLower) ||
          control.part_number.toLowerCase().includes(searchLower) ||
          control.customer_name.toLowerCase().includes(searchLower)
        );
      }
      
      console.log('✅ Controles de calidad cargados desde Firestore:', filteredControls.length);
      return filteredControls;
    } catch (error) {
      console.error('❌ Error al cargar controles de Firestore:', error);
      return demoQualityControls;
    }
  },

  getQualityControlById: async (id) => {
    try {
      // Obtener de Firebase
      const controlRef = doc(db, 'qualityControls', id);
      const controlSnapshot = await getDoc(controlRef);
      
      if (controlSnapshot.exists()) {
        console.log('✅ Control cargado desde Firestore:', id);
        return {
          id: controlSnapshot.id,
          ...controlSnapshot.data()
        };
      }
      
      // Fallback a demo
      const control = demoQualityControls.find(qc => qc.id === id);
      if (!control) {
        throw new Error('Control de calidad no encontrado');
      }
      return control;
    } catch (error) {
      console.error('❌ Error al obtener control:', error);
      throw error;
    }
  },

  createQualityControl: async (controlData) => {
    try {
      // Guardar en Firebase
      const docRef = await addDoc(collection(db, 'qualityControls'), {
        ...controlData,
        status: controlData.status || 'pending',
        tests: controlData.tests || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const newControl = {
        id: docRef.id,
        ...controlData,
        status: controlData.status || 'pending',
        tests: controlData.tests || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Agregar a demo también
      demoQualityControls.push(newControl);
      
      console.log('✅ Control de calidad guardado en Firestore:', docRef.id);
      return newControl;
    } catch (error) {
      console.error('❌ Error al crear control en Firestore:', error);
      throw error;
    }
  },

  updateQualityControl: async (id, controlData) => {
    try {
      // Actualizar en Firebase
      const controlRef = doc(db, 'qualityControls', id);
      const updatedData = {
        ...controlData,
        updated_at: new Date().toISOString()
      };
      
      await updateDoc(controlRef, updatedData);
      console.log('✅ Control actualizado en Firestore:', id);
      
      // Actualizar en demo también
      const index = demoQualityControls.findIndex(qc => qc.id === id);
      if (index !== -1) {
        demoQualityControls[index] = {
          ...demoQualityControls[index],
          ...controlData,
          updated_at: new Date()
        };
      }
      
      return {
        id,
        ...controlData,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error al actualizar control en Firestore:', error);
      throw error;
    }
  },

  deleteQualityControl: async (id) => {
    try {
      // Eliminar de Firebase
      const controlRef = doc(db, 'qualityControls', id);
      await deleteDoc(controlRef);
      console.log('✅ Control eliminado de Firestore:', id);
      
      // Eliminar de demo también
      const index = demoQualityControls.findIndex(qc => qc.id === id);
      if (index !== -1) {
        demoQualityControls.splice(index, 1);
      }
      
      return { id, deleted: true };
    } catch (error) {
      console.error('❌ Error al eliminar control de Firestore:', error);
      throw error;
    }
  },

  // Estándares de Calidad
  getQualityStandards: async () => {
    try {
      // Cargar desde Firebase
      const querySnapshot = await getDocs(collection(db, 'qualityStandards'));
      let firebaseStandards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Combinar con datos demo
      let allStandards = [...demoQualityStandards, ...firebaseStandards];
      
      // Eliminar duplicados
      const uniqueStandards = [];
      const seenIds = new Set();
      for (const standard of allStandards) {
        if (!seenIds.has(standard.id)) {
          seenIds.add(standard.id);
          uniqueStandards.push(standard);
        }
      }
      
      console.log('✅ Estándares de calidad cargados desde Firestore:', uniqueStandards.length);
      return uniqueStandards;
    } catch (error) {
      console.error('❌ Error al cargar estándares de Firestore:', error);
      return demoQualityStandards;
    }
  },

  getQualityStandardById: async (id) => {
    try {
      // Obtener de Firebase
      const standardRef = doc(db, 'qualityStandards', id);
      const standardSnapshot = await getDoc(standardRef);
      
      if (standardSnapshot.exists()) {
        console.log('✅ Estándar cargado desde Firestore:', id);
        return {
          id: standardSnapshot.id,
          ...standardSnapshot.data()
        };
      }
      
      // Fallback a demo
      const standard = demoQualityStandards.find(qs => qs.id === id);
      if (!standard) {
        throw new Error('Estándar de calidad no encontrado');
      }
      return standard;
    } catch (error) {
      console.error('❌ Error al obtener estándar:', error);
      throw error;
    }
  },

  createQualityStandard: async (standardData) => {
    try {
      // Guardar en Firebase
      const docRef = await addDoc(collection(db, 'qualityStandards'), {
        ...standardData,
        tests: standardData.tests || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      const newStandard = {
        id: docRef.id,
        ...standardData,
        tests: standardData.tests || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Agregar a demo también
      demoQualityStandards.push(newStandard);
      
      console.log('✅ Estándar de calidad guardado en Firestore:', docRef.id);
      return newStandard;
    } catch (error) {
      console.error('❌ Error al crear estándar en Firestore:', error);
      throw error;
    }
  },

  // Instrucciones de liberación
  getReleaseInstructions: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'releaseInstructions'));
      const firebaseInstructions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Instrucciones de liberación cargadas desde Firestore:', firebaseInstructions.length);
      return firebaseInstructions;
    } catch (error) {
      console.error('❌ Error al cargar instrucciones de liberación de Firestore:', error);
      return [];
    }
  },

  createReleaseInstruction: async (instructionData) => {
    try {
      const docRef = await addDoc(collection(db, 'releaseInstructions'), {
        ...instructionData,
        created_at: instructionData.created_at || new Date().toISOString(),
        updated_at: instructionData.updated_at || new Date().toISOString()
      });
      
      const newInstruction = {
        id: docRef.id,
        ...instructionData,
        created_at: instructionData.created_at || new Date().toISOString(),
        updated_at: instructionData.updated_at || new Date().toISOString()
      };
      
      console.log('✅ Instrucción de liberación guardada en Firestore:', docRef.id);
      return newInstruction;
    } catch (error) {
      console.error('❌ Error al crear instrucción de liberación en Firestore:', error);
      throw error;
    }
  },

  // KPIs de calidad
  getQualityKPIs: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const approvedControls = demoQualityControls.filter(qc => qc.status === 'approved').length;
      const rejectedControls = demoQualityControls.filter(qc => qc.status === 'rejected').length;
      const pendingControls = demoQualityControls.filter(qc => qc.status === 'pending').length;
      
      return {
        total_controls: demoQualityControls.length,
        approved_controls: approvedControls,
        rejected_controls: rejectedControls,
        pending_controls: pendingControls,
        approval_rate: demoQualityControls.length > 0 ? (approvedControls / demoQualityControls.length * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error fetching quality KPIs:', error);
      return {
        total_controls: demoQualityControls.length,
        approved_controls: demoQualityControls.filter(qc => qc.status === 'approved').length,
        rejected_controls: demoQualityControls.filter(qc => qc.status === 'rejected').length,
        pending_controls: demoQualityControls.filter(qc => qc.status === 'pending').length,
        approval_rate: 0
      };
    }
  },

  // Tipos de control
  getControlTypes: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [
        { id: 'incoming', name: 'Control de Recepción', description: 'Inspección de materias primas recibidas' },
        { id: 'in_process', name: 'Control en Proceso', description: 'Inspección durante el proceso productivo' },
        { id: 'final', name: 'Control Final', description: 'Inspección final del producto terminado' },
        { id: 'outgoing', name: 'Control de Despacho', description: 'Inspección antes del envío al cliente' }
      ];
    } catch (error) {
      console.error('Error fetching control types:', error);
      return [];
    }
  },

  // Pruebas de calidad
  getQualityTests: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return [
        {
          id: 'qt-1',
          test_id: 'QT-001',
          name: 'Espesor de Recubrimiento',
          description: 'Medición del espesor del recubrimiento aplicado',
          equipment: 'Micrómetro Digital Mitutoyo 293-240',
          specifications: { min: 25, max: 35, unit: 'μm' },
          tolerance_range: '25-35 μm',
          instructions: 'INS-001-Espesor',
          test_type: 'measurement',
          is_active: true,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        },
        {
          id: 'qt-2',
          test_id: 'QT-002',
          name: 'Adherencia',
          description: 'Prueba de adherencia del recubrimiento',
          equipment: 'Cuchilla de Corte ASTM D3359',
          specifications: { min: 8, max: 10, unit: 'MPa' },
          tolerance_range: '8-10 MPa',
          instructions: 'INS-002-Adherencia',
          test_type: 'mechanical',
          is_active: true,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        },
        {
          id: 'qt-3',
          test_id: 'QT-003',
          name: 'Inspección Visual',
          description: 'Inspección visual de defectos superficiales',
          equipment: 'Lupa Estereoscópica 10x',
          specifications: 'Sin defectos visibles',
          tolerance_range: 'Sin defectos visibles',
          instructions: 'INS-003-Visual',
          test_type: 'visual',
          is_active: true,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        },
        {
          id: 'qt-4',
          test_id: 'QT-004',
          name: 'Dureza Superficial',
          description: 'Medición de dureza superficial del recubrimiento',
          equipment: 'Durómetro Vickers HV-1000',
          specifications: { min: 300, max: 450, unit: 'HV' },
          tolerance_range: '300-450 HV',
          instructions: 'INS-004-Dureza',
          test_type: 'measurement',
          is_active: true,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        },
        {
          id: 'qt-5',
          test_id: 'QT-005',
          name: 'Test de Salina',
          description: 'Prueba de corrosión en cámara de niebla salina',
          equipment: 'Cámara de Niebla Salina ASTM B117',
          specifications: { min: 96, max: 120, unit: 'horas' },
          tolerance_range: '96-120 horas',
          instructions: 'INS-005-Salina',
          test_type: 'corrosion',
          is_active: true,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        },
        {
          id: 'qt-6',
          test_id: 'QT-006',
          name: 'Rugosidad',
          description: 'Medición de rugosidad superficial',
          equipment: 'Rugosímetro Surftest SJ-210',
          specifications: { max: 0.8, unit: 'Ra μm' },
          tolerance_range: '≤ 0.8 Ra μm',
          instructions: 'INS-006-Rugosidad',
          test_type: 'measurement',
          is_active: true,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        }
      ];
    } catch (error) {
      console.error('Error fetching quality tests:', error);
      return [];
    }
  },

  // CRUD para pruebas de calidad
  createQualityTest: async (testData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const newTest = {
        id: `qt-${Date.now()}`,
        ...testData,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // En una implementación real, esto se guardaría en la base de datos
      console.log('Creating quality test:', newTest);
      
      return newTest;
    } catch (error) {
      console.error('Error creating quality test:', error);
      throw error;
    }
  },

  updateQualityTest: async (testId, testData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const updatedTest = {
        id: testId,
        ...testData,
        updated_at: new Date()
      };
      
      // En una implementación real, esto se actualizaría en la base de datos
      console.log('Updating quality test:', updatedTest);
      
      return updatedTest;
    } catch (error) {
      console.error('Error updating quality test:', error);
      throw error;
    }
  },

  deleteQualityTest: async (testId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // En una implementación real, esto se eliminaría de la base de datos
      console.log('Deleting quality test:', testId);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting quality test:', error);
      throw error;
    }
  },

  // Inspecciones de calidad (para QualityControl.js)
  getQualityInspections: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return [
        {
          id: 'insp-1',
          inspection_id: 'INS-001',
          production_order_id: 'PO-2024-001',
          product_name: 'Pieza Zinc Plating #001',
          test_name: 'Espesor de Recubrimiento',
          result: 28.5,
          unit: 'μm',
          status: 'approved',
          inspector: 'Juan Pérez',
          inspection_date: new Date('2024-01-15'),
          notes: 'Dentro de especificaciones'
        },
        {
          id: 'insp-2',
          inspection_id: 'INS-002',
          production_order_id: 'PO-2024-002',
          product_name: 'Pieza Anodizado #002',
          test_name: 'Adherencia',
          result: 9.2,
          unit: 'MPa',
          status: 'approved',
          inspector: 'María López',
          inspection_date: new Date('2024-01-16'),
          notes: 'Excelente adherencia'
        },
        {
          id: 'insp-3',
          inspection_id: 'INS-003',
          production_order_id: 'PO-2024-003',
          product_name: 'Pieza Cromatizado #003',
          test_name: 'Inspección Visual',
          result: 'Aprobado',
          unit: '',
          status: 'approved',
          inspector: 'Carlos Ruiz',
          inspection_date: new Date('2024-01-17'),
          notes: 'Sin defectos visibles'
        },
        {
          id: 'insp-4',
          inspection_id: 'INS-004',
          production_order_id: 'PO-2024-004',
          product_name: 'Pieza Pasivado #004',
          test_name: 'Test de Salina',
          result: 105,
          unit: 'horas',
          status: 'pending',
          inspector: 'Ana García',
          inspection_date: new Date('2024-01-18'),
          notes: 'En progreso'
        }
      ];
    } catch (error) {
      console.error('Error fetching quality inspections:', error);
      return [];
    }
  },

  getNonConformities: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return [
        {
          id: 'nc-1',
          non_conformity_id: 'NC-001',
          production_order_id: 'PO-2024-005',
          product_name: 'Pieza Zinc Plating #005',
          description: 'Espesor de recubrimiento fuera de especificación',
          severity: 'major',
          status: 'open',
          detected_date: new Date('2024-01-20'),
          responsible: 'Juan Pérez',
          corrective_action: 'Ajustar parámetros del baño'
        },
        {
          id: 'nc-2',
          non_conformity_id: 'NC-002',
          production_order_id: 'PO-2024-006',
          product_name: 'Pieza Anodizado #006',
          description: 'Manchas superficiales detectadas',
          severity: 'minor',
          status: 'closed',
          detected_date: new Date('2024-01-19'),
          responsible: 'María López',
          corrective_action: 'Mejorar limpieza pre-anodizado'
        }
      ];
    } catch (error) {
      console.error('Error fetching non conformities:', error);
      return [];
    }
  },

  getCapaActions: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Retornar array vacío ya que el usuario pidió eliminar acciones CAPA
      return [];
    } catch (error) {
      console.error('Error fetching CAPA actions:', error);
      return [];
    }
  },

  getQualityTestById: async (testId) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const tests = await qualityService.getQualityTests();
      return tests.find(test => test.id === testId);
    } catch (error) {
      console.error('Error fetching quality test by ID:', error);
      return null;
    }
  }
};

export default qualityService;

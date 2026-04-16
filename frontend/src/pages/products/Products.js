import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Package,
  FileText,
  Image,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  GitBranch,
  Workflow,
  Layers,
  Settings
} from 'lucide-react';
import productsService from '../../services/productsService';
import inventoryService from '../../services/inventoryService';
import qualityService from '../../services/qualityService';
import inspectionCatalogService from '../../services/inspectionCatalogService';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';

// Simulación de usuario actual
const currentUser = {
  role: 'admin', // Cambiar a otros roles para probar restricciones
  name: 'Administrador'
};

const Products = () => {
  console.log('🔥 Products.js se está cargando');
  
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [qualityTests, setQualityTests] = useState([]);
  const [inspectionCatalog, setInspectionCatalog] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [processFilter, setProcessFilter] = useState('');
  
  // Estados para paginación y ordenamiento
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('part_number');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProductPanel, setShowProductPanel] = useState(false);
  const [selectedProductForPanel, setSelectedProductForPanel] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedInstructionDoc, setSelectedInstructionDoc] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Estados para edición
  const [isEditing, setIsEditing] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  
  // Estados para el formulario extendido de productos
  const [processes, setProcesses] = useState([]);
  const [releaseInstructions, setReleaseInstructions] = useState([]);
  const [productFormData, setProductFormData] = useState({
    part_number: '',
    revision: '',
    description: '',
    notes: '',
    customer_id: '',
    customer_name: '',
    process_id: '',
    process_name: '',
    is_active: true,
    preview_image: '',
    preview_image_name: '',
    drawing_pdf: '',
    drawing_pdf_name: '',
    quality_tests: [],
    // Nuevos campos para calidad
    quality_inspections: [],
    release_instructions_id: '',
    release_instructions_name: ''
  });

  // Verificar permisos de acceso
  const hasAccess = () => {
    const allowedRoles = ['admin', 'supervisor', 'operator', 'planning', 'quality'];
    return allowedRoles.includes(currentUser.role);
  };

  const canEdit = () => {
    const allowedRoles = ['admin', 'planning'];
    return allowedRoles.includes(currentUser.role);
  };

  const canDelete = () => {
    const allowedRoles = ['admin', 'planning'];
    return allowedRoles.includes(currentUser.role);
  };

  useEffect(() => {
    if (!hasAccess()) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    
    fetchData();
    
    // Cargar instrucciones de liberación desde localStorage (guardadas en QualityControl)
    const savedInstructions = localStorage.getItem('releaseInstructions');
    console.log('🔍 Instrucciones encontradas en localStorage:', savedInstructions);
    if (savedInstructions) {
      try {
        const parsed = JSON.parse(savedInstructions);
        console.log('📋 Instrucciones parseadas:', parsed);
        setReleaseInstructions(parsed);
      } catch (error) {
        console.error('Error al cargar instrucciones desde localStorage:', error);
      }
    } else {
      console.log('❌ No hay instrucciones en localStorage');
    }

    // Listener para sincronizar con QualityControl
    const handleStorageChange = (e) => {
      if (e.key === 'releaseInstructions') {
        console.log('🔄 Cambio detectado en localStorage:', e.newValue);
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setReleaseInstructions(parsed);
          } catch (error) {
            console.error('Error al parsear instrucciones actualizadas:', error);
          }
        } else {
          setReleaseInstructions([]);
        }
      }
      
      if (e.key === 'inspectionCatalog') {
        console.log('🔄 Cambio detectado en catálogo de inspecciones:', e.newValue);
        if (e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setInspectionCatalog(parsed);
          } catch (error) {
            console.error('Error al parsear catálogo de inspecciones actualizado:', error);
          }
        } else {
          setInspectionCatalog([]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup al desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, customerFilter, sortField, sortOrder]);

  useEffect(() => {
    console.log('🔄 releaseInstructions actualizadas:', releaseInstructions);
  }, [releaseInstructions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Cargar productos
      try {
        const productsData = await productsService.getProducts();
        
        // Cargar IDs de productos eliminados desde localStorage
        const deletedProducts = localStorage.getItem('deletedProducts');
        let deletedIds = [];
        if (deletedProducts) {
          try {
            deletedIds = JSON.parse(deletedProducts);
          } catch (error) {
            console.error('Error parsing deleted products:', error);
          }
        }
        
        // Filtrar productos eliminados
        const filteredProducts = (productsData || []).filter(
          product => !deletedIds.includes(product.id)
        );
        
        setProducts(filteredProducts);
      } catch (error) {
        console.error('Error loading products:', error);
        setProducts([]);
      }
      
      // Cargar clientes
      try {
        const customersData = await inventoryService.getCustomers();
        console.log('📋 Clientes cargados desde servicio:', customersData);
        console.log('📋 Tipo de datos:', typeof customersData);
        console.log('📋 Es array:', Array.isArray(customersData));
        console.log('📋 Longitud:', customersData?.length);
        console.log('📋 Primer cliente:', customersData?.[0]);
        console.log('📋 Nombres de clientes:', customersData?.map(c => c.name || c.customer_name).join(', '));
        
        // Verificar si hay clientes en localStorage
        const savedCustomers = localStorage.getItem('customers');
        console.log('📋 Clientes en localStorage:', savedCustomers);
        
        if (savedCustomers) {
          try {
            const parsed = JSON.parse(savedCustomers);
            console.log('📋 Clientes parseados de localStorage:', parsed);
            setCustomers(parsed);
          } catch (error) {
            console.error('Error parsing localStorage customers:', error);
            setCustomers(customersData || []);
          }
        } else {
          console.log('📋 Usando clientes del servicio (no hay en localStorage)');
          setCustomers(customersData || []);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        setCustomers([]);
      }
      
      // Cargar pruebas de calidad
      try {
        const qualityTestsData = await qualityService.getQualityTests();
        setQualityTests(qualityTestsData || []);
      } catch (error) {
        console.error('Error loading quality tests:', error);
        setQualityTests([]);
      }
      
      // Cargar KPIs
      try {
        const kpisData = await productsService.getProductsKPIs();
        setKpis(kpisData || null);
      } catch (error) {
        console.error('Error loading KPIs:', error);
        setKpis(null);
      }
      
      // Cargar catálogo de inspecciones desde localStorage (después de limpiar)
      const savedInspections = localStorage.getItem('inspectionCatalog');
      console.log('🔍 Catálogo de inspecciones encontrado en localStorage:', savedInspections);
      if (savedInspections) {
        try {
          const parsed = JSON.parse(savedInspections);
          console.log('🔍 Catálogo de inspecciones parseado:', parsed);
          setInspectionCatalog(parsed);
        } catch (error) {
          console.error('Error al cargar catálogo de inspecciones desde localStorage:', error);
          setInspectionCatalog([]);
        }
      } else {
        console.log('❌ No hay catálogo de inspecciones en localStorage');
        setInspectionCatalog([]);
      }
      
      // Cargar datos de demo para procesos e instrucciones
      loadProcessesAndInstructions();
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // Asegurar que todos los estados tengan valores por defecto
      setProducts([]);
      setCustomers([]);
      setQualityTests([]);
      setInspectionCatalog([]);
      setKpis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess()) {
      fetchData();
    } else {
      setAccessDenied(true);
      setLoading(false);
    }
  }, []);

  // Efecto para sincronización automática con localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      console.log('🔄 Cambio detectado en localStorage:', e.key);
      
      if (e.key === 'processes') {
        console.log('🔄 Actualizando procesos desde localStorage');
        reloadProcesses();
      } else if (e.key === 'customers') {
        console.log('🔄 Actualizando clientes desde localStorage');
        reloadCustomers();
      } else if (e.key === 'subprocesses') {
        console.log('🔄 Actualizando subprocesos, recargando procesos');
        reloadProcesses();
      } else if (e.key === 'releaseInstructions') {
        console.log('🔄 Actualizando instrucciones de liberación');
        const savedInstructions = localStorage.getItem('releaseInstructions');
        if (savedInstructions) {
          try {
            const parsed = JSON.parse(savedInstructions);
            setReleaseInstructions(parsed);
          } catch (error) {
            console.error('Error al cargar instrucciones:', error);
            setReleaseInstructions([]);
          }
        }
      }
    };

    // Escuchar cambios en localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // También verificar periódicamente (fallback para misma pestaña)
    const interval = setInterval(() => {
      const currentProcesses = localStorage.getItem('processes');
      const currentCustomers = localStorage.getItem('customers');
      const currentSubprocesses = localStorage.getItem('subprocesses');
      
      if (currentProcesses && currentProcesses !== JSON.stringify(processes)) {
        console.log('🔄 Cambio detectado en procesos (verificación periódica)');
        reloadProcesses();
      }
      
      if (currentCustomers && currentCustomers !== JSON.stringify(customers)) {
        console.log('🔄 Cambio detectado en clientes (verificación periódica)');
        reloadCustomers();
      }
    }, 2000); // Verificar cada 2 segundos

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [processes, customers]); // Dependencias para comparar cambios

  useEffect(() => {
    console.log('👀 Estado actual de clientes:', customers);
    console.log('👀 Cantidad de clientes:', customers?.length || 0);
  }, [customers]);

  // Función para recargar clientes desde localStorage
  const reloadCustomers = () => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      try {
        const parsed = JSON.parse(savedCustomers);
        console.log('🔄 Clientes recargados desde localStorage:', parsed);
        // Solo reemplazar si hay datos en localStorage y son diferentes
        if (JSON.stringify(parsed) !== JSON.stringify(customers)) {
          setCustomers(parsed);
        }
      } catch (error) {
        console.error('❌ Error al recargar clientes:', error);
        // No borrar los clientes existentes si hay error
      }
    } else {
      console.log('⚠️ No hay clientes en localStorage, manteniendo clientes del servicio');
      // No hacer nada para mantener los clientes del servicio
    }
  };

  // Función para recargar procesos desde localStorage
  const reloadProcesses = () => {
    const savedProcesses = localStorage.getItem('processes');
    if (savedProcesses) {
      try {
        const parsed = JSON.parse(savedProcesses);
        
        // Cargar IDs de procesos eliminados
        const deletedProcesses = localStorage.getItem('deletedProcesses');
        let deletedIds = [];
        if (deletedProcesses) {
          try {
            deletedIds = JSON.parse(deletedProcesses);
          } catch (error) {
            console.error('Error parsing deleted processes:', error);
          }
        }
        
        // Filtrar procesos eliminados
        const filteredProcesses = parsed.filter(
          process => !deletedIds.includes(process.id)
        );
        
        console.log('🔄 Procesos recargados (filtrados):', filteredProcesses);
        setProcesses(filteredProcesses);
      } catch (error) {
        console.error('❌ Error al recargar procesos:', error);
        setProcesses([]);
      }
    } else {
      console.log('⚠️ No hay procesos en localStorage');
      setProcesses([]);
    }
  };

  const loadProcessesAndInstructions = async () => {
    // Cargar procesos desde localStorage
    const savedProcesses = localStorage.getItem('processes');
    if (savedProcesses) {
      try {
        const parsed = JSON.parse(savedProcesses);
        
        // Cargar IDs de procesos eliminados
        const deletedProcesses = localStorage.getItem('deletedProcesses');
        let deletedIds = [];
        if (deletedProcesses) {
          try {
            deletedIds = JSON.parse(deletedProcesses);
          } catch (error) {
            console.error('Error parsing deleted processes:', error);
          }
        }
        
        // Filtrar procesos eliminados
        const filteredProcesses = parsed.filter(
          process => !deletedIds.includes(process.id)
        );
        
        console.log('✅ Procesos cargados desde localStorage (filtrados):', filteredProcesses);
        setProcesses(filteredProcesses);
      } catch (error) {
        console.error('❌ Error al cargar procesos:', error);
        setProcesses([]);
      }
    } else {
      console.log('⚠️ No hay procesos en localStorage');
      setProcesses([]);
    }
    
    // Cargar instrucciones desde localStorage
    const savedInstructions = localStorage.getItem('releaseInstructions');
    if (savedInstructions) {
      try {
        const parsed = JSON.parse(savedInstructions);
        console.log('📋 Instrucciones cargadas desde localStorage:', parsed);
        setReleaseInstructions(parsed);
      } catch (error) {
        console.error('❌ Error al cargar instrucciones:', error);
        setReleaseInstructions([]);
      }
    } else {
      console.log('⚠️ No hay instrucciones en localStorage');
      setReleaseInstructions([]);
    }
  };

  const filterProducts = () => {
    let filtered = [...(products || [])];
    
    // Aplicar búsqueda por texto
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.part_number?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.revision?.toLowerCase().includes(searchLower) ||
        product.customer_name?.toLowerCase().includes(searchLower) ||
        product.process_type?.toLowerCase().includes(searchLower)
      );
    }
    
    // Aplicar filtro de cliente
    if (customerFilter) {
      filtered = filtered.filter(product => product.customer_id === customerFilter);
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      
      // Manejar valores null o undefined
      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';
      
      // Convertir a string para comparación
      valueA = String(valueA).toLowerCase();
      valueB = String(valueB).toLowerCase();
      
      if (sortOrder === 'asc') {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
      }
    });
    
    setFilteredProducts(filtered);
    // Resetear a página 1 cuando cambian los filtros
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Si ya estamos ordenando por este campo, cambiar la dirección
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Si es un campo nuevo, ordenar ascendente por defecto
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getProcessIcon = (processType) => {
    switch (processType) {
      case 'zinc_plating':
        return <Package className="w-4 h-4 text-gray-600" />;
      case 'anodizing':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'chromating':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'passivation':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProcessName = (processType) => {
    switch (processType) {
      case 'zinc_plating':
        return 'Zinc Plating';
      case 'anodizing':
        return 'Anodizado';
      case 'chromating':
        return 'Cromatizado';
      case 'passivation':
        return 'Pasivado';
      default:
        return processType;
    }
  };

  const formatParameterValue = (param) => {
    if (param.type === 'exact') {
      const value = typeof param.value === 'object' ? JSON.stringify(param.value) : (param.value || '');
      const unit = param.unit && typeof param.unit === 'string' ? ` ${param.unit}` : '';
      return `${value}${unit}`;
    }
    if (param.type === 'range') {
      const min = typeof param.min === 'object' ? JSON.stringify(param.min) : (param.min || '');
      const max = typeof param.max === 'object' ? JSON.stringify(param.max) : (param.max || '');
      const unit = param.unit && typeof param.unit === 'string' ? ` ${param.unit}` : '';
      return `${min}-${max}${unit}`;
    }
    if (param.type === 'min') {
      const value = typeof param.value === 'object' ? JSON.stringify(param.value) : (param.value || '');
      const unit = param.unit && typeof param.unit === 'string' ? ` ${param.unit}` : '';
      return `≥ ${value}${unit}`;
    }
    if (param.type === 'max') {
      const value = typeof param.value === 'object' ? JSON.stringify(param.value) : (param.value || '');
      const unit = param.unit && typeof param.unit === 'string' ? ` ${param.unit}` : '';
      return `≤ ${value}${unit}`;
    }
    return '';
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleProductCodeClick = (product) => {
    console.log('🔍 Producto seleccionado:', {
      id: product.id,
      part_number: product.part_number,
      preview_image: product.preview_image ? 'Presente (' + product.preview_image.length + ' chars)' : 'No existe',
      part_image: product.part_image ? 'Presente (' + product.part_image.length + ' chars)' : 'No existe',
      keys: Object.keys(product)
    });
    setSelectedProductForPanel(product);
    setShowProductPanel(true);
  };

  const handleFileClick = (file, fileName) => {
    if (file && fileName) {
      setSelectedFile({
        name: fileName,
        url: file,
        type: fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
      });
      setShowFileViewer(true);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const result = await productsService.uploadProductImage(file);
      setProductFormData(prev => ({
        ...prev,
        preview_image: result.url,
        preview_image_name: file.name
      }));
      return result;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handlePdfUpload = async (file) => {
    try {
      const result = await productsService.uploadDrawingPdf(file);
      setProductFormData(prev => ({
        ...prev,
        drawing_pdf: result.url,
        drawing_pdf_name: file.name
      }));
      return result;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  };

  // Funciones para manejar inspecciones de calidad
  const handleInspectionSelection = (inspectionId) => {
    console.log('🔍 handleInspectionSelection llamado con inspectionId:', inspectionId);
    
    const inspection = inspectionCatalog.find(i => i.id === inspectionId);
    console.log('✅ Inspección encontrada:', inspection);
    
    if (inspection) {
      // Crear nueva instancia con ID único (para permitir múltiples veces la misma inspección)
      const newInspection = {
        inspection_id: `${inspection.id}-${Date.now()}`, // ID único para cada instancia
        inspection_name: inspection.name, // ✅ Precargado del catálogo
        inspection_type: inspection.type, // ✅ Precargado del catálogo
        // Campos vacíos para que el usuario los complete
        tolerance_min: '',
        tolerance_max: '',
        unit: '',
        acceptance_criteria: '',
        observations: '',
        // Configuración específica para este producto
        inspection_method: '100%', // Por defecto 100%
        sampling_quantity: '', // Vacío hasta que seleccionen muestreo
        aql_percentage: '', // Vacío hasta que seleccionen AQL
        is_required: true,
        sequence_order: (productFormData.quality_inspections?.length || 0) + 1,
        catalog_id: inspection.id // Guardar referencia al catálogo original
      };
      
      console.log('➕ Nueva instancia de inspección agregada:', newInspection);
      
      setProductFormData(prev => ({
        ...prev,
        quality_inspections: [...(prev.quality_inspections || []), newInspection]
      }));
      
      console.log('✅ Inspección agregada exitosamente');
    } else {
      console.log('❌ No se encontró la inspección en el catálogo');
    }
  };

  const handleInspectionRemove = (inspectionId) => {
    setProductFormData(prev => ({
      ...prev,
      quality_inspections: (prev.quality_inspections || []).filter(i => i.inspection_id !== inspectionId)
    }));
  };

  const handleInspectionConfigChange = (inspectionId, field, value) => {
    console.log('🔧 handleInspectionConfigChange:', { inspectionId, field, value });
    
    setProductFormData(prev => {
      const updated = {
        ...prev,
        quality_inspections: (prev.quality_inspections || []).map(inspection => 
          inspection.inspection_id === inspectionId 
            ? { ...inspection, [field]: value }
            : inspection
        )
      };
      
      console.log('📊 Inspecciones actualizadas:', updated.quality_inspections);
      return updated;
    });
  };

  // Funciones para el formulario extendido
  const handleProductInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProcessChange = (processId) => {
    const selectedProcess = processes.find(p => p.id === processId);
    if (selectedProcess) {
      setProductFormData(prev => ({
        ...prev,
        process_id: processId,
        process_name: selectedProcess.name,
        // Aquí se arrastran automáticamente las liberaciones del proceso
        process_release_parameters: (selectedProcess.subprocesses || [])
          .sort((a, b) => (a.sequence_order || 1) - (b.sequence_order || 1))
          .map(sub => ({
            subprocess_name: sub.name,
            sequence: sub.sequence_order || 1,
            parameters: sub.release_parameters || []
          }))
      }));
    }
  };

  const handleCustomerChange = (customerId) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer) {
      setProductFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: selectedCustomer.name
      }));
    }
  };

  const handleQualityTestChange = (testId, field, value) => {
    setProductFormData(prev => {
      const updatedTests = (prev.quality_tests || []).map(test => {
        if (test.test_id === testId) {
          return { ...test, [field]: value };
        }
        return test;
      });
      
      // Si no existe el test, agregarlo
      if (!updatedTests.find(test => test.test_id === testId)) {
        const testTemplate = qualityTests.find(qt => qt.id === testId);
        if (testTemplate) {
          updatedTests.push({
            test_id: testTemplate.test_id,
            name: testTemplate.name,
            description: testTemplate.description,
            sampling_type: 'aql', // aql, sample, full
            aql_value: 0.65,
            sample_quantity: 1,
            specifications: '',
            [field]: value
          });
        }
      }
      
      return { ...prev, quality_tests: updatedTests };
    });
  };

  const handleQualityTestSamplingChange = (testId, samplingType) => {
    setProductFormData(prev => {
      const updatedTests = (prev.quality_tests || []).map(test => {
        if (test.test_id === testId) {
          return { 
            ...test, 
            sampling_type: samplingType,
            // Resetear valores según el tipo de muestreo
            aql_value: samplingType === 'aql' ? 0.65 : null,
            sample_quantity: samplingType === 'sample' ? 1 : null
          };
        }
        return test;
      });
      
      return { ...prev, quality_tests: updatedTests };
    });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('📤 Enviando datos:', isEditing ? 'ACTUALIZAR' : 'CREAR', {
        isEditing,
        editProductId,
        productFormData
      });
      
      if (isEditing && editProductId) {
        // Actualizar producto existente
        const result = await productsService.updateProduct(editProductId, productFormData);
        console.log('✅ Producto actualizado:', result);
      } else {
        // Crear nuevo producto
        const result = await productsService.createProduct(productFormData);
        console.log('✅ Producto creado:', result);
      }
      
      // Resetear formulario y estados de edición
      setProductFormData({
        part_number: '',
        revision: '',
        description: '',
        notes: '',
        customer_id: '',
        customer_name: '',
        process_id: '',
        process_name: '',
        is_active: true,
        preview_image: '',
        preview_image_name: '',
        drawing_pdf: '',
        drawing_pdf_name: '',
        quality_tests: [],
        quality_inspections: [],
        release_instructions_id: '',
        release_instructions_name: ''
      });
      setIsEditing(false);
      setEditProductId(null);
      setShowProductForm(false);
      
      // Recargar productos
      fetchData();
    } catch (error) {
      console.error('❌ Error completo:', error);
      console.error('❌ Mensaje:', error.message);
      console.error('❌ Stack:', error.stack);
      alert((isEditing ? 'Error al actualizar' : 'Error al crear') + ': ' + error.message);
    }
  };

  const handleEditProduct = (product) => {
    // Cargar datos del producto en el formulario
    setProductFormData({
      part_number: product.part_number || '',
      revision: product.revision || '',
      description: product.description || '',
      notes: product.notes || '',
      customer_id: product.customer_id || '',
      customer_name: product.customer_name || '',
      process_id: product.process_id || '',
      process_name: product.process_name || '',
      is_active: product.is_active !== undefined ? product.is_active : true,
      preview_image: product.preview_image || '',
      preview_image_name: product.preview_image_name || '',
      drawing_pdf: product.drawing_pdf || '',
      drawing_pdf_name: product.drawing_pdf_name || '',
      quality_tests: product.quality_tests || [],
      quality_inspections: product.quality_inspections || [],
      release_instructions_id: product.release_instructions_id || '',
      release_instructions_name: product.release_instructions_name || ''
    });
    setIsEditing(true);
    setEditProductId(product.id);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
      try {
        await productsService.deleteProduct(productId);
        
        // Guardar ID del producto eliminado en localStorage
        const deletedProducts = localStorage.getItem('deletedProducts');
        let deletedIds = [];
        if (deletedProducts) {
          try {
            deletedIds = JSON.parse(deletedProducts);
          } catch (error) {
            console.error('Error parsing deleted products:', error);
          }
        }
        
        // Agregar el nuevo ID si no está ya
        if (!deletedIds.includes(productId)) {
          deletedIds.push(productId);
          localStorage.setItem('deletedProducts', JSON.stringify(deletedIds));
          console.log('🗑️ Producto agregado a eliminados:', productId);
        }
        
        // Recargar productos (filtrará automáticamente)
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error al eliminar el producto. Por favor, intenta de nuevo.');
      }
    }
  };

  const renderKPIs = () => {
    if (!kpis) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Productos</p>
              <p className="text-2xl font-bold text-primary-600">{kpis.total_products}</p>
            </div>
            <Package className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Productos Activos</p>
              <p className="text-2xl font-bold text-success-600">{kpis.active_products}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Con Imágenes</p>
              <p className="text-2xl font-bold text-blue-600">{kpis.products_with_images}</p>
            </div>
            <Image className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Con Dibujos</p>
              <p className="text-2xl font-bold text-purple-600">{kpis.products_with_drawings}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>
    );
  };

  // Pantalla de acceso denegado
  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center max-w-md">
          <Settings className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600 mb-4">
            Esta sección solo está disponible para personal autorizado.
          </p>
          <p className="text-sm text-gray-500">
            Tu rol actual: <span className="font-medium">{currentUser.role}</span>
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Productos</h1>
          <p className="text-secondary-600">Gestión de productos y especificaciones técnicas - Acceso: {currentUser.role}</p>
        </div>
        <div className="flex space-x-3">
          {canEdit() && (
            <Button
              onClick={() => setShowProductForm(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Producto
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      {renderKPIs()}

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por número de parte o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos los clientes</option>
                {customers?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('part_number')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Número de Parte</span>
                    {sortField === 'part_number' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="table-header-cell">Revisión</th>
                <th className="table-header-cell">Descripción</th>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('customer_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Cliente</span>
                    {sortField === 'customer_name' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="table-header-cell cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('process_type')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Proceso</span>
                    {sortField === 'process_type' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="table-header-cell">Inspecciones Calidad</th>
                <th className="table-header-cell">Archivos</th>
                <th className="table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts
                ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((product) => (
                <tr key={product.id} className="table-row">
                  <td className="table-cell font-medium">
                    <button
                      onClick={() => handleProductCodeClick(product)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      title="Ver información completa del producto"
                    >
                      {product.part_number}
                    </button>
                  </td>
                  <td className="table-cell">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Rev {product.revision}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="max-w-xs truncate" title={product.description}>
                      {product.description}
                    </div>
                  </td>
                  <td className="table-cell">{product.customer_name}</td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      {getProcessIcon(product.process_type)}
                      <span className="ml-2">{getProcessName(product.process_type)}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {product.quality_inspections && product.quality_inspections.slice(0, 2).map((inspection, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {inspection.inspection_name}
                        </span>
                      ))}
                      {product.quality_inspections && product.quality_inspections.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          +{product.quality_inspections.length - 2}
                        </span>
                      )}
                      {(!product.quality_inspections || product.quality_inspections.length === 0) && (
                        <span className="text-xs text-gray-500">Sin inspecciones</span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {product.preview_image && (
                        <button 
                          onClick={() => handleFileClick(product.preview_image, `imagen_${product.part_number}.jpg`)}
                          className="text-blue-600 hover:text-blue-800" 
                          title="Ver imagen"
                        >
                          {product.preview_image_name && product.preview_image_name.toLowerCase().endsWith('.jpg') || product.preview_image_name.toLowerCase().endsWith('.png') ? (
                            <img 
                              src={product.preview_image} 
                              alt="Preview" 
                              className="w-8 h-8 object-cover rounded border border-gray-300"
                            />
                          ) : (
                            <Image className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      {product.drawing_pdf && (
                        <button 
                          onClick={() => handleFileClick(product.drawing_pdf, `dibujo_${product.part_number}.pdf`)}
                          className="text-purple-600 hover:text-purple-800" 
                          title="Ver dibujo"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="text-primary-600 hover:text-primary-800"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit() && (
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-secondary-600 hover:text-secondary-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete() && (
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-danger-600 hover:text-danger-800"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Controles de Paginación */}
          {filteredProducts.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
              {/* Selector de items por página */}
              <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                <span className="text-sm text-gray-600">Mostrar:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
                <span className="text-sm text-gray-600">por página</span>
              </div>
              
              {/* Info de resultados */}
              <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts?.length || 0)} de {filteredProducts?.length || 0} productos
              </div>
              
              {/* Controles de navegación */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                
                {/* Números de página */}
                <div className="flex space-x-1">
                  {filteredProducts && Array.from({ length: Math.min(5, Math.ceil((filteredProducts?.length || 0) / itemsPerPage)) }, (_, i) => {
                    const totalPages = Math.ceil((filteredProducts?.length || 0) / itemsPerPage);
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded text-sm ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentPage(Math.ceil(filteredProducts.length / itemsPerPage))}
                  disabled={currentPage === Math.ceil(filteredProducts.length / itemsPerPage)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  »
                </button>
              </div>
            </div>
          )}
          
          {products.length === 0 && (
            <div className="text-center py-8 text-secondary-500">
              No se encontraron productos
            </div>
          )}
        </div>
      </Card>

      {/* Product Form Modal */}
      <Modal
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setIsEditing(false);
          setEditProductId(null);
        }}
        title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
        size="full"
      >
        <form onSubmit={handleProductSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Información Básica */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Parte *
                  </label>
                  <input
                    type="text"
                    name="part_number"
                    value={productFormData.part_number}
                    onChange={handleProductInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: ZP-001-001"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revisión *
                  </label>
                  <input
                    type="text"
                    name="revision"
                    value={productFormData.revision}
                    onChange={handleProductInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: A"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    name="customer_id"
                    value={productFormData.customer_id}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {customers?.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proceso Padre *
                  </label>
                  <select
                    name="process_id"
                    value={productFormData.process_id}
                    onChange={(e) => handleProcessChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar proceso</option>
                    {console.log('🔍 Procesos disponibles en dropdown:', processes) || processes?.map((process) => (
                      <option key={process.id} value={process.id}>
                        {process.code} - {process.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (Nombre del Producto) *
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={productFormData.description}
                    onChange={handleProductInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Housing, Bracket, etc."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas/Comentarios para Inspección
                  </label>
                  <textarea
                    name="notes"
                    value={productFormData.notes}
                    onChange={handleProductInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Notas especiales para inspección..."
                  />
                </div>
              </div>
            </div>

            {/* Sección de Calidad */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Configuración de Calidad
              </h3>

              {/* Instrucciones de Liberación */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instrucciones de Liberación
                </label>
                <select
                  value={productFormData.release_instructions_id}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    const selected = releaseInstructions.find(ri => String(ri.id) === selectedValue);
                    setProductFormData(prev => ({
                      ...prev,
                      release_instructions_id: selectedValue,
                      release_instructions_name: selected ? selected.name : ''
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar instrucciones de liberación...</option>
                  {releaseInstructions?.length === 0 && <option disabled>No hay instrucciones cargadas</option>}
                  {releaseInstructions?.map(releaseInstruction => (
                    <option key={releaseInstruction.id} value={String(releaseInstruction.id)}>
                      {releaseInstruction.code} - {releaseInstruction.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Inspecciones del Catálogo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agregar Inspecciones del Catálogo
                </label>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleInspectionSelection(e.target.value); // Quitamos parseInt
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar inspección del catálogo...</option>
                    {inspectionCatalog?.map(inspection => (
                      <option key={inspection.id} value={inspection.id}>
                        {inspection.name} ({inspection.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de Inspecciones Asignadas */}
              {(() => {
                console.log('🔍 Verificando si mostrar tabla:', productFormData.quality_inspections?.length);
                return productFormData.quality_inspections?.length > 0;
              })() ? (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Inspecciones Asignadas</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Inspección</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tolerancias</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Inspección</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">AQL</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requerida</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {productFormData.quality_inspections?.map((inspection) => (
                          <tr key={inspection.inspection_id}>
                            <td className="px-4 py-2">
                              <div>
                                <div className="font-medium text-gray-900">{inspection.inspection_name}</div>
                                <div className="text-xs text-gray-500">{inspection.acceptance_criteria}</div>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {inspection.inspection_type}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={inspection.tolerance_min || ''}
                                  onChange={(e) => handleInspectionConfigChange(inspection.inspection_id, 'tolerance_min', e.target.value)}
                                  placeholder="Min"
                                  className="text-sm w-16 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                  type="text"
                                  value={inspection.tolerance_max || ''}
                                  onChange={(e) => handleInspectionConfigChange(inspection.inspection_id, 'tolerance_max', e.target.value)}
                                  placeholder="Max"
                                  className="text-sm w-16 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                                <input
                                  type="text"
                                  value={inspection.unit || ''}
                                  onChange={(e) => handleInspectionConfigChange(inspection.inspection_id, 'unit', e.target.value)}
                                  placeholder="Unidad"
                                  className="text-sm w-16 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={inspection.inspection_method || '100%'}
                                onChange={(e) => handleInspectionConfigChange(inspection.inspection_id, 'inspection_method', e.target.value)}
                                className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="100%">100%</option>
                                <option value="muestreo">Muestreo</option>
                                <option value="aql">AQL</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              {inspection.inspection_method === 'muestreo' ? (
                                <input
                                  type="number"
                                  value={inspection.sampling_quantity || ''}
                                  onChange={(e) => handleInspectionConfigChange(inspection.inspection_id, 'sampling_quantity', e.target.value)}
                                  placeholder="Cantidad"
                                  className="text-sm w-20 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                />
                              ) : inspection.inspection_method === 'aql' ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={inspection.aql_percentage || ''}
                                    onChange={(e) => handleInspectionConfigChange(inspection.inspection_id, 'aql_percentage', e.target.value)}
                                    placeholder="%"
                                    className="text-sm w-16 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-500">%</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">100%</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {inspection.inspection_method === 'aql' ? (
                                <span className="text-sm text-gray-900">Nivel 1</span>
                              ) : (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="checkbox"
                                checked={inspection.is_required}
                                onChange={(e) => handleInspectionConfigChange(inspection.inspection_id, 'is_required', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() => handleInspectionRemove(inspection.inspection_id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay inspecciones asignadas. Selecciona inspecciones del catálogo para comenzar.</p>
                </div>
              )}
            </div>

            {/* Archivos del Producto */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Archivos del Producto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen Preview
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {productFormData.preview_image ? (
                      <div className="space-y-2">
                        <img 
                          src={productFormData.preview_image} 
                          alt="Preview" 
                          className="w-32 h-32 object-cover mx-auto rounded border border-gray-300"
                        />
                        <p className="text-sm text-gray-600">{productFormData.preview_image_name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            };
                            input.click();
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Cambiar imagen
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Image className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">Arrastra o haz clic para subir imagen</p>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            };
                            input.click();
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                        >
                          Seleccionar Imagen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dibujo Técnico (PDF)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {productFormData.drawing_pdf ? (
                      <div className="space-y-2">
                        <FileText className="w-12 h-12 text-purple-500 mx-auto" />
                        <p className="text-sm text-gray-600">{productFormData.drawing_pdf_name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf';
                            input.onchange = (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handlePdfUpload(file);
                              }
                            };
                            input.click();
                          }}
                          className="text-purple-600 hover:text-purple-800 text-sm"
                        >
                          Cambiar PDF
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">Arrastra o haz clic para subir PDF</p>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf';
                            input.onchange = (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                handlePdfUpload(file);
                              }
                            };
                            input.click();
                          }}
                          className="bg-purple-500 text-white px-4 py-2 rounded text-sm hover:bg-purple-600"
                        >
                          Seleccionar PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Parámetros de Liberación */}
            {productFormData.process_release_parameters && productFormData.process_release_parameters.length > 0 && (
              <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Parámetros de Liberación (Arrastrados del Proceso)</h3>
                <div className="space-y-4">
                  {productFormData.process_release_parameters?.map((subprocess, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {subprocess.sequence}. {subprocess.subprocess_name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subprocess.parameters?.map((param, paramIndex) => (
                          <div key={paramIndex} className="bg-gray-50 p-3 rounded">
                            <div className="text-sm font-medium text-gray-700">{param.name}</div>
                            <div className="text-sm text-gray-900">
                              {formatParameterValue(param)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={() => setShowProductForm(false)}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-primary"
            >
              Crear Producto
            </Button>
          </div>
        </form>
      </Modal>

      {/* Product Information Panel */}
      <Modal
        isOpen={showProductPanel}
        onClose={() => setShowProductPanel(false)}
        title="Información Completa del Producto"
        size="full"
      >
        {selectedProductForPanel && (
          <div className="space-y-6">
            {/* Header con imagen preview */}
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0">
                {(selectedProductForPanel.preview_image || selectedProductForPanel.part_image) ? (
                  (() => {
                    // Soportar tanto preview_image como part_image
                    const imageSrc = selectedProductForPanel.preview_image || selectedProductForPanel.part_image;
                    const fieldName = selectedProductForPanel.preview_image ? 'preview_image' : 'part_image';
                    console.log(`🔍 Usando ${fieldName}:`, imageSrc?.substring(0, 50) + '...');
                    
                    // Determinar el tipo de imagen y construir la URL correcta
                    let finalSrc = imageSrc;
                    
                    if (imageSrc.startsWith('data:image')) {
                      finalSrc = imageSrc;
                      console.log('✅ Data URL completa detectada');
                    } else if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
                      finalSrc = imageSrc;
                      console.log('✅ URL HTTP detectada');
                    } else if (imageSrc.startsWith('/')) {
                      // Ruta relativa desde la raíz
                      finalSrc = imageSrc;
                      console.log('✅ Ruta relativa detectada');
                    } else if (imageSrc.match(/^[A-Za-z0-9+/=]+$/)) {
                      finalSrc = `data:image/jpeg;base64,${imageSrc}`;
                      console.log('✅ Base64 detectado, agregando prefijo');
                    } else {
                      finalSrc = `data:image/jpeg;base64,${imageSrc}`;
                      console.log('⚠️ Formato desconocido, intentando base64');
                    }
                    
                    return (
                      <img 
                        src={finalSrc}
                        alt="Product Preview" 
                        className="w-48 h-48 object-cover rounded-lg border border-gray-300 shadow-lg bg-white"
                        onError={(e) => {
                          console.error('❌ Error cargando imagen, mostrando placeholder');
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="w-48 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-400 flex flex-col items-center justify-center p-4">
                              <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <span class="text-xs text-gray-500 text-center">Imagen no disponible</span>
                            </div>
                          `;
                        }}
                      />
                    );
                  })()
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-400 flex flex-col items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Número de Parte</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedProductForPanel.part_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Revisión</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedProductForPanel.revision}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Cliente</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedProductForPanel.customer_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Proceso</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedProductForPanel.process_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Información detallada */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Producto</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Descripción</label>
                    <p className="text-gray-900">{selectedProductForPanel.description}</p>
                  </div>
                  {selectedProductForPanel.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Notas/Comentarios</label>
                      <p className="text-gray-900 bg-yellow-50 p-3 rounded border border-yellow-200">
                        {selectedProductForPanel.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Archivos y Documentación</h3>
                <div className="space-y-3">
                  {selectedProductForPanel.preview_image && (
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <Image className="w-8 h-8 text-blue-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Imagen Preview</p>
                        <p className="text-sm text-gray-500">{selectedProductForPanel.preview_image_name}</p>
                      </div>
                      <button
                        onClick={() => {
                          const imageSrc = selectedProductForPanel.preview_image || selectedProductForPanel.part_image;
                          handleFileClick(imageSrc, selectedProductForPanel.preview_image_name || 'imagen.jpg');
                        }}
                        className="text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                      >
                        Ver
                      </button>
                    </div>
                  )}
                  {selectedProductForPanel.drawing_pdf && (
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <FileText className="w-8 h-8 text-purple-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Dibujo Técnico</p>
                        <p className="text-sm text-gray-500">{selectedProductForPanel.drawing_pdf_name}</p>
                      </div>
                      <button
                        onClick={() => {
                          handleFileClick(
                            selectedProductForPanel.drawing_pdf, 
                            selectedProductForPanel.drawing_pdf_name || 'dibujo.pdf'
                          );
                        }}
                        className="text-purple-600 hover:text-purple-800 px-3 py-1 border border-purple-300 rounded hover:bg-purple-50"
                      >
                        Ver
                      </button>
                    </div>
                  )}
                  {selectedProductForPanel.release_instructions_id && (
                    <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <FileText className="w-8 h-8 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Instrucción de Liberación</p>
                        <p className="text-sm text-gray-500">{selectedProductForPanel.release_instructions_name}</p>
                      </div>
                      <button
                        onClick={() => {
                          const instruction = releaseInstructions.find(
                            ri => String(ri.id) === String(selectedProductForPanel.release_instructions_id)
                          );
                          if (instruction && instruction.document_url) {
                            setSelectedInstructionDoc({
                              url: instruction.document_url,
                              name: instruction.document_name || 'Documento',
                              code: instruction.code,
                              instructionName: instruction.name
                            });
                          } else {
                            alert('No hay documento disponible para esta instrucción');
                          }
                        }}
                        className="text-green-600 hover:text-green-800 px-3 py-1 border border-green-300 rounded hover:bg-green-50"
                      >
                        Ver
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inspecciones de Calidad Configuradas */}
            {(selectedProductForPanel.quality_inspections?.length > 0 || selectedProductForPanel.quality_tests?.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Inspecciones de Calidad Configuradas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Mostrar quality_inspections (nuevo formato) */}
                  {selectedProductForPanel.quality_inspections?.map((inspection, index) => (
                    <div key={`inspection-${index}`} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{inspection.inspection_name}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Método:</span>
                          <span className={`font-medium px-2 py-1 rounded text-xs ${
                            inspection.inspection_method === 'aql' ? 'bg-blue-100 text-blue-800' :
                            inspection.inspection_method === 'muestreo' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {inspection.inspection_method === 'aql' && `AQL ${inspection.aql_percentage}%`}
                            {inspection.inspection_method === 'muestreo' && `${inspection.sampling_quantity} muestras`}
                            {inspection.inspection_method === '100%' && '100%'}
                          </span>
                        </div>
                        {inspection.acceptance_criteria && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Criterio:</span>
                            <span className="font-medium">{inspection.acceptance_criteria}</span>
                          </div>
                        )}
                        {(inspection.tolerance_min !== null || inspection.tolerance_max !== null) && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tolerancia:</span>
                            <span className="font-medium">
                              {inspection.tolerance_min || ''}-{inspection.tolerance_max || ''} {inspection.unit || ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Mostrar quality_tests (formato antiguo para compatibilidad) */}
                  {selectedProductForPanel.quality_tests?.map((test, index) => (
                    <div key={`test-${index}`} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{test.name}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Muestreo:</span>
                          <span className={`font-medium px-2 py-1 rounded text-xs ${
                            test.sampling_type === 'aql' ? 'bg-blue-100 text-blue-800' :
                            test.sampling_type === 'sample' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {test.sampling_type === 'aql' && `AQL ${test.aql_value}%`}
                            {test.sampling_type === 'sample' && `${test.sample_quantity} muestras`}
                            {test.sampling_type === 'full' && '100%'}
                          </span>
                        </div>
                        {test.specifications && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Especificaciones:</span>
                            <span className="font-medium">
                              {typeof test.specifications === 'object' 
                                ? `${test.specifications.min || ''}-${test.specifications.max || ''} ${test.specifications.unit || ''}`
                                : test.specifications
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inspecciones a Realizar */}
            {(selectedProductForPanel.quality_inspections?.length > 0 || selectedProductForPanel.quality_tests?.length > 0) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Inspecciones de Calidad a Realizar</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2">
                    {/* Mostrar quality_inspections (nuevo formato) */}
                    {selectedProductForPanel.quality_inspections?.map((inspection, index) => (
                      <div key={`inspection-${index}`} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">{inspection.inspection_name}</span>
                        <span className="text-sm text-gray-600">
                          ({inspection.inspection_method === 'aql' ? `AQL ${inspection.aql_percentage}%` : 
                            inspection.inspection_method === 'muestreo' ? `${inspection.sampling_quantity} muestras` : 
                            '100%'})
                        </span>
                        {(inspection.tolerance_min !== null || inspection.tolerance_max !== null) && (
                          <span className="text-sm text-gray-500">
                            - {inspection.tolerance_min || ''}-{inspection.tolerance_max || ''} {inspection.unit || ''}
                          </span>
                        )}
                      </div>
                    ))}
                    
                    {/* Mostrar quality_tests (formato antiguo para compatibilidad) */}
                    {selectedProductForPanel.quality_tests?.map((test, index) => (
                      <div key={`test-${index}`} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">{test.name}</span>
                        <span className="text-sm text-gray-600">
                          ({test.sampling_type === 'aql' ? `AQL ${test.aql_value}%` : 
                            test.sampling_type === 'sample' ? `${test.sample_quantity} muestras` : 
                            '100%'})
                        </span>
                        {test.specifications && (
                          <span className="text-sm text-gray-500">
                            - {typeof test.specifications === 'object' 
                              ? `${test.specifications.min || ''}-${test.specifications.max || ''} ${test.specifications.unit || ''}`
                              : test.specifications
                            }
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Total de inspecciones:</strong> {(selectedProductForPanel.quality_inspections?.length || 0) + (selectedProductForPanel.quality_tests?.length || 0)} pruebas
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Parámetros de Liberación */}
            {selectedProductForPanel.process_release_parameters && selectedProductForPanel.process_release_parameters.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Parámetros de Liberación del Proceso</h3>
                <div className="space-y-4">
                  {selectedProductForPanel.process_release_parameters?.map((subprocess, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        {subprocess.sequence}. {subprocess.subprocess_name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subprocess.parameters?.map((param, paramIndex) => (
                          <div key={paramIndex} className="bg-gray-50 p-3 rounded">
                            <div className="text-sm font-medium text-gray-700">{param.name}</div>
                            <div className="text-sm text-gray-900">
                              {formatParameterValue(param)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowProductPanel(false)}
                className="btn-secondary"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* File Viewer Modal */}
      <Modal
        isOpen={showFileViewer}
        onClose={() => setShowFileViewer(false)}
        title={selectedFile?.name || 'Archivo'}
        size="large"
      >
        {selectedFile && (
          <div className="space-y-4">
            {selectedFile.type === 'pdf' ? (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <iframe
                  src={selectedFile.url}
                  title={selectedFile.name}
                  className="w-full h-full rounded-lg"
                  style={{ border: 'none' }}
                />
              </div>
            ) : (
              <div className="flex justify-center">
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  className="max-w-full max-h-96 object-contain rounded-lg border border-gray-300"
                />
              </div>
            )}
            <div className="flex justify-center space-x-3">
              <a
                href={selectedFile.url}
                download={selectedFile.name}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </a>
              <Button
                onClick={() => setShowFileViewer(false)}
                className="btn-secondary"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Instruction Document Viewer Modal */}
      <Modal
        isOpen={!!selectedInstructionDoc}
        onClose={() => setSelectedInstructionDoc(null)}
        title={selectedInstructionDoc ? `${selectedInstructionDoc.code} - ${selectedInstructionDoc.instructionName}` : 'Documento'}
        size="large"
      >
        {selectedInstructionDoc && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{selectedInstructionDoc.name}</span>
              <a
                href={selectedInstructionDoc.url}
                download={selectedInstructionDoc.name}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-1" />
                Descargar
              </a>
            </div>
            <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
              {selectedInstructionDoc.url.includes('application/pdf') ? (
                <iframe
                  src={selectedInstructionDoc.url}
                  title={selectedInstructionDoc.name}
                  className="w-full h-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Este tipo de archivo no se puede previsualizar</p>
                  <a
                    href={selectedInstructionDoc.url}
                    download={selectedInstructionDoc.name}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Documento
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Products;

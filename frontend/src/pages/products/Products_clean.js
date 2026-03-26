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
  ArrowRight,
  GitBranch,
  Workflow,
  Layers,
  Settings
} from 'lucide-react';
import productsService from '../../services/productsService';
import inventoryService from '../../services/inventoryService';
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
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [qualityTests, setQualityTests] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [processFilter, setProcessFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPdfUpload, setShowPdfUpload] = useState(false);
  const [showProductPanel, setShowProductPanel] = useState(false);
  const [selectedProductForPanel, setSelectedProductForPanel] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  
  // Estados para el formulario extendido de productos
  const [processes, setProcesses] = useState([]);
  const [releaseInstructions, setReleaseInstructions] = useState([]);
  const [productFormData, setProductFormData] = useState({
    part_number: '',
    revision: '',
    description: '',
    customer_id: '',
    customer_name: '',
    process_id: '',
    process_name: '',
    is_active: true,
    preview_image: '',
    preview_image_name: '',
    drawing_pdf: '',
    drawing_pdf_name: '',
    aql: 0.65,
    quality_tests: [],
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
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, customerFilter, processFilter]);

  const fetchData = async () => {
    try {
      const [productsData, customersData, qualityTestsData, kpisData] = await Promise.all([
        productsService.getProducts(),
        inventoryService.getCustomers(),
        productsService.getQualityTestTemplates(),
        productsService.getProductsKPIs()
      ]);
      
      setProducts(productsData);
      setCustomers(customersData);
      setQualityTests(qualityTestsData);
      setKpis(kpisData);
      
      // Cargar procesos y instrucciones de liberación (datos demo)
      loadProcessesAndInstructions();
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products data:', error);
      setLoading(false);
    }
  };

  const loadProcessesAndInstructions = () => {
    // Procesos de demo
    const demoProcesses = [
      { id: 'proc-1', code: 'PROC-001', name: 'Zinc Plating', subprocesses: [
        { sequence: 1, name: 'Desengrase', release_parameters: [
          { name: 'Temperatura', value: 60, unit: '°C', type: 'exact' },
          { name: 'Tiempo', value: 5, unit: 'min', type: 'exact' }
        ]},
        { sequence: 2, name: 'Decapado', release_parameters: [
          { name: 'Ácido', value: 'HCl', unit: '%', type: 'range', min: 10, max: 15 },
          { name: 'Tiempo', value: 3, unit: 'min', type: 'exact' }
        ]},
        { sequence: 3, name: 'Zinc Plating', release_parameters: [
          { name: 'Corriente', value: 150, unit: 'A/dm²', type: 'exact' },
          { name: 'Temperatura', value: 25, unit: '°C', type: 'range', min: 20, max: 30 }
        ]}
      ]},
      { id: 'proc-2', code: 'PROC-002', name: 'Anodizado', subprocesses: [
        { sequence: 1, name: 'Limpieza', release_parameters: [
          { name: 'Temperatura', value: 50, unit: '°C', type: 'exact' },
          { name: 'Tiempo', value: 10, unit: 'min', type: 'exact' }
        ]},
        { sequence: 2, name: 'Anodizado', release_parameters: [
          { name: 'Voltaje', value: 15, unit: 'V', type: 'exact' },
          { name: 'Tiempo', value: 30, unit: 'min', type: 'exact' }
        ]}
      ]},
      { id: 'proc-3', code: 'PROC-003', name: 'Cromatizado', subprocesses: [
        { sequence: 1, name: 'Preparación', release_parameters: [
          { name: 'pH', value: 7, unit: 'pH', type: 'range', min: 6.5, max: 7.5 }
        ]},
        { sequence: 2, name: 'Cromatizado', release_parameters: [
          { name: 'Concentración', value: 200, unit: 'ppm', type: 'exact' }
        ]}
      ]},
      { id: 'proc-4', code: 'PROC-004', name: 'Pasivado', subprocesses: [
        { sequence: 1, name: 'Activación', release_parameters: [
          { name: 'Temperatura', value: 45, unit: '°C', type: 'exact' }
        ]},
        { sequence: 2, name: 'Pasivado', release_parameters: [
          { name: 'Tiempo', value: 20, unit: 'min', type: 'exact' },
          { name: 'pH', value: 3.5, unit: 'pH', type: 'range', min: 3, max: 4 }
        ]}
      ]}
    ];

    // Instrucciones de liberación de demo
    const demoReleaseInstructions = [
      { id: 'inst-1', name: 'Instrucción Estándar Zinc Plating', description: 'Proceso estándar para liberación de zinc plating', created_at: new Date('2024-01-10') },
      { id: 'inst-2', name: 'Instrucción Anodizado Aeroespacial', description: 'Requisitos especiales para componentes aeroespaciales', created_at: new Date('2024-01-15') },
      { id: 'inst-3', name: 'Instrucción Cromatizado Decorativo', description: 'Especificaciones para acabados decorativos', created_at: new Date('2024-01-20') },
      { id: 'inst-4', name: 'Instrucción Pasivado Naval', description: 'Requisitos para componentes marinos', created_at: new Date('2024-01-25') }
    ];

    setProcesses(demoProcesses);
    setReleaseInstructions(demoReleaseInstructions);
  };

  const filterProducts = () => {
    // La lógica de filtrado se implementaría aquí
    // Por ahora, mostramos todos los datos
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

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleProductCodeClick = (product) => {
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
        process_release_parameters: selectedProcess.subprocesses.map(sub => ({
          subprocess_name: sub.name,
          sequence: sub.sequence,
          parameters: sub.release_parameters
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
      const updatedTests = prev.quality_tests.map(test => {
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
            [field]: value
          });
        }
      }
      
      return { ...prev, quality_tests: updatedTests };
    });
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

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await productsService.createProduct(productFormData);
      
      // Resetear formulario
      setProductFormData({
        part_number: '',
        revision: '',
        description: '',
        customer_id: '',
        customer_name: '',
        process_id: '',
        process_name: '',
        is_active: true,
        preview_image: '',
        preview_image_name: '',
        drawing_pdf: '',
        drawing_pdf_name: '',
        aql: 0.65,
        quality_tests: [],
        release_instructions_id: '',
        release_instructions_name: ''
      });
      
      setShowProductForm(false);
      
      // Recargar productos
      fetchData();
    } catch (error) {
      console.error('Error creating product:', error);
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
          <Button
            onClick={() => setShowImageUpload(true)}
            className="btn-secondary"
            disabled={!canEdit()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir Imagen
          </Button>
          <Button
            onClick={() => setShowPdfUpload(true)}
            className="btn-secondary"
            disabled={!canEdit()}
          >
            <FileText className="w-4 h-4 mr-2" />
            Subir PDF
          </Button>
          {canEdit() && (
            <Button
              onClick={() => setShowProductForm(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
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
                {customers.map((customer) => (
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
                <th className="table-header-cell">Número de Parte</th>
                <th className="table-header-cell">Revisión</th>
                <th className="table-header-cell">Descripción</th>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Proceso</th>
                <th className="table-header-cell">Pruebas Calidad</th>
                <th className="table-header-cell">Archivos</th>
                <th className="table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="table-row">
                  <td className="table-cell font-medium">
                    <button
                      onClick={() => handleProductCodeClick(product)}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      title="Ver panel del producto"
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
                      {product.quality_tests && product.quality_tests.slice(0, 2).map((test, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {test.test_id}
                        </span>
                      ))}
                      {product.quality_tests && product.quality_tests.length > 2 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{product.quality_tests.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {product.part_image && (
                        <button 
                          onClick={() => handleFileClick(product.part_image, `imagen_${product.part_number}.jpg`)}
                          className="text-blue-600 hover:text-blue-800" 
                          title="Ver imagen"
                        >
                          <Image className="w-4 h-4" />
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
                          className="text-secondary-600 hover:text-secondary-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete() && (
                        <button
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
          
          {products.length === 0 && (
            <div className="text-center py-8 text-secondary-500">
              No se encontraron productos
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Products;

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Plus, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  Upload,
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import qualityService from '../../services/qualityService';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';

const QualityControl = () => {
  const [inspections, setInspections] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [showInstructionForm, setShowInstructionForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [releaseInstructions, setReleaseInstructions] = useState([]);
  const [instructionSearchTerm, setInstructionSearchTerm] = useState('');
  const [instructionPage, setInstructionPage] = useState(1);
  const instructionsPerPage = 10;
  
  // Nuevo: Catálogo de inspecciones
  const [inspectionCatalog, setInspectionCatalog] = useState([]);
  const [inspectionFormData, setInspectionFormData] = useState({
    name: '',
    type: 'medicion' // medicion, visual, dimensional, etc.
  });
  
  // Estados para la tabla del catálogo
  const [inspectionSearchTerm, setInspectionSearchTerm] = useState('');
  const [inspectionPage, setInspectionPage] = useState(1);
  const [inspectionsPerPage, setInspectionsPerPage] = useState(10);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  
  const [instructionFormData, setInstructionFormData] = useState({
    code: '',
    name: '',
    description: '',
    document_url: '',
    document_name: '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [inspections, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      const [controlsData, instructionsData, kpisData] = await Promise.all([
        qualityService.getQualityControls(),
        qualityService.getReleaseInstructions(),
        qualityService.getQualityKPIs()
      ]);
      
      setInspections(controlsData);
      setKpis(kpisData);

      if (instructionsData && instructionsData.length > 0) {
        setReleaseInstructions(instructionsData);
      } else {
        const savedInstructions = localStorage.getItem('releaseInstructions');
        if (savedInstructions) {
          try {
            const parsed = JSON.parse(savedInstructions);
            console.log('📋 Instrucciones de liberación cargadas desde localStorage (fallback):', parsed);
            setReleaseInstructions(parsed);
          } catch (e) {
            console.error('Error al parsear instrucciones de localStorage:', e);
          }
        }
      }
      
      // Cargar catálogo de inspecciones desde localStorage
      const savedInspections = localStorage.getItem('inspectionCatalog');
      if (savedInspections) {
        try {
          const parsed = JSON.parse(savedInspections);
          console.log('🔍 Catálogo de inspecciones cargado desde localStorage:', parsed);
          setInspectionCatalog(parsed);
        } catch (e) {
          console.error('Error al parsear catálogo de inspecciones:', e);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quality data:', error);
      const savedInstructions = localStorage.getItem('releaseInstructions');
      if (savedInstructions) {
        try {
          const parsed = JSON.parse(savedInstructions);
          setReleaseInstructions(parsed);
        } catch (e) {
          console.error('Error al parsear instrucciones:', e);
        }
      }
      setLoading(false);
    }
  };

  const filterData = () => {
    // La lógica de filtrado se implementaría aquí
    // Por ahora, mostramos todos los datos
  };

  const getInspectionTypeIcon = (type) => {
    switch (type) {
      case 'incoming':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'in_process':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'final':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'customer':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleViewInspection = (inspection) => {
    setSelectedInspection(inspection);
    setShowInspectionModal(true);
  };

  // Funciones para manejar el catálogo de inspecciones
  const handleInspectionInputChange = (e) => {
    const { name, value, type } = e.target;
    setInspectionFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
    }));
  };

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newQualityControl = {
        control_id: inspectionFormData.name || `QC-${Date.now()}`,
        production_order_id: 'N/A',
        order_number: `QC-${Date.now()}`,
        part_number: 'N/A',
        customer_name: 'General',
        control_type: inspectionFormData.type || 'medicion',
        status: 'pending',
        inspection_date: new Date().toISOString(),
        inspector: 'Sistema',
        batch_size: 0,
        sample_size: 0,
        aql: 0,
        tests: [],
        overall_status: 'pending',
        notes: inspectionFormData.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const savedControl = await qualityService.createQualityControl(newQualityControl);
      setInspections(prev => [...prev, savedControl]);
      
      // Resetear formulario
      setInspectionFormData({
        name: '',
        type: 'medicion'
      });
      
      setShowInspectionForm(false);
      
      // Mostrar mensaje de éxito
      console.log('✅ Control de calidad creado en Firestore:', savedControl);
      
    } catch (error) {
      console.error('Error al agregar inspección:', error);
    }
  };

  // Funciones para manejar la tabla del catálogo
  const handleInspectionSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
  };

  const getSortedInspections = () => {
    let filtered = inspectionCatalog.filter(inspection => 
      inspectionSearchTerm === '' || 
      inspection.name.toLowerCase().includes(inspectionSearchTerm.toLowerCase()) ||
      inspection.type.toLowerCase().includes(inspectionSearchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Manejar fechas
      if (sortField === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const getPaginatedInspections = () => {
    const sorted = getSortedInspections();
    const startIndex = (inspectionPage - 1) * inspectionsPerPage;
    const endIndex = startIndex + inspectionsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  const getTotalInspectionPages = () => {
    const filtered = getSortedInspections();
    return Math.ceil(filtered.length / inspectionsPerPage);
  };

  const handleDeleteInspection = (inspectionId) => {
    if (window.confirm('¿Estás seguro de eliminar esta inspección del catálogo?')) {
      setInspectionCatalog(prev => {
        const updated = prev.filter(insp => insp.id !== inspectionId);
        localStorage.setItem('inspectionCatalog', JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Funciones para manejar el catálogo de instrucciones
  const handleInstructionInputChange = (e) => {
    const { name, value, type } = e.target;
    setInstructionFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value
    }));
  };

  // Filtrar instrucciones por búsqueda
  const filteredInstructions = releaseInstructions.filter(instruction => 
    instructionSearchTerm === '' || 
    instruction.code.toLowerCase().includes(instructionSearchTerm.toLowerCase()) ||
    instruction.name.toLowerCase().includes(instructionSearchTerm.toLowerCase()) ||
    (instruction.description && instruction.description.toLowerCase().includes(instructionSearchTerm.toLowerCase()))
  );

  // Paginación
  const totalPages = Math.ceil(filteredInstructions.length / instructionsPerPage);
  const startIndex = (instructionPage - 1) * instructionsPerPage;
  const paginatedInstructions = filteredInstructions.slice(startIndex, startIndex + instructionsPerPage);

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // Convertir archivo a base64 (similar a como se hace en Products.js)
        const documentData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });

        setInstructionFormData(prev => ({
          ...prev,
          document_url: documentData,
          document_name: file.name
        }));
      } catch (error) {
        console.error('Error al cargar documento:', error);
      }
    }
  };

  const handleViewDocument = (instruction) => {
    if (instruction.document_url) {
      setSelectedDocument({
        url: instruction.document_url,
        name: instruction.document_name || 'Documento',
        code: instruction.code
      });
      setShowDocumentModal(true);
    }
  };

  const handleInstructionSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const newInstruction = {
        ...instructionFormData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const savedInstruction = await qualityService.createReleaseInstruction(newInstruction);
      setReleaseInstructions(prev => {
        const updated = [...prev, savedInstruction];
        localStorage.setItem('releaseInstructions', JSON.stringify(updated));
        return updated;
      });
      
      setInstructionFormData({
        code: '',
        name: '',
        description: '',
        document_url: '',
        document_name: '',
        is_active: true
      });
      
      setShowInstructionForm(false);
      
      console.log('✅ Instrucción de liberación guardada en Firebase:', savedInstruction);
    } catch (error) {
      console.error('Error al agregar instrucción:', error);
    }
  };

  const renderKPIs = () => {
    if (!kpis) return null;

    return (
      <div className="mb-6">
        {/* Espacio para futuros KPIs */}
      </div>
    );
  };

  const renderInspectionsTable = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="table-header">
              <th className="table-header-cell">Fecha</th>
              <th className="table-header-cell">Tipo</th>
              <th className="table-header-cell">Orden</th>
              <th className="table-header-cell">Inspector</th>
              <th className="table-header-cell">Estado</th>
              <th className="table-header-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map((inspection) => (
              <tr key={inspection.id} className="table-row">
                <td className="table-cell">
                  {format(new Date(inspection.inspection_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                </td>
                <td className="table-cell">
                  <div className="flex items-center">
                    {getInspectionTypeIcon(inspection.inspection_type || inspection.control_type || 'incoming')}
                    <span className="ml-2 capitalize">{(inspection.inspection_type || inspection.control_type || 'incoming').replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="table-cell font-medium">{inspection.work_order_number || inspection.production_order_id || inspection.order_number || 'N/A'}</td>
                <td className="table-cell">{inspection.inspector_name || inspection.inspector || '-'}</td>
                <td className="table-cell">
                  <StatusBadge status={inspection.status} />
                </td>
                <td className="table-cell">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewInspection(inspection)}
                      className="text-primary-600 hover:text-primary-800"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {inspections.length === 0 && (
          <div className="text-center py-8 text-secondary-500">
            No se encontraron inspecciones
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Control de Calidad</h1>
          <p className="text-secondary-600">Gestión de inspecciones de calidad</p>
        </div>
        <div className="flex space-x-3">
        <Button
          onClick={() => setShowInspectionForm(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Inspección
        </Button>
        <Button
          onClick={() => setShowInstructionForm(true)}
          className="btn-secondary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Instrucción de Liberación
        </Button>
      </div>
      </div>

      {/* KPIs */}
      {renderKPIs()}

      {/* Tabla de Instrucciones de Liberación */}
      {releaseInstructions.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Instrucciones de Liberación Agregadas ({filteredInstructions.length} de {releaseInstructions.length})
              </h3>
              <span className="text-sm text-secondary-500">
                Mostrando {startIndex + 1}-{Math.min(startIndex + instructionsPerPage, filteredInstructions.length)} de {filteredInstructions.length}
              </span>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por código, nombre o descripción..."
                  value={instructionSearchTerm}
                  onChange={(e) => {
                    setInstructionSearchTerm(e.target.value);
                    setInstructionPage(1); // Resetear a página 1 al buscar
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Código</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Nombre</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Descripción</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Documento</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {paginatedInstructions.map((instruction) => (
                    <tr key={instruction.id}>
                      <td className="px-4 py-2 text-sm font-medium text-secondary-900">{instruction.code}</td>
                      <td className="px-4 py-2 text-sm text-secondary-700">{instruction.name}</td>
                      <td className="px-4 py-2 text-sm text-secondary-500">{instruction.description || '-'}</td>
                      <td className="px-4 py-2 text-sm text-secondary-700">
                        {instruction.document_url ? (
                          <button
                            onClick={() => handleViewDocument(instruction)}
                            className="inline-flex items-center text-green-600 hover:text-green-800 hover:underline cursor-pointer"
                            title="Ver documento"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            {instruction.document_name || 'Ver documento'}
                          </button>
                        ) : (
                          <span className="text-secondary-400">Sin documento</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${instruction.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {instruction.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                  onClick={() => setInstructionPage(prev => Math.max(1, prev - 1))}
                  disabled={instructionPage === 1}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setInstructionPage(page)}
                      className={`px-3 py-1 text-sm rounded ${
                        instructionPage === page 
                          ? 'bg-primary-600 text-white' 
                          : 'border border-secondary-300 hover:bg-secondary-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setInstructionPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={instructionPage === totalPages}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tabla del Catálogo de Inspecciones */}
      <Card>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">
              Catálogo de Inspecciones ({getSortedInspections().length} inspecciones)
            </h3>
            <div className="flex items-center space-x-4">
              {/* Selector de cantidad por página */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-secondary-600">Mostrar:</label>
                <select
                  value={inspectionsPerPage}
                  onChange={(e) => {
                    setInspectionsPerPage(parseInt(e.target.value));
                    setInspectionPage(1); // Resetear a página 1
                  }}
                  className="px-3 py-1 border border-secondary-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre o tipo de inspección..."
                value={inspectionSearchTerm}
                onChange={(e) => {
                  setInspectionSearchTerm(e.target.value);
                  setInspectionPage(1); // Resetear a página 1 al buscar
                }}
                className="w-full px-3 py-2 pl-10 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Tabla de Catálogo */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleInspectionSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nombre</span>
                      {sortField === 'name' && (
                        <span className="text-primary-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleInspectionSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Tipo</span>
                      {sortField === 'type' && (
                        <span className="text-primary-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase cursor-pointer hover:bg-secondary-100"
                    onClick={() => handleInspectionSort('created_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Fecha Creación</span>
                      {sortField === 'created_at' && (
                        <span className="text-primary-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">
                    Estado
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {getPaginatedInspections().map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-2 text-sm font-medium text-secondary-900">
                      {inspection.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-secondary-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {inspection.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-secondary-600">
                      {format(new Date(inspection.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`inline-flex items-center rounded-full font-medium px-2.5 py-0.5 text-xs ${
                        inspection.is_active 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-secondary-100 text-secondary-800'
                      }`}>
                        {inspection.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setInspectionFormData({
                              name: inspection.name,
                              type: inspection.type
                            });
                            setShowInspectionForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInspection(inspection.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {getPaginatedInspections().length === 0 && (
              <div className="text-center py-8 text-secondary-500">
                {inspectionSearchTerm 
                  ? 'No se encontraron inspecciones que coincidan con la búsqueda'
                  : 'No hay inspecciones en el catálogo'
                }
              </div>
            )}
          </div>

          {/* Paginación */}
          {getTotalInspectionPages() > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-secondary-600">
                Mostrando {((inspectionPage - 1) * inspectionsPerPage) + 1} - {Math.min(inspectionPage * inspectionsPerPage, getSortedInspections().length)} de {getSortedInspections().length}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setInspectionPage(prev => Math.max(1, prev - 1))}
                  disabled={inspectionPage === 1}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: getTotalInspectionPages() }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setInspectionPage(page)}
                      className={`px-3 py-1 text-sm rounded ${
                        inspectionPage === page 
                          ? 'bg-primary-600 text-white' 
                          : 'border border-secondary-300 hover:bg-secondary-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setInspectionPage(prev => Math.min(getTotalInspectionPages(), prev + 1))}
                  disabled={inspectionPage === getTotalInspectionPages()}
                  className="px-3 py-1 text-sm border border-secondary-300 rounded hover:bg-secondary-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Detalles de Inspección */}
      <Modal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        title="Detalles de Inspección"
        size="lg"
      >
        {selectedInspection && (
          <div className="space-y-4">
            {/* Inspection Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Tipo de Inspección
                </label>
                <div className="flex items-center">
                  {getInspectionTypeIcon(selectedInspection.inspection_type)}
                  <span className="ml-2 capitalize">{selectedInspection.inspection_type.replace('_', ' ')}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Estado
                </label>
                <StatusBadge status={selectedInspection.status} />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Inspector
                </label>
                <p className="text-secondary-900">{selectedInspection.inspector_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Fecha de Inspección
                </label>
                <p className="text-secondary-900">
                  {format(new Date(selectedInspection.inspection_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedInspection.notes && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notas
                </label>
                <p className="text-secondary-900 bg-secondary-50 rounded-lg p-3">
                  {selectedInspection.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowInspectionModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </Button>
              {selectedInspection.status === 'pending' && (
                <Button className="btn-success">
                  Aprobar Inspección
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Formulario de Inspección - Catálogo */}
      <Modal
        isOpen={showInspectionForm}
        onClose={() => setShowInspectionForm(false)}
        title="Agregar Inspección al Catálogo"
        size="md"
      >
        <form onSubmit={handleInspectionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Nombre de Inspección *
              </label>
              <input
                type="text"
                name="name"
                value={inspectionFormData.name}
                onChange={handleInspectionInputChange}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: Medición de espesor"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tipo de Inspección *
              </label>
              <select
                name="type"
                value={inspectionFormData.type}
                onChange={handleInspectionInputChange}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="medicion">Medición</option>
                <option value="visual">Visual</option>
                <option value="dimensional">Dimensional</option>
                <option value="funcional">Funcional</option>
                <option value="mecanico">Mecánico</option>
                <option value="electrico">Eléctrico</option>
                <option value="quimico">Químico</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={() => setShowInspectionForm(false)}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-primary"
            >
              Agregar al Catálogo
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Formulario de Instrucción */}
      <Modal
        isOpen={showInstructionForm}
        onClose={() => setShowInstructionForm(false)}
        title="Nueva Instrucción de Liberación"
        size="lg"
      >
        <form onSubmit={handleInstructionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                name="code"
                value={instructionFormData.code}
                onChange={handleInstructionInputChange}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: INST-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                name="name"
                value={instructionFormData.name}
                onChange={handleInstructionInputChange}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: Instrucción de liberación de zincado"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={instructionFormData.description}
              onChange={handleInstructionInputChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descripción detallada de la instrucción"
              rows="3"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Documento (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleDocumentUpload}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={() => setShowInstructionForm(false)}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-primary"
            >
              Agregar Instrucción
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QualityControl;

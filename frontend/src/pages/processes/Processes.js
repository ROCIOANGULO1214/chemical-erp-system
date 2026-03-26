import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Settings,
  Layers,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Upload,
  FileText,
  Image,
  Thermometer,
  Beaker,
  Timer,
  ChevronRight,
  ArrowRight,
  GitBranch,
  Workflow
} from 'lucide-react';
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

// Componente de Diagrama de Flujo
const ProcessFlowDiagram = ({ process, subprocesses }) => {
  const processSubprocesses = subprocesses
    .filter(sp => sp.process_id === process.id)
    .sort((a, b) => a.sequence_order - b.sequence_order);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Workflow className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Diagrama de Flujo - {process.name}
        </h3>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 w-full max-w-4xl">
          {/* Proceso Padre */}
          <div className="flex items-center justify-center w-full">
            <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4 min-w-[200px] text-center">
              <div className="font-semibold text-blue-900">{process.name}</div>
              <div className="text-sm text-blue-700">{process.code}</div>
              <div className="text-xs text-blue-600 mt-1">
                {process.estimated_time} {process.time_unit}
              </div>
            </div>
          </div>
          
          {/* Línea de conexión */}
          {processSubprocesses.length > 0 && (
            <div className="flex items-center">
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          )}
          
          {/* Subprocesos en secuencia */}
          <div className="flex flex-col space-y-4 w-full">
            {processSubprocesses.map((subprocess, index) => (
              <div key={subprocess.id} className="flex items-center space-x-4">
                {/* Secuencia */}
                <div className="flex-shrink-0">
                  <div className="bg-gray-100 border border-gray-300 rounded-full w-10 h-10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-700">
                      {subprocess.sequence_order}
                    </span>
                  </div>
                </div>
                
                {/* Línea de conexión */}
                {index < processSubprocesses.length - 1 && (
                  <div className="flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                
                {/* Subproceso */}
                <div className="flex-1">
                  <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-green-900">
                          {subprocess.name}
                        </div>
                        <div className="text-sm text-green-700 mb-2">
                          {subprocess.description}
                        </div>
                        
                        {/* Parámetros de liberación */}
                        {subprocess.release_parameters && subprocess.release_parameters.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs font-semibold text-green-800 mb-1">
                              Parámetros de Liberación:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {subprocess.release_parameters.map((param, paramIndex) => (
                                <div
                                  key={paramIndex}
                                  className="bg-white border border-green-200 rounded px-2 py-1 text-xs"
                                >
                                  <span className="font-medium text-green-800">
                                    {param.name}:
                                  </span>{' '}
                                  <span className="text-green-600">
                                    {param.value} {param.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Archivo adjunto */}
                        {subprocess.file_name && (
                          <div className="mt-2 flex items-center text-xs text-blue-600">
                            <FileText className="w-3 h-3 mr-1" />
                            {subprocess.file_name}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0 ml-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-900">
                            {subprocess.estimated_time} {subprocess.time_unit}
                          </div>
                          <StatusBadge
                            status={subprocess.is_active ? 'active' : 'inactive'}
                            text={subprocess.is_active ? 'Activo' : 'Inactivo'}
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Processes = () => {
  const [processes, setProcesses] = useState([]);
  const [subprocesses, setSubprocesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [selectedSubprocess, setSelectedSubprocess] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showSubprocessModal, setShowSubprocessModal] = useState(false);
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [showSubprocessForm, setShowSubprocessForm] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showProcessPanel, setShowProcessPanel] = useState(false);
  const [selectedProcessForPanel, setSelectedProcessForPanel] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Verificar permisos de acceso
  const hasAccess = () => {
    const allowedRoles = ['admin', 'supervisor', 'operator', 'planning'];
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

  const [processFormData, setProcessFormData] = useState({
    name: '',
    description: '',
    code: '',
    is_active: true,
    estimated_time: 0,
    time_unit: 'minutos'
  });

  const [subprocessFormData, setSubprocessFormData] = useState({
    name: '',
    description: '',
    process_id: '',
    sequence_order: 1,
    is_active: true,
    estimated_time: 0,
    time_unit: 'minutos',
    file_url: '',
    file_name: '',
    release_parameters: []
  });

  const handleEditSubprocess = (subprocess) => {
    setSelectedSubprocess(subprocess);
    setSubprocessFormData({
      name: subprocess.name,
      description: subprocess.description,
      process_id: subprocess.process_id,
      sequence_order: subprocess.sequence_order,
      is_active: subprocess.is_active,
      estimated_time: subprocess.estimated_time,
      time_unit: subprocess.time_unit,
      file_url: subprocess.file_url || '',
      file_name: subprocess.file_name || '',
      release_parameters: subprocess.release_parameters || []
    });
    setShowSubprocessForm(true);
  };

  useEffect(() => {
    if (!hasAccess()) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Datos de ejemplo para procesos
      const processesData = [
        {
          id: 'p-1',
          name: 'Zinc Plating',
          description: 'Proceso de galvanizado con zinc para protección contra corrosión',
          code: 'ZP-001',
          is_active: true,
          estimated_time: 45,
          time_unit: 'minutos',
          subprocess_count: 3,
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-03-20')
        },
        {
          id: 'p-2',
          name: 'Anodizado',
          description: 'Proceso de anodizado para piezas de aluminio',
          code: 'AN-002',
          is_active: true,
          estimated_time: 2,
          time_unit: 'horas',
          subprocess_count: 4,
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-03-22')
        },
        {
          id: 'p-3',
          name: 'Cromatizado',
          description: 'Proceso de cromatizado para acabados decorativos',
          code: 'CR-003',
          is_active: true,
          estimated_time: 30,
          time_unit: 'minutos',
          subprocess_count: 2,
          created_at: new Date('2024-02-01'),
          updated_at: new Date('2024-03-21')
        },
        {
          id: 'p-4',
          name: 'Pasivado',
          description: 'Proceso de pasivado para acero inoxidable',
          code: 'PS-004',
          is_active: false,
          estimated_time: 1.5,
          time_unit: 'horas',
          subprocess_count: 2,
          created_at: new Date('2024-02-10'),
          updated_at: new Date('2024-02-15')
        }
      ];

      // Datos de ejemplo para subprocesos con parámetros de liberación
      const subprocessesData = [
        {
          id: 'sp-1',
          name: 'Limpieza Química',
          description: 'Limpieza de la pieza con soluciones químicas',
          process_id: 'p-1',
          process_name: 'Zinc Plating',
          sequence_order: 1,
          is_active: true,
          estimated_time: 10,
          time_unit: 'minutos',
          file_url: '/files/limpieza_quimica.pdf',
          file_name: 'instrucciones_limpieza.pdf',
          release_parameters: [
            { name: 'Temperatura', value: '70-76', unit: '°C', type: 'range' },
            { name: 'pH', value: '8.5-9.5', unit: 'pH', type: 'range' },
            { name: 'Tiempo', value: '10', unit: 'minutos', type: 'exact' }
          ],
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-03-20')
        },
        {
          id: 'sp-2',
          name: 'Decapado',
          description: 'Remoción de óxido y contaminantes superficiales',
          process_id: 'p-1',
          process_name: 'Zinc Plating',
          sequence_order: 2,
          is_active: true,
          estimated_time: 15,
          time_unit: 'minutos',
          file_url: '/files/decapado_procedimiento.jpg',
          file_name: 'diagrama_decapado.jpg',
          release_parameters: [
            { name: 'Temperatura', value: '20-26', unit: '°C', type: 'range' },
            { name: 'Concentración', value: '15-20', unit: '%', type: 'range' },
            { name: 'Tiempo', value: '15', unit: 'minutos', type: 'exact' }
          ],
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-03-20')
        },
        {
          id: 'sp-3',
          name: 'Zincado',
          description: 'Aplicación de capa de zinc mediante inmersión',
          process_id: 'p-1',
          process_name: 'Zinc Plating',
          sequence_order: 3,
          is_active: true,
          estimated_time: 20,
          time_unit: 'minutos',
          file_url: '/files/zincado_manual.pdf',
          file_name: 'manual_zincado.pdf',
          release_parameters: [
            { name: 'Temperatura', value: '45-50', unit: '°C', type: 'range' },
            { name: 'Densidad', value: '1.15-1.20', unit: 'g/cm³', type: 'range' },
            { name: 'Voltaje', value: '2.5-3.0', unit: 'V', type: 'range' }
          ],
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-03-20')
        },
        {
          id: 'sp-4',
          name: 'Pre-tratamiento',
          description: 'Preparación superficial para anodizado',
          process_id: 'p-2',
          process_name: 'Anodizado',
          sequence_order: 1,
          is_active: true,
          estimated_time: 15,
          time_unit: 'minutos',
          file_url: '',
          file_name: '',
          release_parameters: [
            { name: 'Temperatura', value: '60-65', unit: '°C', type: 'range' },
            { name: 'Tiempo', value: '15', unit: 'minutos', type: 'exact' }
          ],
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-03-22')
        },
        {
          id: 'sp-5',
          name: 'Anodizado Tipo II',
          description: 'Proceso principal de anodizado',
          process_id: 'p-2',
          process_name: 'Anodizado',
          sequence_order: 2,
          is_active: true,
          estimated_time: 25,
          time_unit: 'minutos',
          file_url: '/files/anodizado_tipo2.pdf',
          file_name: 'especificaciones_anodizado.pdf',
          release_parameters: [
            { name: 'Temperatura', value: '18-22', unit: '°C', type: 'range' },
            { name: 'Densidad Corriente', value: '1.2-1.8', unit: 'A/dm²', type: 'range' },
            { name: 'Voltaje', value: '12-18', unit: 'V', type: 'range' },
            { name: 'Tiempo', value: '25', unit: 'minutos', type: 'exact' }
          ],
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-03-22')
        }
      ];
      
      setProcesses(processesData);
      setSubprocesses(subprocessesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching processes data:', error);
      setLoading(false);
    }
  };

  const handleViewProcess = (process) => {
    setSelectedProcess(process);
    setShowProcessModal(true);
  };

  const handleProcessCodeClick = (process) => {
    setSelectedProcessForPanel(process);
    setShowProcessPanel(true);
  };

  const handleFileClick = (subprocess) => {
    if (subprocess.file_url && subprocess.file_name) {
      setSelectedFile({
        name: subprocess.file_name,
        url: subprocess.file_url,
        type: subprocess.file_name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image'
      });
      setShowFileViewer(true);
    }
  };

  const handleViewSubprocess = (subprocess) => {
    setSelectedSubprocess(subprocess);
    setShowSubprocessModal(true);
  };

  const handleProcessInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProcessFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubprocessInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSubprocessFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Simulación de subida de archivo
      const fileName = file.name;
      const fileUrl = `/files/${fileName}`;
      setSubprocessFormData(prev => ({
        ...prev,
        file_name: fileName,
        file_url: fileUrl
      }));
    }
  };

  const handleAddParameter = () => {
    const newParameter = {
      name: '',
      value: '',
      unit: '',
      type: 'range'
    };
    setSubprocessFormData(prev => ({
      ...prev,
      release_parameters: [...prev.release_parameters, newParameter]
    }));
  };

  const handleParameterChange = (index, field, value) => {
    setSubprocessFormData(prev => ({
      ...prev,
      release_parameters: prev.release_parameters.map((param, i) => 
        i === index ? { ...param, [field]: value } : param
      )
    }));
  };

  const handleRemoveParameter = (index) => {
    setSubprocessFormData(prev => ({
      ...prev,
      release_parameters: prev.release_parameters.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitProcess = async () => {
    try {
      if (selectedProcess) {
        // Actualizar proceso existente
        const updatedProcess = {
          ...selectedProcess,
          ...processFormData,
          updated_at: new Date()
        };
        setProcesses(prev => prev.map(p => p.id === selectedProcess.id ? updatedProcess : p));
      } else {
        // Crear nuevo proceso
        const newProcess = {
          ...processFormData,
          id: `p-${Date.now()}`,
          subprocess_count: 0,
          created_at: new Date(),
          updated_at: new Date()
        };
        setProcesses(prev => [...prev, newProcess]);
      }
      
      setShowProcessForm(false);
      setSelectedProcess(null);
      setProcessFormData({
        name: '',
        description: '',
        code: '',
        is_active: true,
        estimated_time: 0
      });
      alert(selectedProcess ? 'Proceso actualizado exitosamente' : 'Proceso creado exitosamente');
    } catch (error) {
      console.error('Error saving process:', error);
      alert('Error al guardar el proceso');
    }
  };

  const handleSubmitSubprocess = async () => {
    try {
      if (selectedSubprocess) {
        // Actualizar subproceso existente
        const updatedSubprocess = {
          ...selectedSubprocess,
          ...subprocessFormData,
          updated_at: new Date()
        };
        setSubprocesses(prev => prev.map(sp => sp.id === selectedSubprocess.id ? updatedSubprocess : sp));
      } else {
        // Crear nuevo subproceso
        const newSubprocess = {
          ...subprocessFormData,
          id: `sp-${Date.now()}`,
          process_name: processes.find(p => p.id === subprocessFormData.process_id)?.name || '',
          created_at: new Date(),
          updated_at: new Date()
        };
        setSubprocesses(prev => [...prev, newSubprocess]);
        
        // Actualizar contador de subprocesos del proceso padre
        setProcesses(prev => prev.map(p => 
          p.id === subprocessFormData.process_id 
            ? { ...p, subprocess_count: p.subprocess_count + 1 }
            : p
        ));
      }
      
      setShowSubprocessForm(false);
      setSelectedSubprocess(null);
      setSubprocessFormData({
        name: '',
        description: '',
        process_id: '',
        sequence_order: 1,
        is_active: true,
        estimated_time: 0
      });
      alert(selectedSubprocess ? 'Subproceso actualizado exitosamente' : 'Subproceso creado exitosamente');
    } catch (error) {
      console.error('Error saving subprocess:', error);
      alert('Error al guardar el subproceso');
    }
  };

  const handleEditProcess = (process) => {
    setSelectedProcess(process);
    setProcessFormData({
      name: process.name,
      description: process.description,
      code: process.code,
      is_active: process.is_active,
      estimated_time: process.estimated_time
    });
    setShowProcessForm(true);
  };

  const handleDeleteProcess = async (process) => {
    if (window.confirm(`¿Estás seguro de eliminar el proceso ${process.name}?`)) {
      try {
        // Eliminar subprocesos asociados
        setSubprocesses(prev => prev.filter(sp => sp.process_id !== process.id));
        // Eliminar proceso
        setProcesses(prev => prev.filter(p => p.id !== process.id));
        alert('Proceso eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting process:', error);
        alert('Error al eliminar el proceso');
      }
    }
  };

  const handleDeleteSubprocess = async (subprocess) => {
    if (window.confirm(`¿Estás seguro de eliminar el subproceso ${subprocess.name}?`)) {
      try {
        setSubprocesses(prev => prev.filter(sp => sp.id !== subprocess.id));
        
        // Actualizar contador de subprocesos del proceso padre
        setProcesses(prev => prev.map(p => 
          p.id === subprocess.process_id 
            ? { ...p, subprocess_count: Math.max(0, p.subprocess_count - 1) }
            : p
        ));
        
        alert('Subproceso eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting subprocess:', error);
        alert('Error al eliminar el subproceso');
      }
    }
  };

  const filteredProcesses = processes.filter(process => 
    process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    process.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubprocesses = subprocesses.filter(subprocess => 
    subprocess.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subprocess.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Procesos</h1>
          <p className="text-gray-600">
            Gestión de procesos y subprocesos de producción - Acceso: {currentUser.role}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowSubprocessForm(true)}
            className="btn-secondary"
            disabled={!canEdit()}
          >
            <Layers className="w-4 h-4 mr-2" />
            Nuevo Subproceso
          </Button>
          {canEdit() && (
            <Button
              onClick={() => setShowProcessForm(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Proceso
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Procesos</p>
              <p className="text-2xl font-bold text-gray-900">{processes.length}</p>
            </div>
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Procesos Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {processes.filter(p => p.is_active).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Subprocesos</p>
              <p className="text-2xl font-bold text-purple-600">{subprocesses.length}</p>
            </div>
            <Layers className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-orange-600">
                {processes.length > 0 ? Math.round(processes.reduce((sum, p) => sum + p.estimated_time, 0) / processes.length) : 0} min
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, código o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Processes Table */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Procesos Principales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo Estimado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subprocesos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProcesses.map((process) => (
                <tr key={process.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <button
                    onClick={() => handleProcessCodeClick(process)}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    title="Ver panel del proceso"
                  >
                    {process.code}
                  </button>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {process.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate" title={process.description}>
                      {process.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {process.estimated_time} {process.time_unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Layers className="w-3 h-3 mr-1" />
                      {process.subprocess_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={process.is_active ? 'active' : 'inactive'}
                      text={process.is_active ? 'Activo' : 'Inactivo'}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewProcess(process)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit() && (
                        <button
                          onClick={() => handleEditProcess(process)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete() && (
                        <button
                          onClick={() => handleDeleteProcess(process)}
                          className="text-red-600 hover:text-red-900"
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
          
          {filteredProcesses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron procesos
            </div>
          )}
        </div>
      </Card>

      {/* Subprocesses Table */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Subprocesos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proceso Padre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Secuencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo Estimado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubprocesses.map((subprocess) => (
                <tr key={subprocess.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Settings className="w-3 h-3 mr-1 text-gray-400" />
                      {subprocess.process_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subprocess.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate" title={subprocess.description}>
                      {subprocess.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Paso {subprocess.sequence_order}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {subprocess.estimated_time} {subprocess.time_unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subprocess.file_name ? (
                      <button
                        onClick={() => handleFileClick(subprocess)}
                        className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                        title={`Ver archivo: ${subprocess.file_name}`}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-[100px]" title={subprocess.file_name}>
                          {subprocess.file_name}
                        </span>
                      </button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={subprocess.is_active ? 'active' : 'inactive'}
                      text={subprocess.is_active ? 'Activo' : 'Inactivo'}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewSubprocess(subprocess)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit() && (
                        <button
                          onClick={() => handleEditSubprocess(subprocess)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete() && (
                        <button
                          onClick={() => handleDeleteSubprocess(subprocess)}
                          className="text-red-600 hover:text-red-900"
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
          
          {filteredSubprocesses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron subprocesos
            </div>
          )}
        </div>
      </Card>

      {/* Process Details Modal */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        title={`Detalles del Proceso - ${selectedProcess?.name}`}
        size="lg"
      >
        {selectedProcess && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <p className="text-gray-900 font-medium">{selectedProcess.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <StatusBadge
                  status={selectedProcess.is_active ? 'active' : 'inactive'}
                  text={selectedProcess.is_active ? 'Activo' : 'Inactivo'}
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo Estimado
              </label>
              <p className="text-gray-900">{selectedProcess.estimated_time} {selectedProcess.time_unit}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subprocesos
              </label>
              <p className="text-gray-900">{selectedProcess.subprocess_count}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
              {selectedProcess.description}
            </p>
          </div>

          {/* Diagrama de Flujo */}
          <ProcessFlowDiagram process={selectedProcess} subprocesses={subprocesses} />

            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowProcessModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </Button>
              {canEdit() && (
                <Button className="btn-primary">
                  Editar Proceso
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Subprocess Details Modal */}
      <Modal
        isOpen={showSubprocessModal}
        onClose={() => setShowSubprocessModal(false)}
        title={`Detalles del Subproceso - ${selectedSubprocess?.name}`}
        size="lg"
      >
        {selectedSubprocess && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proceso Padre
                </label>
                <p className="text-gray-900">{selectedSubprocess.process_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secuencia
                </label>
                <p className="text-gray-900">Paso {selectedSubprocess.sequence_order}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo Estimado
                </label>
                <p className="text-gray-900">{selectedSubprocess.estimated_time} minutos</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <StatusBadge
                  status={selectedSubprocess.is_active ? 'active' : 'inactive'}
                  text={selectedSubprocess.is_active ? 'Activo' : 'Inactivo'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                {selectedSubprocess.description}
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowSubprocessModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </Button>
              {canEdit() && (
                <Button className="btn-primary">
                  Editar Subproceso
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Process Form Modal */}
      <Modal
        isOpen={showProcessForm}
        onClose={() => setShowProcessForm(false)}
        title={selectedProcess ? 'Editar Proceso' : 'Nuevo Proceso'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <Input 
                name="code"
                placeholder="Ej: ZP-001" 
                value={processFormData.code}
                onChange={handleProcessInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Proceso
              </label>
              <Input 
                name="name"
                placeholder="Nombre completo" 
                value={processFormData.name}
                onChange={handleProcessInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo Estimado
              </label>
              <div className="flex space-x-2">
                <Input 
                  name="estimated_time"
                  type="number"
                  placeholder="45" 
                  value={processFormData.estimated_time}
                  onChange={handleProcessInputChange}
                  className="flex-1"
                />
                <select
                  name="time_unit"
                  className="input"
                  value={processFormData.time_unit}
                  onChange={handleProcessInputChange}
                >
                  <option value="minutos">Minutos</option>
                  <option value="horas">Horas</option>
                  <option value="segundos">Segundos</option>
                  <option value="días">Días</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              placeholder="Descripción detallada del proceso..."
              className="input"
              rows={3}
              value={processFormData.description}
              onChange={handleProcessInputChange}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              className="mr-2"
              checked={processFormData.is_active}
              onChange={handleProcessInputChange}
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Proceso activo
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => {
                setShowProcessForm(false);
                setSelectedProcess(null);
                setProcessFormData({
                  name: '',
                  description: '',
                  code: '',
                  is_active: true,
                  estimated_time: 0,
                  time_unit: 'minutos'
                });
              }}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitProcess} className="btn-primary">
              {selectedProcess ? 'Actualizar Proceso' : 'Crear Proceso'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Subprocess Form Modal */}
      <Modal
        isOpen={showSubprocessForm}
        onClose={() => setShowSubprocessForm(false)}
        title={selectedSubprocess ? 'Editar Subproceso' : 'Nuevo Subproceso'}
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proceso Padre
              </label>
              <select
                name="process_id"
                className="input"
                value={subprocessFormData.process_id}
                onChange={handleSubprocessInputChange}
              >
                <option value="">Seleccionar proceso</option>
                {processes.map((process) => (
                  <option key={process.id} value={process.id}>
                    {process.name} ({process.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Subproceso
              </label>
              <Input 
                name="name"
                placeholder="Nombre completo" 
                value={subprocessFormData.name}
                onChange={handleSubprocessInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secuencia
              </label>
              <Input 
                name="sequence_order"
                type="number"
                placeholder="1" 
                value={subprocessFormData.sequence_order}
                onChange={handleSubprocessInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo Estimado
              </label>
              <div className="flex space-x-2">
                <Input 
                  name="estimated_time"
                  type="number"
                  placeholder="15" 
                  value={subprocessFormData.estimated_time}
                  onChange={handleSubprocessInputChange}
                  className="flex-1"
                />
                <select
                  name="time_unit"
                  className="input"
                  value={subprocessFormData.time_unit}
                  onChange={handleSubprocessInputChange}
                >
                  <option value="minutos">Minutos</option>
                  <option value="horas">Horas</option>
                  <option value="segundos">Segundos</option>
                  <option value="días">Días</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              placeholder="Descripción detallada del subproceso..."
              className="input"
              rows={3}
              value={subprocessFormData.description}
              onChange={handleSubprocessInputChange}
            />
          </div>

          {/* Archivo Adjunto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivo Adjunto (PDF, JPG, PNG)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Seleccionar Archivo
              </label>
              {subprocessFormData.file_name && (
                <div className="flex items-center text-sm text-blue-600">
                  <FileText className="w-4 h-4 mr-1" />
                  {subprocessFormData.file_name}
                </div>
              )}
            </div>
          </div>

          {/* Parámetros de Liberación */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Parámetros de Liberación
              </label>
              <Button
                onClick={handleAddParameter}
                className="btn-secondary text-sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Agregar Parámetro
              </Button>
            </div>
            
            <div className="space-y-3">
              {(subprocessFormData.release_parameters || []).map((param, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Parámetro {index + 1}
                    </h4>
                    <button
                      onClick={() => handleRemoveParameter(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nombre
                      </label>
                      <Input
                        placeholder="Ej: Temperatura"
                        value={param.name}
                        onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Valor
                      </label>
                      <Input
                        placeholder="Ej: 70-76"
                        value={param.value}
                        onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unidad
                      </label>
                      <Input
                        placeholder="Ej: °C"
                        value={param.unit}
                        onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={param.type}
                        onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                        className="input"
                      >
                        <option value="range">Rango</option>
                        <option value="exact">Exacto</option>
                        <option value="min">Mínimo</option>
                        <option value="max">Máximo</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              {(subprocessFormData.release_parameters || []).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No hay parámetros configurados. Haz clic en "Agregar Parámetro" para añadir.
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              className="mr-2"
              checked={subprocessFormData.is_active}
              onChange={handleSubprocessInputChange}
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Subproceso activo
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => {
                setShowSubprocessForm(false);
                setSelectedSubprocess(null);
                setSubprocessFormData({
                  name: '',
                  description: '',
                  process_id: '',
                  sequence_order: 1,
                  is_active: true,
                  estimated_time: 0,
                  time_unit: 'minutos',
                  file_url: '',
                  file_name: '',
                  release_parameters: []
                });
              }}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitSubprocess} className="btn-primary">
              {selectedSubprocess ? 'Actualizar Subproceso' : 'Crear Subproceso'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Process Visual Panel */}
      <Modal
        isOpen={showProcessPanel}
        onClose={() => setShowProcessPanel(false)}
        title={`Panel Visual - ${selectedProcessForPanel?.name}`}
        size="full"
      >
        {selectedProcessForPanel && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">
                    {selectedProcessForPanel.name}
                  </h2>
                  <p className="text-blue-700 font-medium">
                    Código: {selectedProcessForPanel.code}
                  </p>
                  <p className="text-blue-600">
                    {selectedProcessForPanel.description}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-900">
                    {selectedProcessForPanel.estimated_time} {selectedProcessForPanel.time_unit}
                  </div>
                  <StatusBadge
                    status={selectedProcessForPanel.is_active ? 'active' : 'inactive'}
                    text={selectedProcessForPanel.is_active ? 'Activo' : 'Inactivo'}
                  />
                </div>
              </div>
            </div>

            {/* Process Flow Diagram */}
            <ProcessFlowDiagram process={selectedProcessForPanel} subprocesses={subprocesses} />

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Subprocesos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {subprocesses.filter(sp => sp.process_id === selectedProcessForPanel.id).length}
                    </p>
                  </div>
                  <Layers className="w-8 h-8 text-purple-500" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Subprocesos Activos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {subprocesses.filter(sp => sp.process_id === selectedProcessForPanel.id && sp.is_active).length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tiempo Total</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {subprocesses
                        .filter(sp => sp.process_id === selectedProcessForPanel.id)
                        .reduce((sum, sp) => sum + sp.estimated_time, 0)} min
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Con Archivos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {subprocesses.filter(sp => 
                        sp.process_id === selectedProcessForPanel.id && sp.file_name
                      ).length}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </Card>
            </div>

            {/* Subprocess Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalles de Subprocesos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subprocesses
                  .filter(sp => sp.process_id === selectedProcessForPanel.id)
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map((subprocess) => (
                    <Card key={subprocess.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center mb-2">
                            <div className="bg-blue-100 border border-blue-300 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                              <span className="text-sm font-semibold text-blue-800">
                                {subprocess.sequence_order}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900">
                              {subprocess.name}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {subprocess.description}
                          </p>
                          
                          {/* Parameters */}
                          {subprocess.release_parameters && subprocess.release_parameters.length > 0 && (
                            <div className="mb-3">
                              <div className="text-xs font-semibold text-gray-700 mb-2">
                                Parámetros de Liberación:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {subprocess.release_parameters.map((param, paramIndex) => (
                                  <div
                                    key={paramIndex}
                                    className="bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs"
                                  >
                                    <span className="font-medium text-gray-800">
                                      {param.name}:
                                    </span>{' '}
                                    <span className="text-gray-600">
                                      {param.value} {param.unit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* File */}
                          {subprocess.file_name && (
                            <div className="flex items-center text-sm text-blue-600">
                              <FileText className="w-3 h-3 mr-1" />
                              <button
                                onClick={() => handleFileClick(subprocess)}
                                className="hover:underline"
                              >
                                {subprocess.file_name}
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {subprocess.estimated_time} {subprocess.time_unit}
                          </div>
                          <StatusBadge
                            status={subprocess.is_active ? 'active' : 'inactive'}
                            text={subprocess.is_active ? 'Activo' : 'Inactivo'}
                            size="sm"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowProcessPanel(false)}
                className="btn-secondary"
              >
                Cerrar Panel
              </Button>
              {canEdit() && (
                <Button
                  onClick={() => {
                    setShowProcessPanel(false);
                    handleEditProcess(selectedProcessForPanel);
                  }}
                  className="btn-primary"
                >
                  Editar Proceso
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* File Viewer Modal */}
      <Modal
        isOpen={showFileViewer}
        onClose={() => setShowFileViewer(false)}
        title={`Visor de Archivo - ${selectedFile?.name}`}
        size="full"
      >
        {selectedFile && (
          <div className="h-full flex flex-col">
            {/* File Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedFile.name}
                  </h3>
                  <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {selectedFile.type === 'pdf' ? 'PDF' : 'Imagen'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      // Descargar archivo
                      const link = document.createElement('a');
                      link.href = selectedFile.url;
                      link.download = selectedFile.name;
                      link.click();
                    }}
                    className="btn-secondary"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                  <Button
                    onClick={() => setShowFileViewer(false)}
                    className="btn-secondary"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 bg-gray-100 p-4 overflow-auto">
              {selectedFile.type === 'pdf' ? (
                <div className="h-full">
                  <div className="bg-white rounded-lg shadow-lg h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="mb-6">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-red-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Visor de PDF
                        </h4>
                        <p className="text-gray-600 mb-4">
                          {selectedFile.name}
                        </p>
                      </div>
                      
                      {/* PDF Preview iframe */}
                      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden" style={{ height: '600px', width: '800px', maxWidth: '100%' }}>
                        <iframe
                          src={selectedFile.url}
                          title={selectedFile.name}
                          className="w-full h-full"
                          frameBorder="0"
                        />
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        <p>Si el PDF no se carga correctamente, puedes descargarlo usando el botón de arriba.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full">
                  <div className="bg-white rounded-lg shadow-lg h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="mb-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Image className="w-8 h-8 text-green-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          Visor de Imagen
                        </h4>
                        <p className="text-gray-600 mb-4">
                          {selectedFile.name}
                        </p>
                      </div>
                      
                      {/* Image Preview */}
                      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden" style={{ maxWidth: '800px', maxHeight: '600px' }}>
                        <img
                          src={selectedFile.url}
                          alt={selectedFile.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Processes;

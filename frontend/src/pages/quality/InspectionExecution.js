import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Pause,
  Save,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import inspectionExecutionService from '../../services/inspectionExecutionService';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';

const InspectionExecution = () => {
  const [executions, setExecutions] = useState([]);
  const [pendingInspections, setPendingInspections] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [executionResults, setExecutionResults] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [executions, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [pendingData, historyData] = await Promise.all([
        inspectionExecutionService.getPendingInspections(),
        inspectionExecutionService.getExecutionHistory()
      ]);
      
      setPendingInspections(pendingData);
      setExecutionHistory(historyData);
      setExecutions([...pendingData, ...historyData]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading inspection data:', error);
      setLoading(false);
    }
  };

  const filterData = () => {
    // La lógica de filtrado se implementaría aquí
  };

  const handleStartExecution = (execution) => {
    setSelectedExecution(execution);
    
    // Inicializar resultados para cada inspección
    const initialResults = {};
    execution.inspections.forEach(inspection => {
      initialResults[inspection.id] = {
        values: [],
        status: 'pending',
        notes: '',
        inspector: '',
        inspection_date: new Date().toISOString()
      };
    });
    
    setExecutionResults(initialResults);
    setShowExecutionModal(true);
  };

  const handleResultChange = (inspectionId, field, value) => {
    setExecutionResults(prev => ({
      ...prev,
      [inspectionId]: {
        ...prev[inspectionId],
        [field]: value
      }
    }));
  };

  const handleAddMeasurement = (inspectionId, value) => {
    if (value) {
      setExecutionResults(prev => ({
        ...prev,
        [inspectionId]: {
          ...prev[inspectionId],
          values: [...prev[inspectionId].values, parseFloat(value)]
        }
      }));
    }
  };

  const handleRemoveMeasurement = (inspectionId, index) => {
    setExecutionResults(prev => ({
      ...prev,
      [inspectionId]: {
        ...prev[inspectionId],
        values: prev[inspectionId].values.filter((_, i) => i !== index)
      }
    }));
  };

  const validateInspection = (inspection, result) => {
    if (inspection.inspection_type === 'visual' || inspection.inspection_type === 'laboratorio') {
      return result.status === 'pass';
    }
    
    if (result.values.length === 0) return false;
    
    const average = result.values.reduce((sum, val) => sum + val, 0) / result.values.length;
    return inspectionExecutionService.validateResult(
      average,
      inspection.tolerance_min,
      inspection.tolerance_max,
      inspection.inspection_type
    );
  };

  const handleCompleteExecution = async () => {
    try {
      // Validar todas las inspecciones requeridas
      const requiredInspections = selectedExecution.inspections.filter(i => i.is_required);
      const allRequiredCompleted = requiredInspections.every(inspection => {
        const result = executionResults[inspection.id];
        return result && (result.status === 'pass' || result.status === 'fail');
      });

      if (!allRequiredCompleted) {
        alert('Debe completar todas las inspecciones requeridas');
        return;
      }

      // Registrar resultados para cada inspección
      for (const inspection of selectedExecution.inspections) {
        const result = executionResults[inspection.id];
        if (result) {
          await inspectionExecutionService.registerInspectionResult(
            selectedExecution.id,
            inspection.id,
            result
          );
        }
      }

      // Completar ejecución
      await inspectionExecutionService.completeInspectionExecution(selectedExecution.id);
      
      setShowExecutionModal(false);
      setSelectedExecution(null);
      setExecutionResults({});
      loadData();
    } catch (error) {
      console.error('Error completing execution:', error);
      alert('Error al completar la inspección');
    }
  };

  const handleViewDetails = (execution) => {
    setSelectedExecution(execution);
    setShowDetailsModal(true);
  };

  const renderExecutionForm = () => {
    if (!selectedExecution) return null;

    return (
      <div className="space-y-6">
        {/* Información de la Orden */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Información de la Orden</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Producto:</span>
              <p className="text-gray-600">{selectedExecution.product_name}</p>
            </div>
            <div>
              <span className="font-medium">Orden:</span>
              <p className="text-gray-600">{selectedExecution.work_order_number}</p>
            </div>
            <div>
              <span className="font-medium">Lote:</span>
              <p className="text-gray-600">{selectedExecution.batch_number}</p>
            </div>
            <div>
              <span className="font-medium">Fecha:</span>
              <p className="text-gray-600">
                {format(new Date(selectedExecution.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario de Inspecciones */}
        <div className="space-y-4">
          {selectedExecution.inspections.map((inspection, index) => {
            const result = executionResults[inspection.id] || {};
            const isValid = validateInspection(inspection, result);
            
            return (
              <Card key={inspection.id} className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {index + 1}. {inspection.inspection_name}
                    </h4>
                    <p className="text-sm text-gray-600">{inspection.acceptance_criteria}</p>
                    {inspection.tolerance_min !== null && inspection.tolerance_max !== null && (
                      <p className="text-sm text-gray-500">
                        Tolerancia: {inspection.tolerance_min} - {inspection.tolerance_max} {inspection.unit}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={isValid ? 'approved' : 'pending'} />
                    {inspection.is_required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Requerida</span>
                    )}
                  </div>
                </div>

                {/* Formulario según tipo de inspección */}
                {inspection.inspection_type === 'medicion' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mediciones ({inspection.unit})
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          type="number"
                          step="any"
                          placeholder="Ingrese valor"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddMeasurement(inspection.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={(e) => {
                            const input = e.target.previousElementSibling;
                            handleAddMeasurement(inspection.id, input.value);
                            input.value = '';
                          }}
                          className="btn-primary"
                        >
                          Agregar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Lista de mediciones */}
                    {result.values && result.values.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700">Mediciones registradas:</div>
                        <div className="flex flex-wrap gap-2">
                          {result.values.map((value, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                            >
                              {value} {inspection.unit}
                              <button
                                type="button"
                                onClick={() => handleRemoveMeasurement(inspection.id, idx)}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                        {result.values.length > 0 && (
                          <div className="text-sm text-gray-600">
                            Promedio: {(result.values.reduce((sum, val) => sum + val, 0) / result.values.length).toFixed(2)} {inspection.unit}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resultado
                      </label>
                      <select
                        value={result.status || ''}
                        onChange={(e) => handleResultChange(inspection.id, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar...</option>
                        <option value="pass">Aprobado</option>
                        <option value="fail">Rechazado</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    value={result.notes || ''}
                    onChange={(e) => handleResultChange(inspection.id, 'notes', e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Observaciones..."
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            onClick={() => setShowExecutionModal(false)}
            className="btn-secondary"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCompleteExecution}
            className="btn-success"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Completar Inspección
          </Button>
        </div>
      </div>
    );
  };

  const renderExecutionDetails = () => {
    if (!selectedExecution) return null;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Detalles de la Ejecución</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Producto:</span>
              <p className="text-gray-600">{selectedExecution.product_name}</p>
            </div>
            <div>
              <span className="font-medium">Orden:</span>
              <p className="text-gray-600">{selectedExecution.work_order_number}</p>
            </div>
            <div>
              <span className="font-medium">Lote:</span>
              <p className="text-gray-600">{selectedExecution.batch_number}</p>
            </div>
            <div>
              <span className="font-medium">Ejecutado por:</span>
              <p className="text-gray-600">{selectedExecution.inspector || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium">Fecha:</span>
              <p className="text-gray-600">
                {format(new Date(selectedExecution.execution_date), 'dd/MM/yyyy HH:mm', { locale: es })}
              </p>
            </div>
            <div>
              <span className="font-medium">Estado:</span>
              <StatusBadge status={selectedExecution.status} />
            </div>
          </div>
        </div>

        {/* Resultados de inspecciones */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Resultados de Inspecciones</h4>
          {selectedExecution.inspections?.map((inspection) => (
            <div key={inspection.id} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-gray-900">{inspection.inspection_name}</h5>
                  <p className="text-sm text-gray-600">{inspection.acceptance_criteria}</p>
                </div>
                <StatusBadge status={inspection.status} />
              </div>
              {inspection.results && (
                <div className="mt-2 text-sm text-gray-600">
                  {inspection.results.notes && <p>Notas: {inspection.results.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          <h1 className="text-2xl font-bold text-secondary-900">Ejecución de Inspecciones</h1>
          <p className="text-secondary-600">Registro y seguimiento de inspecciones de calidad</p>
        </div>
        <Button onClick={loadData} className="btn-secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            Pendientes ({pendingInspections.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-secondary-500 hover:text-secondary-700'
            }`}
          >
            Historial ({executionHistory.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <Input
                  placeholder="Buscar ejecuciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Content */}
      {activeTab === 'pending' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th className="table-header-cell">Fecha Programada</th>
                  <th className="table-header-cell">Producto</th>
                  <th className="table-header-cell">Orden de Trabajo</th>
                  <th className="table-header-cell">Lote</th>
                  <th className="table-header-cell">Inspecciones</th>
                  <th className="table-header-cell">Estado</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingInspections.map((execution) => (
                  <tr key={execution.id} className="table-row">
                    <td className="table-cell">
                      {format(new Date(execution.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="table-cell">{execution.product_name}</td>
                    <td className="table-cell">{execution.work_order_number}</td>
                    <td className="table-cell">{execution.batch_number}</td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <div>{execution.inspections.length} inspecciones</div>
                        <div className="text-secondary-500">
                          {execution.inspections.filter(i => i.is_required).length} requeridas
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={execution.status} />
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStartExecution(execution)}
                          className="text-primary-600 hover:text-primary-800"
                          title="Iniciar inspección"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewDetails(execution)}
                          className="text-secondary-600 hover:text-secondary-800"
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
            
            {pendingInspections.length === 0 && (
              <div className="text-center py-8 text-secondary-500">
                No hay inspecciones pendientes
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="table-header">
                  <th className="table-header-cell">Fecha Ejecución</th>
                  <th className="table-header-cell">Producto</th>
                  <th className="table-header-cell">Orden de Trabajo</th>
                  <th className="table-header-cell">Inspector</th>
                  <th className="table-header-cell">Resultados</th>
                  <th className="table-header-cell">Estado</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {executionHistory.map((execution) => (
                  <tr key={execution.id} className="table-row">
                    <td className="table-cell">
                      {format(new Date(execution.execution_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="table-cell">{execution.product_name}</td>
                    <td className="table-cell">{execution.work_order_number}</td>
                    <td className="table-cell">{execution.inspector}</td>
                    <td className="table-cell">
                      <div className="text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="w-4 h-4 text-success-500 mr-1" />
                          {execution.passed_inspections} aprobadas
                        </div>
                        {execution.failed_inspections > 0 && (
                          <div className="flex items-center">
                            <XCircle className="w-4 h-4 text-danger-500 mr-1" />
                            {execution.failed_inspections} rechazadas
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={execution.status} />
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleViewDetails(execution)}
                        className="text-secondary-600 hover:text-secondary-800"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {executionHistory.length === 0 && (
              <div className="text-center py-8 text-secondary-500">
                No hay historial de ejecuciones
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Modal de Ejecución */}
      <Modal
        isOpen={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        title="Ejecutar Inspección"
        size="xl"
      >
        {renderExecutionForm()}
      </Modal>

      {/* Modal de Detalles */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles de Inspección"
        size="lg"
      >
        {renderExecutionDetails()}
      </Modal>
    </div>
  );
};

export default InspectionExecution;

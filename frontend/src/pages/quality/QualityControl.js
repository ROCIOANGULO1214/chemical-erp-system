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
  TrendingUp
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterData();
  }, [inspections, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      const [inspectionsData, kpisData] = await Promise.all([
        qualityService.getQualityInspections(),
        qualityService.getQualityKPIs()
      ]);
      
      setInspections(inspectionsData);
      setKpis(kpisData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quality data:', error);
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

  const renderKPIs = () => {
    if (!kpis) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Tasa de Aprobación</p>
              <p className="text-2xl font-bold text-success-600">{kpis.quality_pass_rate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-success-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Inspecciones</p>
              <p className="text-2xl font-bold text-primary-600">{kpis.total_inspections}</p>
            </div>
            <FileText className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
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
                    {getInspectionTypeIcon(inspection.inspection_type || 'incoming')}
                    <span className="ml-2 capitalize">{(inspection.inspection_type || 'incoming').replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="table-cell font-medium">{inspection.work_order_number || inspection.production_order_id || 'N/A'}</td>
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
      {/* Mensaje de depuración */}
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
        <p className="font-bold">DEBUG: QualityControl cargado</p>
        <p>Inspecciones: {inspections.length}</p>
        <p>KPIs: {kpis ? 'Cargados' : 'No cargados'}</p>
      </div>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Control de Calidad</h1>
          <p className="text-secondary-600">Gestión de inspecciones de calidad</p>
        </div>
        <Button
          onClick={() => setShowInspectionForm(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Inspección
        </Button>
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
                  placeholder="Buscar inspecciones..."
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
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Inspections Table */}
      {renderInspectionsTable()}

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

      {/* Modal de Formulario de Inspección */}
      <Modal
        isOpen={showInspectionForm}
        onClose={() => setShowInspectionForm(false)}
        title="Nueva Inspección"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); setShowInspectionForm(false); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tipo de Inspección *
              </label>
              <select className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="incoming">Recepción (Incoming)</option>
                <option value="in_process">En Proceso</option>
                <option value="final">Final</option>
                <option value="customer">Cliente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Orden de Producción *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: PO-2024-001"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Inspector *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Nombre del inspector"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Notas
            </label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows="3"
              placeholder="Observaciones de la inspección..."
            />
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
              <Plus className="w-4 h-4 mr-2" />
              Crear Inspección
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default QualityControl;

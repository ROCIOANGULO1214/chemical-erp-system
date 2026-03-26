import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Beaker,
  Ruler,
  Microscope,
  Package
} from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

const InspectionCatalog = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'medicion',
    description: '',
    acceptance_criteria: '',
    tolerance_min: '',
    tolerance_max: '',
    tolerance_range: '',
    unit: '',
    observations: '',
    is_active: true
  });

  const inspectionTypes = [
    { value: 'visual', label: 'Visual', icon: <Eye className="w-4 h-4" /> },
    { value: 'medicion', label: 'Medición', icon: <Ruler className="w-4 h-4" /> },
    { value: 'laboratorio', label: 'Laboratorio', icon: <Beaker className="w-4 h-4" /> },
    { value: 'incoming', label: 'Incoming', icon: <Package className="w-4 h-4" /> }
  ];

  const units = [
    'μm', 'mm', 'cm', 'm', 'g', 'kg', 'mg', 'L', 'mL', '%', '°C', '°F', 'psi', 'bar', 'N', 'kN', 'V', 'A', 'Ω', 'Hz', 'rpm', 'ppm', 'pH', '°', 'min', 'h', 's'
  ];

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    try {
      // Mock data - reemplazar con llamada real a API
      const mockInspections = [
        {
          id: 1,
          name: 'Espesor de Recubrimiento',
          type: 'medicion',
          description: 'Medición del espesor del recubrimiento de zinc en piezas metálicas',
          acceptance_criteria: 'Espesor mínimo según especificación de cliente',
          tolerance_min: 25,
          tolerance_max: 35,
          unit: 'μm',
          observations: 'Realizar en 3 puntos diferentes y promediar',
          is_active: true,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: 2,
          name: 'Prueba de Adhesión',
          type: 'laboratorio',
          description: 'Verificación de la adhesión del recubrimiento mediante prueba de cinta',
          acceptance_criteria: 'Sin desprendimiento del recubrimiento',
          tolerance_min: null,
          tolerance_max: null,
          unit: null,
          observations: 'Según ASTM D3359',
          is_active: true,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        },
        {
          id: 3,
          name: 'Inspección Visual de Superficie',
          type: 'visual',
          description: 'Revisión visual de defectos superficiales',
          acceptance_criteria: 'Sin grietas, porosidades o defectos visibles',
          tolerance_min: null,
          tolerance_max: null,
          unit: null,
          observations: 'Iluminación mínima de 500 lux',
          is_active: true,
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        }
      ];
      
      setInspections(mockInspections);
      setLoading(false);
    } catch (error) {
      console.error('Error loading inspections:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedInspection) {
        // Editar inspección existente
        const updatedInspections = inspections.map(insp => 
          insp.id === selectedInspection.id 
            ? { ...formData, id: selectedInspection.id, updated_at: new Date().toISOString() }
            : insp
        );
        setInspections(updatedInspections);
      } else {
        // Crear nueva inspección
        const newInspection = {
          ...formData,
          id: Math.max(...inspections.map(i => i.id), 0) + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setInspections([...inspections, newInspection]);
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving inspection:', error);
    }
  };

  const handleEdit = (inspection) => {
    setSelectedInspection(inspection);
    setFormData({
      name: inspection.name,
      type: inspection.type,
      description: inspection.description,
      acceptance_criteria: inspection.acceptance_criteria,
      tolerance_min: inspection.tolerance_min || '',
      tolerance_max: inspection.tolerance_max || '',
      tolerance_range: inspection.tolerance_range || '',
      unit: inspection.unit || '',
      observations: inspection.observations || '',
      is_active: inspection.is_active
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Está seguro de eliminar esta inspección?')) {
      setInspections(inspections.filter(insp => insp.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'medicion',
      description: '',
      acceptance_criteria: '',
      tolerance_min: '',
      tolerance_max: '',
      tolerance_range: '',
      unit: '',
      observations: '',
      is_active: true
    });
    setSelectedInspection(null);
  };

  const getTypeIcon = (type) => {
    const typeInfo = inspectionTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : <Ruler className="w-4 h-4" />;
  };

  const getTypeLabel = (type) => {
    const typeInfo = inspectionTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.label : type;
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || inspection.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
          <h1 className="text-2xl font-bold text-secondary-900">Catálogo de Inspecciones</h1>
          <p className="text-secondary-600">Gestión de pruebas de calidad reutilizables</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Inspección
        </Button>
      </div>

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
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todos los tipos</option>
                {inspectionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Inspections Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="table-header">
                <th className="table-header-cell">Nombre</th>
                <th className="table-header-cell">Tipo</th>
                <th className="table-header-cell">Descripción</th>
                <th className="table-header-cell">Tolerancias</th>
                <th className="table-header-cell">Unidad</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredInspections.map((inspection) => (
                <tr key={inspection.id} className="table-row">
                  <td className="table-cell">
                    <div className="font-medium text-secondary-900">{inspection.name}</div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      {getTypeIcon(inspection.type)}
                      <span className="ml-2">{getTypeLabel(inspection.type)}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="max-w-xs truncate" title={inspection.description}>
                      {inspection.description}
                    </div>
                  </td>
                  <td className="table-cell">
                    {inspection.tolerance_min !== null && inspection.tolerance_max !== null ? (
                      <span className="text-sm">
                        {inspection.tolerance_min} - {inspection.tolerance_max}
                      </span>
                    ) : (
                      <span className="text-sm text-secondary-500">N/A</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {inspection.unit || (
                      <span className="text-sm text-secondary-500">N/A</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <StatusBadge status={inspection.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(inspection)}
                        className="text-primary-600 hover:text-primary-800"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inspection.id)}
                        className="text-danger-600 hover:text-danger-800"
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
          
          {filteredInspections.length === 0 && (
            <div className="text-center py-8 text-secondary-500">
              No se encontraron inspecciones
            </div>
          )}
        </div>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedInspection ? 'Editar Inspección' : 'Nueva Inspección'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Nombre de la Prueba *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Espesor de Recubrimiento"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tipo de Inspección *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                {inspectionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descripción detallada de la prueba..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Criterios de Aceptación *
            </label>
            <textarea
              value={formData.acceptance_criteria}
              onChange={(e) => setFormData({...formData, acceptance_criteria: e.target.value})}
              rows="2"
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Especificaciones que debe cumplir..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tolerancia Mínima
              </label>
              <Input
                type="number"
                step="any"
                value={formData.tolerance_min}
                onChange={(e) => setFormData({...formData, tolerance_min: e.target.value})}
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Tolerancia Máxima
              </label>
              <Input
                type="number"
                step="any"
                value={formData.tolerance_max}
                onChange={(e) => setFormData({...formData, tolerance_max: e.target.value})}
                placeholder="100.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Unidad de Medida
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Seleccionar...</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({...formData, observations: e.target.value})}
              rows="2"
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Notas adicionales para el inspector..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-secondary-700">
              Inspección activa
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-primary"
            >
              {selectedInspection ? 'Actualizar' : 'Crear'} Inspección
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InspectionCatalog;

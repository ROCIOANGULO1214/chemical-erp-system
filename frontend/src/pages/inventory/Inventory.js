import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  Eye,
  Edit,
  Download,
  RefreshCw
} from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';

const Inventory = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [consumption, setConsumption] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('materials');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [chemicalFilter, setChemicalFilter] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [rawMaterials, searchTerm, stockFilter, chemicalFilter]);

  const fetchData = async () => {
    try {
      const [materialsData, consumptionData, alertsData, kpisData] = await Promise.all([
        inventoryService.getRawMaterials(),
        inventoryService.getMaterialConsumption(),
        inventoryService.getInventoryAlerts(),
        inventoryService.getInventoryKPIs()
      ]);
      
      setRawMaterials(materialsData);
      setConsumption(consumptionData);
      setAlerts(alertsData);
      setKpis(kpisData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setLoading(false);
    }
  };

  const filterMaterials = () => {
    // La lógica de filtrado se implementaría aquí
    // Por ahora, mostramos todos los datos
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'CRITICAL':
        return 'text-danger-600 bg-danger-100';
      case 'LOW':
        return 'text-warning-600 bg-warning-100';
      case 'OVERSTOCK':
        return 'text-blue-600 bg-blue-100';
      case 'NORMAL':
        return 'text-success-600 bg-success-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getChemicalTypeIcon = (type) => {
    switch (type) {
      case 'acid':
        return '⚗️';
      case 'base':
        return '🧪';
      case 'salt':
        return '🧂';
      case 'solvent':
        return '💧';
      case 'additive':
        return '🔬';
      case 'water':
        return '💦';
      default:
        return '📦';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const handleViewMaterial = (material) => {
    setSelectedMaterial(material);
    setShowMaterialModal(true);
  };

  const renderKPIs = () => {
    if (!kpis) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Valor Total Inventario</p>
              <p className="text-2xl font-bold text-primary-600">{formatCurrency(kpis.total_inventory_value)}</p>
            </div>
            <Package className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Materiales Totales</p>
              <p className="text-2xl font-bold text-secondary-600">{kpis.total_materials}</p>
            </div>
            <Package className="w-8 h-8 text-secondary-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Stock Crítico</p>
              <p className="text-2xl font-bold text-danger-600">{kpis.critical_stock_items}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-danger-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Consumo 30 días</p>
              <p className="text-2xl font-bold text-warning-600">{formatCurrency(kpis.last_30_days_consumption_cost)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-warning-500" />
          </div>
        </Card>
      </div>
    );
  };

  const renderMaterialsTable = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="table-header">
              <th className="table-header-cell">Código</th>
              <th className="table-header-cell">Nombre</th>
              <th className="table-header-cell">Tipo</th>
              <th className="table-header-cell">Stock Actual</th>
              <th className="table-header-cell">Stock Mínimo</th>
              <th className="table-header-cell">Valor Total</th>
              <th className="table-header-cell">Estado</th>
              <th className="table-header-cell">Peligroso</th>
              <th className="table-header-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rawMaterials.map((material) => (
              <tr key={material.id} className="table-row">
                <td className="table-cell font-medium">{material.code}</td>
                <td className="table-cell">{material.name}</td>
                <td className="table-cell">
                  <div className="flex items-center">
                    <span className="mr-2">{getChemicalTypeIcon(material.chemical_type)}</span>
                    <span className="capitalize">{material.chemical_type}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center">
                    <span className={`font-medium ${
                      material.stock_status === 'CRITICAL' ? 'text-danger-600' :
                      material.stock_status === 'LOW' ? 'text-warning-600' :
                      material.stock_status === 'OVERSTOCK' ? 'text-blue-600' :
                      'text-success-600'
                    }`}>
                      {material.current_stock} {material.unit_of_measure}
                    </span>
                  </div>
                </td>
                <td className="table-cell">{material.minimum_stock} {material.unit_of_measure}</td>
                <td className="table-cell font-medium">{formatCurrency(material.total_value)}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(material.stock_status)}`}>
                    {material.stock_status}
                  </span>
                </td>
                <td className="table-cell">
                  {material.hazardous ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                      Sí
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      No
                    </span>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewMaterial(material)}
                      className="text-primary-600 hover:text-primary-800"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="text-secondary-600 hover:text-secondary-800"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {rawMaterials.length === 0 && (
          <div className="text-center py-8 text-secondary-500">
            No se encontraron materias primas
          </div>
        )}
      </div>
    </Card>
  );

  const renderConsumptionTable = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="table-header">
              <th className="table-header-cell">Fecha</th>
              <th className="table-header-cell">Material</th>
              <th className="table-header-cell">Cantidad Usada</th>
              <th className="table-header-cell">Costo Unitario</th>
              <th className="table-header-cell">Costo Total</th>
              <th className="table-header-cell">Orden Producción</th>
              <th className="table-header-cell">Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {consumption.map((record) => (
              <tr key={record.id} className="table-row">
                <td className="table-cell">
                  {format(new Date(record.recorded_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </td>
                <td className="table-cell">
                  <div>
                    <div className="font-medium">{record.material_name}</div>
                    <div className="text-sm text-secondary-500">{record.material_code}</div>
                  </div>
                </td>
                <td className="table-cell font-medium">
                  {record.quantity_used} {record.unit_of_measure}
                </td>
                <td className="table-cell">{formatCurrency(record.unit_cost)}</td>
                <td className="table-cell font-medium">
                  {formatCurrency(record.quantity_used * record.unit_cost)}
                </td>
                <td className="table-cell font-medium">{record.work_order_number}</td>
                <td className="table-cell">{record.recorded_by_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {consumption.length === 0 && (
          <div className="text-center py-8 text-secondary-500">
            No se encontraron registros de consumo
          </div>
        )}
      </div>
    </Card>
  );

  const renderAlerts = () => (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Card key={alert.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <AlertTriangle className={`w-5 h-5 mr-2 ${
                  alert.alert_type === 'CRITICAL' ? 'text-danger-600' :
                  alert.alert_type === 'LOW' ? 'text-warning-600' :
                  'text-blue-600'
                }`} />
                <h3 className="font-semibold text-secondary-900">{alert.name}</h3>
                <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(alert.alert_type)}`}>
                  {alert.alert_type}
                </span>
              </div>
              <p className="text-sm text-secondary-600 mb-2">{alert.alert_message}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-secondary-500">Código:</span>
                  <span className="ml-1 font-medium">{alert.code}</span>
                </div>
                <div>
                  <span className="text-secondary-500">Stock Actual:</span>
                  <span className="ml-1 font-medium">{alert.current_stock} {alert.unit_of_measure}</span>
                </div>
                <div>
                  <span className="text-secondary-500">Mínimo:</span>
                  <span className="ml-1 font-medium">{alert.minimum_stock} {alert.unit_of_measure}</span>
                </div>
                <div>
                  <span className="text-secondary-500">Máximo:</span>
                  <span className="ml-1 font-medium">{alert.maximum_stock ? `${alert.maximum_stock} ${alert.unit_of_measure}` : 'N/A'}</span>
                </div>
              </div>
            </div>
            {alert.hazardous && (
              <div className="ml-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                  ⚠️ Peligroso
                </span>
              </div>
            )}
          </div>
        </Card>
      ))}
      
      {alerts.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-success-600 mb-2">
            <CheckCircle className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-1">¡Todo en orden!</h3>
          <p className="text-secondary-600">No hay alertas de inventario activas</p>
        </Card>
      )}
    </div>
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
          <h1 className="text-2xl font-bold text-secondary-900">Inventario</h1>
          <p className="text-secondary-600">Control de materias primas químicas y consumo</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={fetchData}
            className="btn-secondary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button
            onClick={() => setShowConsumptionModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registrar Consumo
          </Button>
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
                  placeholder="Buscar por código, nombre o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos los estados</option>
                <option value="critical">Crítico</option>
                <option value="low">Bajo</option>
                <option value="normal">Normal</option>
                <option value="overstock">Sobrestock</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={chemicalFilter}
                onChange={(e) => setChemicalFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos los tipos</option>
                <option value="acid">Ácido</option>
                <option value="base">Base</option>
                <option value="salt">Sal</option>
                <option value="solvent">Disolvente</option>
                <option value="additive">Aditivo</option>
                <option value="water">Agua</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'materials', label: 'Materias Primas', count: rawMaterials.length },
            { id: 'consumption', label: 'Consumo', count: consumption.length },
            { id: 'alerts', label: 'Alertas', count: alerts.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-secondary-100 text-secondary-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'materials' && renderMaterialsTable()}
      {activeTab === 'consumption' && renderConsumptionTable()}
      {activeTab === 'alerts' && renderAlerts()}

      {/* Material Details Modal */}
      <Modal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        title={`Detalles de Material - ${selectedMaterial?.name}`}
        size="lg"
      >
        {selectedMaterial && (
          <div className="space-y-6">
            {/* Material Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Código
                </label>
                <p className="text-secondary-900 font-medium">{selectedMaterial.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Nombre
                </label>
                <p className="text-secondary-900">{selectedMaterial.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Tipo Químico
                </label>
                <div className="flex items-center">
                  <span className="mr-2">{getChemicalTypeIcon(selectedMaterial.chemical_type)}</span>
                  <span className="capitalize">{selectedMaterial.chemical_type}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Número CAS
                </label>
                <p className="text-secondary-900">{selectedMaterial.cas_number || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Proveedor
                </label>
                <p className="text-secondary-900">{selectedMaterial.supplier || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Unidad de Medida
                </label>
                <p className="text-secondary-900">{selectedMaterial.unit_of_measure}</p>
              </div>
            </div>

            {/* Stock Information */}
            <div className="bg-secondary-50 rounded-lg p-4">
              <h3 className="font-semibold text-secondary-900 mb-3">Información de Stock</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-secondary-600">Stock Actual</p>
                  <p className={`text-lg font-semibold ${
                    selectedMaterial.stock_status === 'CRITICAL' ? 'text-danger-600' :
                    selectedMaterial.stock_status === 'LOW' ? 'text-warning-600' :
                    selectedMaterial.stock_status === 'OVERSTOCK' ? 'text-blue-600' :
                    'text-success-600'
                  }`}>
                    {selectedMaterial.current_stock} {selectedMaterial.unit_of_measure}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Stock Mínimo</p>
                  <p className="text-lg font-semibold text-secondary-900">
                    {selectedMaterial.minimum_stock} {selectedMaterial.unit_of_measure}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Stock Máximo</p>
                  <p className="text-lg font-semibold text-secondary-900">
                    {selectedMaterial.maximum_stock || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Valor Total</p>
                  <p className="text-lg font-semibold text-primary-600">
                    {formatCurrency(selectedMaterial.total_value)}
                  </p>
                </div>
              </div>
            </div>

            {/* Safety Information */}
            {selectedMaterial.hazardous && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <h3 className="font-semibold text-danger-900 mb-2">⚠️ Información de Seguridad</h3>
                <p className="text-danger-800 text-sm mb-2">
                  Este material es considerado peligroso. Manipular con precaución y seguir los protocolos de seguridad establecidos.
                </p>
                {selectedMaterial.storage_requirements && (
                  <div>
                    <p className="text-sm font-medium text-danger-900 mb-1">Requisitos de Almacenamiento:</p>
                    <p className="text-danger-800 text-sm">{selectedMaterial.storage_requirements}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowMaterialModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </Button>
              <Button className="btn-primary">
                Editar Material
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;

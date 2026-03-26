import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Play, 
  Pause, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import productionService from '../../services/productionService';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';

const ProductionOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [productionLines, setProductionLines] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);

  useEffect(() => {
    fetchProductionOrders();
    fetchProductionLines();
    fetchCustomerOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchProductionOrders = async () => {
    try {
      const data = await productionService.getProductionOrders();
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching production orders:', error);
      setLoading(false);
    }
  };

  const fetchProductionLines = async () => {
    try {
      const data = await productionService.getProductionLines();
      setProductionLines(data);
    } catch (error) {
      console.error('Error fetching production lines:', error);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      // Simulado - debería venir de un servicio de clientes
      setCustomerOrders([]);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.work_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.batch_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-primary-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning-600" />;
      case 'on_hold':
        return <Pause className="w-4 h-4 text-warning-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-danger-600" />;
      default:
        return null;
    }
  };

  const calculateEfficiency = (planned, produced) => {
    if (!planned || planned === 0) return 0;
    return ((produced / planned) * 100).toFixed(1);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await productionService.updateProductionOrder(orderId, { status: newStatus });
      fetchProductionOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
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
          <h1 className="text-2xl font-bold text-secondary-900">Órdenes de Producción</h1>
          <p className="text-secondary-600">Gestión de órdenes de trabajo y procesos químicos</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Orden
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
                  placeholder="Buscar por número de orden, cliente o lote..."
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
                className="input"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completado</option>
                <option value="on_hold">En Pausa</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="table-header">
                <th className="table-header-cell">Orden</th>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Línea</th>
                <th className="table-header-cell">Lote</th>
                <th className="table-header-cell">Cantidad</th>
                <th className="table-header-cell">Eficiencia</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Fecha Inicio</th>
                <th className="table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="table-row">
                  <td className="table-cell font-medium">
                    {order.work_order_number}
                  </td>
                  <td className="table-cell">{order.customer_name}</td>
                  <td className="table-cell">{order.production_line_name}</td>
                  <td className="table-cell">{order.batch_number || '-'}</td>
                  <td className="table-cell">
                    <div className="text-sm">
                      <div>{order.quantity_produced || 0} / {order.quantity_planned}</div>
                      {order.quantity_scrap > 0 && (
                        <div className="text-danger-600 text-xs">
                          Scrap: {order.quantity_scrap}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <div className="w-16 bg-secondary-200 rounded-full h-2 mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(calculateEfficiency(order.quantity_planned, order.quantity_produced)) >= 95
                              ? 'bg-success-500'
                              : parseFloat(calculateEfficiency(order.quantity_planned, order.quantity_produced)) >= 80
                              ? 'bg-warning-500'
                              : 'bg-danger-500'
                          }`}
                          style={{
                            width: `${Math.min(100, calculateEfficiency(order.quantity_planned, order.quantity_produced))}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {calculateEfficiency(order.quantity_planned, order.quantity_produced)}%
                      </span>
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <StatusBadge status={order.status} className="ml-2" />
                    </div>
                  </td>
                  <td className="table-cell">
                    {order.start_date
                      ? format(new Date(order.start_date), 'dd/MM/yyyy HH:mm', { locale: es })
                      : '-'}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(order)}
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
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-secondary-500">
              No se encontraron órdenes de producción
            </div>
          )}
        </div>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={`Detalles de Orden - ${selectedOrder?.work_order_number}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Número de Orden
                </label>
                <p className="text-secondary-900 font-medium">{selectedOrder.work_order_number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Cliente
                </label>
                <p className="text-secondary-900">{selectedOrder.customer_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Línea de Producción
                </label>
                <p className="text-secondary-900">{selectedOrder.production_line_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Tipo de Proceso
                </label>
                <p className="text-secondary-900">{selectedOrder.process_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Operador
                </label>
                <p className="text-secondary-900">{selectedOrder.operator_name || 'No asignado'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Supervisor
                </label>
                <p className="text-secondary-900">{selectedOrder.supervisor_name || 'No asignado'}</p>
              </div>
            </div>

            {/* Production Metrics */}
            <div className="bg-secondary-50 rounded-lg p-4">
              <h3 className="font-semibold text-secondary-900 mb-3">Métricas de Producción</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-secondary-600">Cantidad Planificada</p>
                  <p className="text-lg font-semibold text-secondary-900">{selectedOrder.quantity_planned}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Cantidad Producida</p>
                  <p className="text-lg font-semibold text-success-600">{selectedOrder.quantity_produced || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Scrap</p>
                  <p className="text-lg font-semibold text-danger-600">{selectedOrder.quantity_scrap || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Eficiencia</p>
                  <p className="text-lg font-semibold text-primary-600">
                    {calculateEfficiency(selectedOrder.quantity_planned, selectedOrder.quantity_produced)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Notas
                </label>
                <p className="text-secondary-900 bg-secondary-50 rounded-lg p-3">
                  {selectedOrder.notes}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </Button>
              {selectedOrder.status === 'pending' && (
                <Button
                  onClick={() => handleStatusChange(selectedOrder.id, 'in_progress')}
                  className="btn-primary"
                >
                  Iniciar Producción
                </Button>
              )}
              {selectedOrder.status === 'in_progress' && (
                <Button
                  onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                  className="btn-success"
                >
                  Completar
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Orden de Producción"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Orden de Cliente
              </label>
              <select className="input">
                <option value="">Seleccionar orden de cliente</option>
                {customerOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.order_number} - {order.customer_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Línea de Producción
              </label>
              <select className="input">
                <option value="">Seleccionar línea</option>
                {productionLines.map((line) => (
                  <option key={line.id} value={line.id}>
                    {line.name} - {line.process_type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Número de Lote
              </label>
              <Input placeholder="Ej: BATCH-ZN-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Cantidad Planificada
              </label>
              <Input type="number" placeholder="0" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Notas
            </label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Notas adicionales sobre la orden de producción..."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => setShowCreateModal(false)}
              className="btn-primary"
            >
              Crear Orden
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductionOrders;

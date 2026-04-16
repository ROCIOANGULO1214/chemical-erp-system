import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle,
  XCircle,
  ArrowLeft,
  Paperclip,
  ClipboardCheck,
  Ban,
  Settings,
  Droplets,
  Sparkles,
  Thermometer,
  Timer,
  FlaskConical,
  Package,
  Factory,
  FileText,
  AlertTriangle
} from 'lucide-react';
import productionService from '../../services/productionService';
import productsService from '../../services/productsService';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';

// Función para calcular prioridad basada en la fecha promesa
const calculatePriority = (endDate, currentPriority) => {
  if (!endDate) return currentPriority || 'normal';
  
  const today = new Date();
  const deadline = new Date(endDate);
  const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  
  // Si faltan 3 días o menos: urgente
  if (diffDays <= 3 && diffDays >= 0) return 'urgente';
  // Si faltan 7 días o menos: alta
  if (diffDays <= 7 && diffDays > 3) return 'alta';
  // Si faltan 14 días o menos: media
  if (diffDays <= 14 && diffDays > 7) return 'media';
  // Más de 14 días: normal
  return 'normal';
};

// Componente para mostrar el badge de prioridad
const PriorityBadge = ({ priority }) => {
  const styles = {
    urgente: 'bg-red-100 text-red-700 border-red-300',
    alta: 'bg-orange-100 text-orange-700 border-orange-300',
    media: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    normal: 'bg-green-100 text-green-700 border-green-300'
  };
  
  const labels = {
    urgente: 'Urgente',
    alta: 'Alta',
    media: 'Media',
    normal: 'Normal'
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${styles[priority] || styles.normal}`}>
      {labels[priority] || 'Normal'}
    </span>
  );
};

const ProductionOrders = () => {
  const navigate = useNavigate();
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
  const [customers, setCustomers] = useState([]);
  const [orderFormData, setOrderFormData] = useState({
    customer_id: '',
    customer_code: '',
    order_number: '',
    generated_code: '',
    priority: 'normal',
    product_id: '',
    product_name: '',
    product_part_number: '',
    quantity: '',
    unit: 'Piezas',
    start_date: '',
    end_date: '',
    production_line_id: '',
    supervisor_id: '',
    operator_id: '',
    generated_by: '',
    notes: ''
  });
  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProductInfo, setSelectedProductInfo] = useState(null);
  const [subprocesses, setSubprocesses] = useState([]);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [executingOrder, setExecutingOrder] = useState(null);
  const [executionData, setExecutionData] = useState({
    actual_start: '',
    actual_end: '',
    quantity_produced: 0,
    quantity_scrap: 0,
    efficiency: 0,
    notes: ''
  });

  useEffect(() => {
    fetchProductionOrders();
    fetchProductionLines();
    fetchCustomerOrders();
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchProductionOrders = async () => {
    try {
      // Primero intentar cargar desde localStorage (órdenes creadas localmente)
      const savedOrders = localStorage.getItem('production_orders');
      if (savedOrders) {
        try {
          const parsedOrders = JSON.parse(savedOrders);
          if (parsedOrders && parsedOrders.length > 0) {
            setOrders(parsedOrders);
            setLoading(false);
            console.log('✅ Órdenes cargadas desde localStorage:', parsedOrders.length);
            return;
          }
        } catch (error) {
          console.error('Error parsing saved orders:', error);
        }
      }
      
      // Si no hay en localStorage, intentar desde Firebase
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

  const fetchCustomers = async () => {
    try {
      // Cargar desde localStorage (guardados en Customers.js)
      const savedCustomers = localStorage.getItem('customers');
      if (savedCustomers) {
        const parsed = JSON.parse(savedCustomers);
        setCustomers(parsed);
      } else {
        // Si no hay en localStorage, usar datos de ejemplo
        setCustomers([
          { id: '1', code: 'ML', name: 'Metalúrgica López' },
          { id: '2', code: 'QMC', name: 'Químicos del Centro' },
          { id: '3', code: 'IND', name: 'Industrias del Sur' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      // Cargar productos desde el servicio (base de datos)
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
      
      if (filteredProducts.length > 0) {
        setProducts(filteredProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  // Handler para búsqueda de productos
  const handleProductSearch = (e) => {
    const searchTerm = e.target.value;
    setProductSearchTerm(searchTerm);
    
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
      setShowProductDropdown(false);
      return;
    }
    
    // Filtrar productos que coincidan con el término de búsqueda
    const filtered = products.filter(product => 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredProducts(filtered);
    setShowProductDropdown(true);
  };

  // Handler para seleccionar producto
  const handleProductSelect = (product) => {
    setProductSearchTerm(product.name);
    setShowProductDropdown(false);
    setSelectedProductInfo(product);
    
    // Cargar subprocesos del proceso asignado al producto
    if (product.process_id) {
      const savedSubprocesses = localStorage.getItem('subprocesses');
      if (savedSubprocesses) {
        try {
          const allSubprocesses = JSON.parse(savedSubprocesses);
          const productSubprocesses = allSubprocesses
            .filter(sp => sp.process_id === product.process_id)
            .sort((a, b) => a.sequence_order - b.sequence_order);
          setSubprocesses(productSubprocesses);
          console.log('✅ Subprocesos cargados para el producto:', productSubprocesses);
        } catch (error) {
          console.error('❌ Error al cargar subprocesos:', error);
          setSubprocesses([]);
        }
      } else {
        setSubprocesses([]);
      }
    } else {
      setSubprocesses([]);
    }
    
    setOrderFormData(prev => ({
      ...prev,
      product_id: product.id,
      product_name: product.name,
      product_part_number: product.part_number,
      product_revision: product.revision || '',
      product_description: product.description || ''
    }));
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

  const handleOpenExecutionModal = (order) => {
    setExecutingOrder(order);
    setShowExecutionModal(true);
  };

  const handleCloseExecutionModal = () => {
    setShowExecutionModal(false);
    setExecutingOrder(null);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await productionService.updateProductionOrder(orderId, { status: newStatus });
      fetchProductionOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const selectedCustomer = customers.find(c => c.id === customerId);
    const customerCode = selectedCustomer?.code || '';
    
    const orderNumber = orderFormData.order_number;
    const generatedCode = customerCode && orderNumber ? `${customerCode}-${orderNumber}` : '';
    
    setOrderFormData(prev => ({
      ...prev,
      customer_id: customerId,
      customer_code: customerCode,
      generated_code: generatedCode
    }));
  };

  const handleOrderNumberChange = (e) => {
    const orderNumber = e.target.value;
    const customerCode = orderFormData.customer_code;
    const generatedCode = customerCode && orderNumber ? `${customerCode}-${orderNumber}` : '';
    
    setOrderFormData(prev => ({
      ...prev,
      order_number: orderNumber,
      generated_code: generatedCode
    }));
  };

  // Handler para crear una nueva orden de producción
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    try {
      // Validar campos requeridos
      if (!orderFormData.customer_id || !orderFormData.order_number || !orderFormData.product_id) {
        alert('Por favor completa los campos requeridos: Cliente, Número de Orden y Producto');
        return;
      }

      // Crear el objeto de orden
      const newOrder = {
        id: Date.now().toString(), // ID temporal
        order_number: orderFormData.generated_code || orderFormData.order_number,
        customer_id: orderFormData.customer_id,
        customer_name: customers.find(c => c.id === orderFormData.customer_id)?.name || '',
        product_id: orderFormData.product_id,
        product_name: orderFormData.product_name,
        product_part_number: orderFormData.product_part_number,
        product_revision: orderFormData.product_revision,
        product_description: orderFormData.product_description,
        quantity: parseInt(orderFormData.quantity) || 0,
        unit: orderFormData.unit,
        priority: orderFormData.priority,
        status: 'pending',
        start_date: orderFormData.start_date,
        end_date: orderFormData.end_date,
        generated_by: orderFormData.generated_by,
        supervisor_id: orderFormData.supervisor_id,
        operator_id: orderFormData.operator_id,
        notes: orderFormData.notes,
        created_at: new Date().toISOString()
      };

      console.log('✅ Nueva orden creada:', newOrder);

      // Agregar la orden a la lista
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      
      // Guardar en localStorage
      localStorage.setItem('production_orders', JSON.stringify(updatedOrders));
      console.log('✅ Orden guardada en localStorage');

      // Cerrar el modal y resetear el formulario
      setShowCreateModal(false);
      
      // Resetear el formulario
      setOrderFormData({
        customer_id: '',
        customer_code: '',
        order_number: '',
        generated_code: '',
        priority: 'normal',
        product_id: '',
        product_name: '',
        product_part_number: '',
        quantity: '',
        unit: 'Piezas',
        start_date: '',
        end_date: '',
        production_line_id: '',
        supervisor_id: '',
        operator_id: '',
        generated_by: '',
        notes: ''
      });
      setProductSearchTerm('');
      setSelectedProductInfo(null);
      setSubprocesses([]);

      alert('Orden de producción creada exitosamente');
      
    } catch (error) {
      console.error('❌ Error al crear orden:', error);
      alert('Error al crear la orden de producción');
    }
  };

  // ===== FUNCIONES DE EJECUCIÓN Y LIBERACIÓN =====

  // Liberar orden (cambiar de pendiente a liberada)
  const handleReleaseOrder = (order) => {
    const updatedOrder = {
      ...order,
      status: 'released',
      released_at: new Date().toISOString(),
      released_by: orderFormData.generated_by || 'Sistema'
    };
    
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === order.id ? updatedOrder : o)
    );
    
    console.log('✅ Orden liberada:', updatedOrder);
    alert(`Orden ${order.order_number} liberada exitosamente`);
  };

  // Iniciar ejecución de orden
  const handleStartExecution = (order) => {
    const updatedOrder = {
      ...order,
      status: 'in_progress',
      actual_start: new Date().toISOString(),
      started_by: orderFormData.generated_by || 'Sistema'
    };
    
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === order.id ? updatedOrder : o)
    );
    
    setExecutingOrder(updatedOrder);
    setShowExecutionModal(true);
    
    console.log('▶️ Ejecución iniciada:', updatedOrder);
    alert(`Orden ${order.order_number} iniciada`);
  };

  // Pausar orden
  const handlePauseOrder = (order) => {
    const updatedOrder = {
      ...order,
      status: 'on_hold',
      paused_at: new Date().toISOString(),
      pause_reason: 'Pausa manual'
    };
    
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === order.id ? updatedOrder : o)
    );
    
    console.log('⏸️ Orden pausada:', updatedOrder);
    alert(`Orden ${order.order_number} pausada`);
  };

  // Reanudar orden
  const handleResumeOrder = (order) => {
    const updatedOrder = {
      ...order,
      status: 'in_progress',
      resumed_at: new Date().toISOString()
    };
    
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === order.id ? updatedOrder : o)
    );
    
    console.log('▶️ Orden reanudada:', updatedOrder);
    alert(`Orden ${order.order_number} reanudada`);
  };

  // Completar orden
  const handleCompleteOrder = (order) => {
    const actualEnd = new Date().toISOString();
    const actualStart = order.actual_start ? new Date(order.actual_start) : new Date(order.start_date);
    const end = new Date(actualEnd);
    
    // Calcular eficiencia basada en tiempo planificado vs real
    const plannedHours = order.quantity / 10; // Asumiendo 10 piezas/hora
    const actualHours = (end - actualStart) / (1000 * 60 * 60);
    const efficiency = Math.round((plannedHours / actualHours) * 100);
    
    const updatedOrder = {
      ...order,
      status: 'completed',
      actual_end: actualEnd,
      quantity_produced: order.quantity,
      efficiency: Math.min(100, efficiency),
      completed_by: orderFormData.generated_by || 'Sistema'
    };
    
    setOrders(prevOrders => 
      prevOrders.map(o => o.id === order.id ? updatedOrder : o)
    );
    
    setShowExecutionModal(false);
    setExecutingOrder(null);
    
    console.log('✅ Orden completada:', updatedOrder);
    alert(`Orden ${order.order_number} completada con eficiencia del ${efficiency}%`);
  };

  // Cancelar orden
  const handleCancelOrder = (order) => {
    if (window.confirm(`¿Estás seguro de cancelar la orden ${order.order_number}?`)) {
      const updatedOrder = {
        ...order,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: orderFormData.generated_by || 'Sistema'
      };
      
      setOrders(prevOrders => 
        prevOrders.map(o => o.id === order.id ? updatedOrder : o)
      );
      
      console.log('❌ Orden cancelada:', updatedOrder);
      alert(`Orden ${order.order_number} cancelada`);
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
              <tr className="table-header bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="table-header-cell w-28 text-center py-3">Código Orden</th>
                <th className="table-header-cell w-48 py-3">Cliente</th>
                <th className="table-header-cell py-3">Producto</th>
                <th className="table-header-cell w-28 text-center py-3">Cantidad</th>
                <th className="table-header-cell w-32 text-center py-3">Fecha Inicio</th>
                <th className="table-header-cell w-32 text-center py-3">Fecha Promesa</th>
                <th className="table-header-cell w-28 text-center py-3">Estado</th>
                <th className="table-header-cell w-24 text-center py-3">Prioridad</th>
                <th className="table-header-cell w-24 text-center py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className="table-row hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
                  onClick={() => handleOpenExecutionModal(order)}
                >
                  <td className="table-cell text-center py-3 px-2">
                    <span className="inline-flex items-center justify-center bg-primary-100 text-primary-700 font-semibold px-2 py-1 rounded text-sm">
                      {order.order_number || order.work_order_number}
                    </span>
                  </td>
                  <td className="table-cell text-left py-3 px-2">
                    <div className="font-medium text-gray-900 truncate" title={order.customer_name}>
                      {order.customer_name}
                    </div>
                  </td>
                  <td className="table-cell text-left py-3 px-2">
                    <div className="font-medium text-gray-700 truncate" title={order.product_name}>
                      {order.product_name || '-'}
                    </div>
                  </td>
                  <td className="table-cell text-center py-3 px-2">
                    <span className="text-sm font-medium text-gray-700">
                      {order.quantity} <span className="text-gray-500 text-xs">{order.unit}</span>
                    </span>
                  </td>
                  <td className="table-cell text-center py-3 px-2">
                    <span className="text-sm text-gray-600">
                      {order.start_date
                        ? format(new Date(order.start_date), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </span>
                  </td>
                  <td className="table-cell text-center py-3 px-2">
                    <span className="text-sm text-gray-600">
                      {order.end_date
                        ? format(new Date(order.end_date), 'dd/MM/yyyy', { locale: es })
                        : '-'}
                    </span>
                  </td>
                  <td className="table-cell text-center py-3 px-2">
                    <div className="flex items-center justify-center">
                      {getStatusIcon(order.status)}
                      <StatusBadge status={order.status} className="ml-2" />
                    </div>
                  </td>
                  <td className="table-cell text-center py-3 px-2">
                    <PriorityBadge priority={calculatePriority(order.end_date, order.priority)} />
                  </td>
                  <td className="table-cell text-center py-3 px-2">
                    <div className="flex items-center justify-center space-x-1">
                      {/* Ver detalles - siempre visible */}
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-primary-600 hover:text-primary-800 hover:bg-primary-100 p-1.5 rounded-full transition-all"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Liberar - solo pendiente */}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleReleaseOrder(order)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-100 p-1.5 rounded-full transition-all"
                          title="Liberar orden"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Iniciar - liberada o reanudar */}
                      {(order.status === 'released' || order.status === 'pending') && (
                        <button
                          onClick={() => handleStartExecution(order)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1.5 rounded-full transition-all"
                          title="Iniciar producción"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Pausar - solo en progreso */}
                      {order.status === 'in_progress' && (
                        <button
                          onClick={() => handlePauseOrder(order)}
                          className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 p-1.5 rounded-full transition-all"
                          title="Pausar"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Reanudar - solo en pausa */}
                      {order.status === 'on_hold' && (
                        <button
                          onClick={() => handleResumeOrder(order)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1.5 rounded-full transition-all"
                          title="Reanudar"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Completar - en progreso o pausa */}
                      {(order.status === 'in_progress' || order.status === 'on_hold') && (
                        <button
                          onClick={() => handleCompleteOrder(order)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-100 p-1.5 rounded-full transition-all"
                          title="Completar"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Cancelar - no completada ni cancelada */}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelOrder(order)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1.5 rounded-full transition-all"
                          title="Cancelar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
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

      {/* Create Order Modal - NUEVO FORMULARIO */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nueva Orden de Producción"
        size="xl"
      >
        <form className="space-y-6" onSubmit={handleCreateOrder}>
          {/* Sección 1: Información General */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Cliente *
                </label>
                <select 
                  className="input w-full" 
                  required
                  value={orderFormData.customer_id || ''}
                  onChange={handleCustomerChange}
                >
                  <option value="">Seleccionar cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.code ? `[${customer.code}] ` : ''}{customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Número de Orden *
                </label>
                <Input 
                  placeholder="Ej: 0001" 
                  required
                  value={orderFormData.order_number || ''}
                  onChange={handleOrderNumberChange}
                  maxLength="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Prioridad
                </label>
                <select 
                  className="input w-full"
                  value={orderFormData.priority || 'normal'}
                  onChange={(e) => setOrderFormData(prev => ({...prev, priority: e.target.value}))}
                >
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
            
            {/* Código Generado */}
            {orderFormData.generated_code && (
              <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  Código de Orden Generado:
                </label>
                <div className="text-2xl font-bold text-primary-900">
                  {orderFormData.generated_code}
                </div>
                <p className="text-xs text-primary-600 mt-1">
                  Este código se usará para identificar la orden de producción
                </p>
              </div>
            )}
          </div>

          {/* Sección 2: Programación */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Programación</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Fecha de Inicio
                </label>
                <Input 
                  type="date" 
                  value={orderFormData.start_date || ''}
                  onChange={(e) => setOrderFormData(prev => ({...prev, start_date: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Fecha de Entrega
                </label>
                <Input 
                  type="date" 
                  value={orderFormData.end_date || ''}
                  onChange={(e) => setOrderFormData(prev => ({...prev, end_date: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Generado Por
                </label>
                <Input 
                  type="text" 
                  placeholder="Nombre del usuario"
                  value={orderFormData.generated_by || ''}
                  onChange={(e) => setOrderFormData(prev => ({...prev, generated_by: e.target.value}))}
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Producto y Cantidad */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Producto a Fabricar</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Producto *
                </label>
                <Input 
                  type="text"
                  placeholder="Escribe para buscar producto..."
                  required
                  value={productSearchTerm || ''}
                  onChange={handleProductSearch}
                  onFocus={() => productSearchTerm && setShowProductDropdown(true)}
                />
                
                {/* Dropdown de productos filtrados */}
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="font-medium text-gray-900">
                          {product.part_number && <span className="text-blue-600 mr-2">[{product.part_number}]</span>}
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-500 mt-1">{product.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Mensaje si no hay resultados */}
                {showProductDropdown && productSearchTerm && filteredProducts.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-gray-500">
                    No se encontraron productos que coincidan con "{productSearchTerm}"
                  </div>
                )}
                
                {/* Producto seleccionado */}
                {orderFormData.product_id && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <span className="font-medium">Seleccionado:</span> {orderFormData.product_part_number && `[${orderFormData.product_part_number}] `}{orderFormData.product_name}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Cantidad *
                </label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  required
                  value={orderFormData.quantity || ''}
                  onChange={(e) => setOrderFormData(prev => ({...prev, quantity: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Unidad
                </label>
                <select 
                  className="input w-full"
                  value={orderFormData.unit || 'Piezas'}
                  onChange={(e) => setOrderFormData(prev => ({...prev, unit: e.target.value}))}
                >
                  <option value="Piezas">Piezas</option>
                  <option value="Cajas">Cajas</option>
                  <option value="Totes">Totes</option>
                  <option value="Lb">Lb</option>
                  <option value="Kg">Kg</option>
                </select>
              </div>
            </div>
          </div>

          {/* Información del Producto Seleccionado */}
          {selectedProductInfo && (
            <div className="border-b pb-4 mt-4 bg-blue-50 p-4 rounded-lg">
              <h4 className="text-md font-semibold text-secondary-900 mb-3">Información del Producto</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Número de Parte
                  </label>
                  <p className="text-secondary-900 font-medium">{selectedProductInfo.part_number || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">
                    Revisión
                  </label>
                  <p className="text-secondary-900 font-medium">{selectedProductInfo.revision || 'N/A'}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Descripción
                </label>
                <p className="text-secondary-900">{selectedProductInfo.description || 'Sin descripción'}</p>
              </div>
              
              {/* Inspecciones de Calidad */}
              {selectedProductInfo.quality_inspections && selectedProductInfo.quality_inspections.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Inspecciones de Calidad Requeridas ({selectedProductInfo.quality_inspections.length})
                  </label>
                  <div className="space-y-2">
                    {selectedProductInfo.quality_inspections.map((inspection, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-secondary-900">{inspection.inspection_name}</span>
                            <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              {inspection.inspection_type}
                            </span>
                          </div>
                          <span className="text-xs text-secondary-500">
                            {inspection.inspection_method === '100%' ? '100%' : 
                             inspection.inspection_method === 'muestreo' ? `Muestreo (${inspection.sampling_quantity})` :
                             `AQL ${inspection.aql_percentage}%`}
                          </span>
                        </div>
                        {inspection.tolerance_min && inspection.tolerance_max && (
                          <div className="text-xs text-secondary-600 mt-1">
                            Tolerancia: {inspection.tolerance_min} - {inspection.tolerance_max} {inspection.unit}
                          </div>
                        )}
                        {inspection.is_required && (
                          <div className="text-xs text-red-600 mt-1">* Requerida</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(!selectedProductInfo.quality_inspections || selectedProductInfo.quality_inspections.length === 0) && (
                <div className="text-sm text-secondary-500 italic">
                  No hay inspecciones de calidad configuradas para este producto.
                </div>
              )}
              
              {/* Proceso del Producto */}
              {selectedProductInfo.process_name && (
                <div className="mt-6 pt-4 border-t border-blue-200">
                  <label className="block text-sm font-medium text-secondary-700 mb-3">
                    Proceso de Fabricación: <span className="text-secondary-900 font-semibold">{selectedProductInfo.process_name}</span>
                  </label>
                  
                  {/* Diagrama de Flujo con Subprocesos Reales */}
                  <div className="flex items-center justify-start overflow-x-auto pb-4">
                    {subprocesses.length > 0 ? (
                      // Mostrar subprocesos reales del proceso
                      subprocesses.map((subprocess, index) => (
                        <React.Fragment key={subprocess.id}>
                          {/* Subproceso */}
                          <div className="flex flex-col items-center min-w-[120px]">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                              index === 0 ? 'bg-blue-500' :
                              index === subprocesses.length - 1 ? 'bg-orange-500' :
                              index % 2 === 0 ? 'bg-green-500' : 'bg-purple-500'
                            }`}>
                              {subprocess.sequence_order}
                            </div>
                            <span className="mt-2 text-xs text-center font-medium text-secondary-700 max-w-[100px] truncate">
                              {subprocess.name}
                            </span>
                            <span className="text-xs text-secondary-500">
                              {subprocess.estimated_time} {subprocess.time_unit}
                            </span>
                          </div>
                          
                          {/* Flecha entre subprocesos (excepto después del último) */}
                          {index < subprocesses.length - 1 && (
                            <div className="flex items-center px-2">
                              <div className="w-8 h-0.5 bg-blue-300"></div>
                              <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-blue-300"></div>
                            </div>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      // Si no hay subprocesos, mostrar el proceso principal
                      <div className="flex flex-col items-center min-w-[120px]">
                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          1
                        </div>
                        <span className="mt-2 text-xs text-center font-medium text-secondary-700">
                          {selectedProductInfo.process_name}
                        </span>
                        <span className="text-xs text-secondary-500">Proceso Principal</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {!selectedProductInfo.process_name && (
                <div className="mt-4 text-sm text-secondary-500 italic">
                  No hay proceso configurado para este producto.
                </div>
              )}
            </div>
          )}

          {/* Sección 4: Asignación */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Asignación de Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Supervisor
                </label>
                <select 
                  className="input w-full"
                  value={orderFormData.supervisor_id || ''}
                  onChange={(e) => setOrderFormData(prev => ({...prev, supervisor_id: e.target.value}))}
                >
                  <option value="">Seleccionar supervisor</option>
                  <option value="sup1">Juan Pérez</option>
                  <option value="sup2">María García</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Operador Principal
                </label>
                <select 
                  className="input w-full"
                  value={orderFormData.operator_id || ''}
                  onChange={(e) => setOrderFormData(prev => ({...prev, operator_id: e.target.value}))}
                >
                  <option value="">Seleccionar operador</option>
                  <option value="op1">Carlos López</option>
                  <option value="op2">Ana Martínez</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Especificaciones y Notas */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Especificaciones y Notas</h3>
            <div>
              <textarea
                className="input w-full min-h-[120px]"
                placeholder="Especificaciones técnicas, instrucciones especiales, requisitos de calidad, etc."
                value={orderFormData.notes || ''}
                onChange={(e) => setOrderFormData(prev => ({...prev, notes: e.target.value}))}
              ></textarea>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Orden de Producción
            </Button>
          </div>
        </form>
      </Modal>

      {/* Execution Modal - Panel de Ejecución Visual */}
      <Modal
        isOpen={showExecutionModal}
        onClose={handleCloseExecutionModal}
        title={``}
        size="xl"
      >
        {executingOrder && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Orden {executingOrder.order_number || executingOrder.work_order_number}
                </h2>
                <p className="text-gray-500">{executingOrder.product_name}</p>
              </div>
              <div className="flex gap-2">
                <Button className="btn-secondary text-sm">
                  <Paperclip className="w-4 h-4 mr-1" />
                  Adjuntos
                </Button>
                <Button className="btn-primary text-sm">
                  <ClipboardCheck className="w-4 h-4 mr-1" />
                  Inspección AQL
                </Button>
                <Button className="btn-danger text-sm">
                  <Ban className="w-4 h-4 mr-1" />
                  Cancelar Orden
                </Button>
              </div>
            </div>

            {/* Tres Columnas de Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Info de la Orden */}
              <Card className="border-t-4 border-t-blue-500">
                <div className="bg-blue-50 px-3 py-2 -mx-4 -mt-4 mb-3 border-b rounded-t">
                  <h3 className="font-semibold text-blue-800 text-sm">Información de la orden</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha promesa:</span>
                    <span className="font-medium">{executingOrder.end_date || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cliente:</span>
                    <span className="font-medium text-blue-600">{executingOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Prioridad:</span>
                    <PriorityBadge priority={calculatePriority(executingOrder.end_date, executingOrder.priority)} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Generado por:</span>
                    <span className="font-medium">{executingOrder.generated_by || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha de creación:</span>
                    <span className="font-medium">
                      {executingOrder.start_date 
                        ? format(new Date(executingOrder.start_date), 'dd/MM/yyyy', { locale: es })
                        : executingOrder.created_at || executingOrder.createdAt 
                          ? format(new Date(executingOrder.created_at || executingOrder.createdAt), 'dd/MM/yyyy', { locale: es })
                          : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estatus:</span>
                    <StatusBadge status={executingOrder.status} className="text-xs" />
                  </div>
                </div>
              </Card>

              {/* Info de la Pieza */}
              <Card className="border-t-4 border-t-blue-500">
                <div className="bg-blue-50 px-3 py-2 -mx-4 -mt-4 mb-3 border-b rounded-t">
                  <h3 className="font-semibold text-blue-800 text-sm">Información de la pieza</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cantidad:</span>
                    <span className="font-medium">{executingOrder.quantity} {executingOrder.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">No. de Parte:</span>
                    <span className="font-medium">{executingOrder.product_part_number || executingOrder.part_number || executingOrder.product?.part_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Revisión:</span>
                    <span className="font-medium">{executingOrder.product_revision || executingOrder.revision || executingOrder.product?.revision || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Descripción:</span>
                    <span className="font-medium text-right flex-1 ml-2">{executingOrder.product_description || executingOrder.description || executingOrder.product?.description || executingOrder.product_name}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progreso:</span>
                    <span className="font-medium">0 / 8</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                </div>
              </Card>

              {/* Especificación */}
              <Card className="border-t-4 border-t-blue-500">
                <div className="bg-blue-500 px-3 py-2 -mx-4 -mt-4 mb-3 text-white rounded-t">
                  <h3 className="font-semibold text-sm">No. de Parte: {executingOrder.product_part_number || 'N/A'}</h3>
                </div>
                <div className="aspect-square bg-gray-100 rounded flex items-center justify-center mb-3">
                  <div className="text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-1" />
                    <p className="text-xs">Sin especificación</p>
                  </div>
                </div>
                <Button className="w-full btn-primary text-sm">
                  <Paperclip className="w-4 h-4 mr-1" />
                  Especificación de Pieza
                </Button>
              </Card>
            </div>

            {/* Flujo de Proceso */}
            <Card>
              <div className="bg-blue-500 px-4 py-2 -mx-4 -mt-4 mb-4 text-white rounded-t">
                <div className="flex items-center gap-2">
                  <Factory className="w-5 h-5" />
                  <h3 className="font-semibold">Flujo de Proceso</h3>
                </div>
              </div>
              
              {/* Timeline visual */}
              <div className="relative">
                <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 mx-8"></div>
                <div className="grid grid-cols-8 gap-2 relative z-10">
                  {['Insp. Recibo', 'Desengrase', 'Activación', 'Desoxidante', 'Anodizado', 'Inspección', 'Inspección Final', 'Liberación'].map((step, index) => (
                    <div key={index} className="text-center">
                      <div className={`
                        w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-1
                        border-2 text-xs font-bold
                        ${index < 7 ? 'bg-green-500 border-green-500 text-white' : 'bg-yellow-400 border-yellow-400 text-white'}
                      `}>
                        {index < 7 ? <CheckCircle className="w-6 h-6" /> : index + 1}
                      </div>
                      <p className="text-xs font-medium leading-tight">{step}</p>
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded-full
                        ${index < 7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                      `}>
                        {index < 7 ? 'Completado' : 'En proceso'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Botones */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                onClick={handleCloseExecutionModal}
                className="btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="space-x-2">
                {executingOrder.status === 'in_progress' && (
                  <Button onClick={() => handlePauseOrder(executingOrder)} className="btn-warning">
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </Button>
                )}
                {executingOrder.status === 'on_hold' && (
                  <Button onClick={() => handleResumeOrder(executingOrder)} className="btn-primary">
                    <Play className="w-4 h-4 mr-2" />
                    Reanudar
                  </Button>
                )}
                <Button onClick={() => handleCompleteOrder(executingOrder)} className="btn-success">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completar Orden
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductionOrders;

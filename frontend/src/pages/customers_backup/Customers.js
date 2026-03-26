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
  Users,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle,
  AlertTriangle,
  Lock
} from 'lucide-react';
import customersService from '../../services/customersService';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';

// Simulación de usuario actual (en producción vendría del contexto de autenticación)
const currentUser = {
  role: 'admin', // Cambiar a 'operator', 'quality', etc. para probar restricciones
  name: 'Administrador'
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Verificar permisos de acceso
  const hasAccess = () => {
    const allowedRoles = ['admin', 'supervisor', 'planning'];
    return allowedRoles.includes(currentUser.role);
  };

  const canEdit = () => {
    const allowedRoles = ['admin', 'supervisor', 'planning'];
    return allowedRoles.includes(currentUser.role);
  };

  useEffect(() => {
    if (!hasAccess()) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }
    
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const customersData = await customersService.getCustomers();
      setCustomers(customersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setLoading(false);
    }
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
  };

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contact_name: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    is_active: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmitCustomer = async () => {
    try {
      if (selectedCustomer) {
        // Actualizar cliente existente
        const updatedCustomer = await customersService.updateCustomer(selectedCustomer.id, formData);
        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCustomer : c));
      } else {
        // Crear nuevo cliente
        const newCustomer = await customersService.createCustomer({
          ...formData,
          id: `c-${Date.now()}`,
          total_orders: 0,
          last_order_date: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });
        setCustomers(prev => [...prev, newCustomer]);
      }
      
      setShowCustomerForm(false);
      setSelectedCustomer(null);
      setFormData({
        code: '',
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        is_active: true
      });
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Error al guardar el cliente');
    }
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      code: customer.code,
      name: customer.name,
      contact_name: customer.contact_name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      tax_id: customer.tax_id,
      is_active: customer.is_active
    });
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = async (customer) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente ${customer.name}?`)) {
      try {
        await customersService.deleteCustomer(customer.id);
        setCustomers(prev => prev.filter(c => c.id !== customer.id));
        alert('Cliente eliminado exitosamente');
      } catch (error) {
        console.error('Error deleting customer:', error);
        alert('Error al eliminar el cliente');
      }
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pantalla de acceso denegado
  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center max-w-md">
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600 mb-4">
            Esta sección solo está disponible para administradores y personal de planificación.
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
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">
            Gestión de clientes y contactos - Acceso: {currentUser.role}
          </p>
        </div>
        {canEdit() && (
          <Button
            onClick={() => setShowCustomerForm(true)}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.is_active).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-red-600">
                {customers.filter(c => !c.is_active).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Órdenes</p>
              <p className="text-2xl font-bold text-purple-600">
                {customers.reduce((sum, c) => sum + c.total_orders, 0)}
              </p>
            </div>
            <Building className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, código o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Órdenes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {customer.tax_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {customer.contact_name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge
                      status={customer.is_active ? 'active' : 'inactive'}
                      text={customer.is_active ? 'Activo' : 'Inactivo'}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      <div className="font-medium">{customer.total_orders}</div>
                      <div className="text-xs">
                        {format(new Date(customer.last_order_date), 'dd/MM/yyyy', { locale: es })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit() && (
                        <>
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="text-green-600 hover:text-green-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron clientes
            </div>
          )}
        </div>
      </Card>

      {/* Customer Details Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title={`Detalles del Cliente - ${selectedCustomer?.name}`}
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <p className="text-gray-900 font-medium">{selectedCustomer.code}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFC/Tax ID
                </label>
                <p className="text-gray-900">{selectedCustomer.tax_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contacto
                </label>
                <p className="text-gray-900">{selectedCustomer.contact_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{selectedCustomer.phone}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <p className="text-gray-900">{selectedCustomer.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <StatusBadge
                  status={selectedCustomer.is_active ? 'active' : 'inactive'}
                  text={selectedCustomer.is_active ? 'Activo' : 'Inactivo'}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-1" />
                <p className="text-gray-900 bg-gray-50 rounded-lg p-3 flex-1">
                  {selectedCustomer.address}
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Total Órdenes</p>
                <p className="text-2xl font-bold text-blue-900">{selectedCustomer.total_orders}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Última Orden</p>
                <p className="text-lg font-bold text-green-900">
                  {format(new Date(selectedCustomer.last_order_date), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">Cliente Desde</p>
                <p className="text-lg font-bold text-purple-900">
                  {format(new Date(selectedCustomer.created_at), 'dd/MM/yyyy', { locale: es })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowCustomerModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </Button>
              {canEdit() && (
                <Button className="btn-primary">
                  Editar Cliente
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Customer Form Modal */}
      <Modal
        isOpen={showCustomerForm}
        onClose={() => setShowCustomerForm(false)}
        title={selectedCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                placeholder="Ej: C001" 
                value={formData.code}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RFC/Tax ID
              </label>
              <Input 
                name="tax_id"
                placeholder="Ej: RFC123456ABC" 
                value={formData.tax_id}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Cliente
              </label>
              <Input 
                name="name"
                placeholder="Nombre completo" 
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contacto
              </label>
              <Input 
                name="contact_name"
                placeholder="Nombre del contacto" 
                value={formData.contact_name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <Input 
                name="phone"
                placeholder="555-0101" 
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input 
                name="email"
                type="email" 
                placeholder="email@ejemplo.com" 
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              name="address"
              placeholder="Dirección completa"
              className="input"
              rows={3}
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              className="mr-2"
              checked={formData.is_active}
              onChange={handleInputChange}
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Cliente activo
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => {
                setShowCustomerForm(false);
                setSelectedCustomer(null);
                setFormData({
                  code: '',
                  name: '',
                  contact_name: '',
                  email: '',
                  phone: '',
                  address: '',
                  tax_id: '',
                  is_active: true
                });
              }}
              className="btn-secondary"
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitCustomer} className="btn-primary">
              {selectedCustomer ? 'Actualizar Cliente' : 'Crear Cliente'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;

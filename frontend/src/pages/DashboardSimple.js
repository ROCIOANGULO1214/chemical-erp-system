import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const DashboardSimple = () => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentAnalyses, setRecentAnalyses] = useState([]);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setKpis({
        totalOrders: 12,
        completedOrders: 8,
        pendingOrders: 4,
        totalAnalyses: 48,
        complianceRate: 96.5,
        outOfSpecAnalyses: 2,
        lowStockItems: 3,
        criticalStockItems: 1
      });
      
      setRecentOrders([
        {
          id: 1,
          work_order_number: 'WO-2024-03-0001',
          customer_name: 'Automotriz del Norte S.A.',
          process_type: 'Zinc Plating',
          quantity_planned: 500,
          quantity_produced: 480,
          status: 'completed'
        },
        {
          id: 2,
          work_order_number: 'WO-2024-03-0002',
          customer_name: 'Componentes Aeroespaciales Ltd.',
          process_type: 'Anodizado',
          quantity_planned: 200,
          quantity_produced: 150,
          status: 'in_progress'
        },
        {
          id: 3,
          work_order_number: 'WO-2024-03-0003',
          customer_name: 'Electrodomésticos del Centro',
          process_type: 'Cromatizado',
          quantity_planned: 1000,
          quantity_produced: 0,
          status: 'pending'
        }
      ]);
      
      setRecentAnalyses([
        {
          id: 1,
          analysis_number: 'AN-2024-00001',
          bath_name: 'Baño de Zinc',
          analysis_type: 'Concentración',
          analysis_date: new Date(),
          is_within_specification: true,
          analyst_name: 'Carlos López'
        },
        {
          id: 2,
          analysis_number: 'AN-2024-00002',
          bath_name: 'Ácido Sulfúrico',
          analysis_type: 'pH',
          analysis_date: new Date(),
          is_within_specification: false,
          analyst_name: 'María García'
        },
        {
          id: 3,
          analysis_number: 'AN-2024-00003',
          bath_name: 'Cromato',
          analysis_type: 'Contaminación',
          analysis_date: new Date(),
          is_within_specification: true,
          analyst_name: 'Juan Martínez'
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, []);

  const getKpiCard = (title, value, icon, trend, color = 'blue') => {
    const Icon = icon;
    const isPositive = trend > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {value}
            </p>
            {trend !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendIcon className="w-4 h-4 mr-1" />
                {Math.abs(trend)}%
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg bg-${color}-100 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completado', classes: 'bg-green-100 text-green-800' },
      in_progress: { label: 'En Progreso', classes: 'bg-yellow-100 text-yellow-800' },
      pending: { label: 'Pendiente', classes: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.classes}`}>
        {config.label}
      </span>
    );
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Bienvenido, Administrador. Aquí está el resumen de tu sistema ERP químico industrial.
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getKpiCard('Órdenes Activas', kpis?.pendingOrders || 0, ClipboardList, 15, 'blue')}
        {getKpiCard('Análisis Completados', kpis?.totalAnalyses || 0, Activity, 8, 'green')}
        {getKpiCard('Tasa Cumplimiento', `${kpis?.complianceRate || 0}%`, CheckCircle, 5, 'emerald')}
        {getKpiCard('Alertas Clientes', kpis?.lowStockItems || 0, AlertTriangle, -3, 'red')}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Production Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Órdenes de Producción Recientes</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver todas</button>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.work_order_number}</p>
                      <p className="text-xs text-gray-500">{order.customer_name} - {order.process_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <p className="text-xs text-gray-500 mt-1">{order.quantity_produced}/{order.quantity_planned} unidades</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Clientes Recientes</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver todos</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Automotriz del Norte S.A.</p>
                    <p className="text-xs text-gray-500">C001 - Carlos Rodríguez</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="status-badge status-completed">Activo</span>
                  <p className="text-xs text-gray-500 mt-1">25 órdenes</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Componentes Aeroespaciales Ltd.</p>
                    <p className="text-xs text-gray-500">C002 - María González</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="status-badge status-completed">Activo</span>
                  <p className="text-xs text-gray-500 mt-1">18 órdenes</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Electrodomésticos del Centro</p>
                    <p className="text-xs text-gray-500">C003 - Juan Pérez</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="status-badge status-completed">Activo</span>
                  <p className="text-xs text-gray-500 mt-1">32 órdenes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition-colors">
              <ClipboardList className="w-5 h-5 mr-2" />
              Nueva Orden
            </button>
            <button className="flex items-center justify-center p-3 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium transition-colors">
              <Activity className="w-5 h-5 mr-2" />
              Nuevo Análisis
            </button>
            <button className="flex items-center justify-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium transition-colors">
              <Users className="w-5 h-5 mr-2" />
              Nuevo Cliente
            </button>
            <button className="flex items-center justify-center p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-700 font-medium transition-colors">
              <BarChart3 className="w-5 h-5 mr-2" />
              Generar Reporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSimple;

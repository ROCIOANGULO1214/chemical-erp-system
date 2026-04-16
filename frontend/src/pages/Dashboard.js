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
  Clock,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import inventoryService from '../../services/inventoryService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';

const Dashboard = () => {
  const { user, hasPermission } = useAuth();
  const { showSuccess, showError } = useLayout();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Parallel data fetching
      const [
        inventoryKpis,
        inventoryAlertsData
      ] = await Promise.all([
        hasPermission('inventory') ? inventoryService.getInventoryKPIs(dateRange) : Promise.resolve(null),
        hasPermission('inventory') ? inventoryService.getInventoryAlerts() : Promise.resolve([])
      ]);

      // Combine KPIs
      const combinedKpis = {
        inventory: inventoryKpis,
        totalOrders: inventoryKpis?.totalOrders || 0,
        completedOrders: inventoryKpis?.completedOrders || 0,
        pendingOrders: inventoryKpis?.pendingOrders || 0,
        lowStockItems: inventoryKpis?.lowStockItems || 0,
        criticalStockItems: inventoryKpis?.criticalStockItems || 0
      };

      setKpis(combinedKpis);
      setInventoryAlerts(inventoryAlertsData);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    showSuccess('Datos actualizados correctamente');
  };

  const handleExportReport = async () => {
    try {
      showSuccess('Generando reporte...');
      // TODO: Implement export functionality
    } catch (error) {
      showError('Error al generar reporte');
    }
  };

  const getKpiCard = (title, value, icon, trend, color = 'blue') => {
    const Icon = icon;
    const isPositive = trend > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
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
          <div className={`w-12 h-12 rounded-lg bg-${color}-100 dark:bg-${color}-900 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
          </div>
        </div>
      </Card>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido, {user?.name}. Aquí está el resumen de tu sistema.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button
            onClick={handleExportReport}
            className="flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Reporte
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Rango de fechas:</span>
          </div>
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            />
            <span className="self-center text-gray-500">a</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {hasPermission('production') && getKpiCard(
          'Órdenes Activas',
          kpis?.pendingOrders || 0,
          ClipboardList,
          12,
          'blue'
        )}
        
        {hasPermission('inventory') && getKpiCard(
          'Alertas de Inventario',
          inventoryAlerts.length,
          AlertTriangle,
          -3,
          'red'
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Analyses */}
        {hasPermission('laboratory') && (
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Análisis Recientes
                </h3>
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </div>
              
              <div className="space-y-4">
                {recentAnalyses.slice(0, 5).map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {analysis.bath_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(analysis.analysis_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={analysis.is_within_specification ? 'success' : 'error'}
                      text={analysis.is_within_specification ? 'Dentro Espec.' : 'Fuera Espec.'}
                    />
                  </div>
                ))}
                
                {recentAnalyses.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay análisis recientes</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Inventory Alerts */}
        {hasPermission('inventory') && (
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Alertas de Inventario
                </h3>
                <Button variant="outline" size="sm">
                  Ver todas
                </Button>
              </div>
              
              <div className="space-y-4">
                {inventoryAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.material_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Stock actual: {alert.current_stock} {alert.unit}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={alert.alert_type === 'critical' ? 'error' : 'warning'}
                      text={alert.alert_type === 'critical' ? 'Crítico' : 'Bajo'}
                    />
                  </div>
                ))}
                
                {inventoryAlerts.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay alertas de inventario</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {hasPermission('production') && (
              <Button variant="outline" className="flex items-center justify-center">
                <ClipboardList className="w-5 h-5 mr-2" />
                Nueva Orden
              </Button>
            )}
            
            {hasPermission('laboratory') && (
              <Button variant="outline" className="flex items-center justify-center">
                <Activity className="w-5 h-5 mr-2" />
                Nuevo Análisis
              </Button>
            )}
            
            {hasPermission('inventory') && (
              <Button variant="outline" className="flex items-center justify-center">
                <Package className="w-5 h-5 mr-2" />
                Gestión Inventario
              </Button>
            )}
            
            {hasPermission('reports') && (
              <Button variant="outline" className="flex items-center justify-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Generar Reporte
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;

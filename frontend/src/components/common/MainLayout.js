import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { 
  Menu, 
  X, 
  Home, 
  Package, 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Sun,
  Moon,
  Droplet,
  Beaker,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  ChevronDown,
  ChevronRight,
  TestTube,
  Microscope,
  Play
} from 'lucide-react';
import Button from './common/Button';
import Input from './common/Input';
import StatusBadge from './common/StatusBadge';

const MainLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const { 
    sidebarOpen, 
    toggleSidebar, 
    theme, 
    toggleTheme, 
    notifications, 
    removeNotification,
    showSuccess,
    showError,
    isMobile 
  } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();

  // Estado para submenús
  const [expandedItems, setExpandedItems] = React.useState({});

  // Toggle submenú
  const toggleSubmenu = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Navigation items
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: Home,
      permission: null
    },
    {
      name: 'Órdenes de Producción',
      path: '/production',
      icon: ClipboardList,
      permission: 'production'
    },
    {
      name: 'Control de Calidad',
      icon: ShieldCheck,
      permission: 'quality',
      submenu: [
        {
          name: 'Control de Calidad',
          path: '/quality',
          icon: ShieldCheck
        },
        {
          name: 'Catálogo de Inspecciones',
          path: '/quality/tests',
          icon: TestTube
        },
        {
          name: 'Ejecución de Inspecciones',
          path: '/quality/execution',
          icon: Play
        }
      ]
    },
    {
      name: 'Inventario',
      path: '/inventory',
      icon: Package,
      permission: 'inventory'
    },
    {
      name: 'Clientes',
      path: '/customers',
      icon: Users,
      permission: 'customers'
    },
    {
      name: 'Reportes',
      path: '/reports',
      icon: BarChart3,
      permission: 'reports'
    },
    {
      name: 'Configuración',
      path: '/settings',
      icon: Settings,
      permission: 'admin'
    }
  ];

  // Filter navigation items based on permissions
  const filteredNavItems = navigationItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      toggleSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      showError('Error al cerrar sesión');
    }
  };

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${theme}`}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Droplet className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              ChemPro ERP
            </span>
          </div>
          {isMobile && (
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="sm"
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.role || 'Sin rol'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActiveRoute(item.path);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedItems[item.name];
            
            if (hasSubmenu) {
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleSubmenu(item.name)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      active || item.submenu.some(subItem => isActiveRoute(subItem.path))
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Siempre mostrar el submenú para Control de Calidad */}
                  {(isExpanded || item.name === 'Control de Calidad') && (
                    <div className="ml-4 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = isActiveRoute(subItem.path);
                        
                        return (
                          <button
                            key={subItem.path}
                            onClick={() => handleNavigation(subItem.path)}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              subActive
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                            }`}
                          >
                            <SubIcon className="w-4 h-4 mr-3" />
                            {subItem.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`lg:pl-64 ${sidebarOpen ? 'lg:ml-0' : ''}`}>
        {/* Top Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left side */}
            <div className="flex items-center">
              {!isMobile && (
                <Button
                  onClick={toggleSidebar}
                  variant="ghost"
                  size="sm"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              
              {/* Search Bar */}
              <div className="ml-4 flex-1 max-w-lg">
                <Input
                  placeholder="Buscar..."
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>

              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Button>
                
                {/* Notifications Dropdown */}
                {notifications.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Notificaciones
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <StatusBadge
                                status={notification.type}
                                className="mt-0.5"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            <Button
                              onClick={() => removeNotification(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-300">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default MainLayout;

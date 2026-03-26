import React, { createContext, useContext, useReducer, useState } from 'react';

// Estado inicial
const initialState = {
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
  currentPage: 'dashboard',
  breadcrumbs: []
};

// Actions
const LAYOUT_ACTIONS = {
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_SIDEBAR_OPEN: 'SET_SIDEBAR_OPEN',
  SET_THEME: 'SET_THEME',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_NOTIFICATIONS: 'CLEAR_NOTIFICATIONS',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  SET_BREADCRUMBS: 'SET_BREADCRUMBS'
};

// Reducer
const layoutReducer = (state, action) => {
  switch (action.type) {
    case LAYOUT_ACTIONS.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen
      };
    
    case LAYOUT_ACTIONS.SET_SIDEBAR_OPEN:
      return {
        ...state,
        sidebarOpen: action.payload
      };
    
    case LAYOUT_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
    
    case LAYOUT_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    
    case LAYOUT_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    
    case LAYOUT_ACTIONS.CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };
    
    case LAYOUT_ACTIONS.SET_CURRENT_PAGE:
      return {
        ...state,
        currentPage: action.payload
      };
    
    case LAYOUT_ACTIONS.SET_BREADCRUMBS:
      return {
        ...state,
        breadcrumbs: action.payload
      };
    
    default:
      return state;
  }
};

// Context
const LayoutContext = createContext();

// Provider Component
export const LayoutProvider = ({ children }) => {
  const [state, dispatch] = useReducer(layoutReducer, initialState);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Manejar cambios en el tamaño de la ventana
  React.useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      setWindowSize({ width: newWidth, height: newHeight });
      
      // Auto-cerrar sidebar en pantallas pequeñas
      if (newWidth < 768 && state.sidebarOpen) {
        dispatch({ type: LAYOUT_ACTIONS.SET_SIDEBAR_OPEN, payload: false });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.sidebarOpen]);

  // Toggle sidebar
  const toggleSidebar = () => {
    dispatch({ type: LAYOUT_ACTIONS.TOGGLE_SIDEBAR });
  };

  // Set sidebar state
  const setSidebarOpen = (open) => {
    dispatch({ type: LAYOUT_ACTIONS.SET_SIDEBAR_OPEN, payload: open });
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({ type: LAYOUT_ACTIONS.SET_THEME, payload: newTheme });
    localStorage.setItem('theme', newTheme);
  };

  // Set theme
  const setTheme = (theme) => {
    dispatch({ type: LAYOUT_ACTIONS.SET_THEME, payload: theme });
    localStorage.setItem('theme', theme);
  };

  // Add notification
  const addNotification = (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      timestamp: new Date(),
      autoClose: true,
      duration: 5000,
      type: 'info',
      ...notification
    };

    dispatch({ type: LAYOUT_ACTIONS.ADD_NOTIFICATION, payload: newNotification });

    // Auto-remove notification
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    dispatch({ type: LAYOUT_ACTIONS.REMOVE_NOTIFICATION, payload: id });
  };

  // Clear all notifications
  const clearNotifications = () => {
    dispatch({ type: LAYOUT_ACTIONS.CLEAR_NOTIFICATIONS });
  };

  // Set current page
  const setCurrentPage = (page) => {
    dispatch({ type: LAYOUT_ACTIONS.SET_CURRENT_PAGE, payload: page });
  };

  // Set breadcrumbs
  const setBreadcrumbs = (breadcrumbs) => {
    dispatch({ type: LAYOUT_ACTIONS.SET_BREADCRUMBS, payload: breadcrumbs });
  };

  // Show success notification
  const showSuccess = (message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      icon: 'CheckCircle',
      ...options
    });
  };

  // Show error notification
  const showError = (message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      icon: 'AlertCircle',
      duration: 8000,
      ...options
    });
  };

  // Show warning notification
  const showWarning = (message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      icon: 'AlertTriangle',
      ...options
    });
  };

  // Show info notification
  const showInfo = (message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      icon: 'Info',
      ...options
    });
  };

  // Load theme from localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && savedTheme !== state.theme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  React.useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  const value = {
    ...state,
    windowSize,
    toggleSidebar,
    setSidebarOpen,
    toggleTheme,
    setTheme,
    addNotification,
    removeNotification,
    clearNotifications,
    setCurrentPage,
    setBreadcrumbs,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

// Hook para usar el contexto
export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export default LayoutContext;

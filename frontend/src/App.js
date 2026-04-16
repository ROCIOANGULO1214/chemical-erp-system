import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LayoutProvider } from './contexts/LayoutContext';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/common/MainLayout';
import Dashboard from './pages/Dashboard';
import ProductionOrders from './pages/production/ProductionOrders';
import QualityControl from './pages/quality/QualityControl';
import QualityTests from './pages/quality/QualityTests';
import InspectionExecution from './pages/quality/InspectionExecution';
import Inventory from './pages/inventory/Inventory';
import Customers from './pages/customers/Customers';
import Reports from './pages/reports/Reports';
import Login from './pages/auth/Login';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <LayoutProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="production" element={<ProductionOrders />} />
              <Route path="quality" element={<QualityControl />} />
              <Route path="quality/tests" element={<QualityTests />} />
              <Route path="quality/execution" element={<InspectionExecution />} />
              <Route path="quality-tests" element={<QualityTests />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="customers" element={<Customers />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </Router>
      </LayoutProvider>
    </AuthProvider>
  );
}

export default App;

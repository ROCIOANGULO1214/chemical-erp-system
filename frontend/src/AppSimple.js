import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardSimple from './pages/DashboardSimple';
import ProductionOrders from './pages/production/ProductionOrders';
import QualityControl from './pages/quality/QualityControl';
import Laboratory from './pages/laboratory/Laboratory';
import Products from './pages/products/Products';
import Customers from './pages/customers/Customers';
import Processes from './pages/processes/Processes';

// Componente de Layout simple
const SimpleLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                  ERP
                </div>
                <h1 className="text-xl font-bold text-gray-900">Sistema Químico Industrial</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                  <a href="/production" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Producción</a>
                  <a href="/quality" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Calidad</a>
                  <a href="/laboratory" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Laboratorio</a>
                  <a href="/products" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Productos</a>
                  <a href="/customers" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Clientes</a>
                  <a href="/processes" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Procesos</a>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <div className="ml-3 relative">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                  A
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

function AppSimple() {
  return (
    <Router>
      <SimpleLayout>
        <Routes>
          <Route path="/" element={<DashboardSimple />} />
          <Route path="/production" element={<ProductionOrders />} />
          <Route path="/quality" element={<QualityControl />} />
          <Route path="/laboratory" element={<Laboratory />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/processes" element={<Processes />} />
        </Routes>
      </SimpleLayout>
    </Router>
  );
}

export default AppSimple;

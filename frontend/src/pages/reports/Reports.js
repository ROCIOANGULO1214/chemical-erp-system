import React from 'react';
import { BarChart3 } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const Reports = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reportes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generación y gestión de reportes
          </p>
        </div>
        <Button className="flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Generar Reporte
        </Button>
      </div>

      {/* Content */}
      <Card className="p-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Módulo en Desarrollo
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          El módulo de reportes está siendo implementado.
          Pronto podrás generar todos tus reportes y análisis aquí.
        </p>
      </Card>
    </div>
  );
};

export default Reports;

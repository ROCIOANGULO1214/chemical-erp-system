import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  TrendingUp,
  TrendingDown,
  Beaker,
  Activity,
  AlertTriangle,
  CheckCircle,
  LineChart,
  Calendar
} from 'lucide-react';
import laboratoryService from '../../services/laboratoryService';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';

const Laboratory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recentBathAnalyses, setRecentBathAnalyses] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analyses');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAnalyses();
  }, [analyses, searchTerm, typeFilter, specFilter]);

  const fetchData = async () => {
    try {
      const [analysesData, trendsData, recentBathData, kpisData] = await Promise.all([
        laboratoryService.getLaboratoryAnalyses(),
        laboratoryService.getLaboratoryTrends(),
        laboratoryService.getRecentBathAnalyses(),
        laboratoryService.getLaboratoryKPIs()
      ]);
      
      setAnalyses(analysesData);
      setTrends(trendsData);
      setRecentBathAnalyses(recentBathData);
      setKpis(kpisData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching laboratory data:', error);
      setLoading(false);
    }
  };

  const filterAnalyses = () => {
    // La lógica de filtrado se implementaría aquí
    // Por ahora, mostramos todos los datos
  };

  const getAnalysisTypeIcon = (type) => {
    switch (type) {
      case 'ph':
        return <Beaker className="w-4 h-4 text-blue-600" />;
      case 'concentration':
        return <Activity className="w-4 h-4 text-green-600" />;
      case 'titration':
        return <Beaker className="w-4 h-4 text-purple-600" />;
      case 'contamination':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Beaker className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleViewAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
    setShowAnalysisModal(true);
  };

  const formatParameterValue = (value, parameter) => {
    if (typeof value !== 'number') return value;
    
    switch (parameter.toLowerCase()) {
      case 'ph':
        return value.toFixed(2);
      case 'temperature':
        return `${value.toFixed(1)}°C`;
      case 'concentration':
        return `${value.toFixed(2)} g/L`;
      case 'time':
        return `${value} min`;
      default:
        return value.toFixed(3);
    }
  };

  const renderKPIs = () => {
    if (!kpis) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Análisis</p>
              <p className="text-2xl font-bold text-primary-600">{kpis.total_analyses}</p>
            </div>
            <Beaker className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Tasa Cumplimiento</p>
              <p className="text-2xl font-bold text-success-600">{kpis.compliance_rate}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Fuera de Espec.</p>
              <p className="text-2xl font-bold text-danger-600">{kpis.out_of_spec_analyses}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-danger-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Baños Analizados</p>
              <p className="text-2xl font-bold text-secondary-600">{kpis.unique_baths_analyzed}</p>
            </div>
            <Activity className="w-8 h-8 text-secondary-500" />
          </div>
        </Card>
      </div>
    );
  };

  const renderAnalysesTable = () => (
    <Card>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="table-header">
              <th className="table-header-cell">Número</th>
              <th className="table-header-cell">Fecha</th>
              <th className="table-header-cell">Tipo</th>
              <th className="table-header-cell">Baño</th>
              <th className="table-header-cell">Línea</th>
              <th className="table-header-cell">Analista</th>
              <th className="table-header-cell">Especificación</th>
              <th className="table-header-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {analyses.map((analysis) => (
              <tr key={analysis.id} className="table-row">
                <td className="table-cell font-medium">{analysis.analysis_number}</td>
                <td className="table-cell">
                  {format(new Date(analysis.analysis_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                </td>
                <td className="table-cell">
                  <div className="flex items-center">
                    {getAnalysisTypeIcon(analysis.analysis_type)}
                    <span className="ml-2 capitalize">{analysis.analysis_type}</span>
                  </div>
                </td>
                <td className="table-cell font-medium">{analysis.bath_name}</td>
                <td className="table-cell">{analysis.production_line_name}</td>
                <td className="table-cell">{analysis.analyst_name}</td>
                <td className="table-cell">
                  {analysis.is_within_specification ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                      Dentro de Espec.
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                      Fuera de Espec.
                    </span>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewAnalysis(analysis)}
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
        
        {analyses.length === 0 && (
          <div className="text-center py-8 text-secondary-500">
            No se encontraron análisis
          </div>
        )}
      </div>
    </Card>
  );

  const renderRecentBathStatus = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recentBathAnalyses.map((bath) => (
        <Card key={bath.bath_name} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-secondary-900">{bath.bath_name}</h3>
              <p className="text-sm text-secondary-600">{bath.production_line_name}</p>
            </div>
            {bath.is_within_specification ? (
              <CheckCircle className="w-5 h-5 text-success-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-secondary-600">Último análisis:</span>
              <span className="font-medium">
                {format(new Date(bath.analysis_date), 'dd/MM/yyyy HH:mm', { locale: es })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary-600">Analista:</span>
              <span className="font-medium">{bath.analyst_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-secondary-600">Estado:</span>
              <span className={`font-medium ${
                bath.is_within_specification ? 'text-success-600' : 'text-danger-600'
              }`}>
                {bath.is_within_specification ? 'Dentro de Espec.' : 'Fuera de Espec.'}
              </span>
            </div>
          </div>
          
          {bath.results && Object.keys(bath.results).length > 0 && (
            <div className="mt-3 pt-3 border-t border-secondary-200">
              <p className="text-xs text-secondary-600 mb-2">Resultados recientes:</p>
              <div className="space-y-1">
                {Object.entries(bath.results).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="text-secondary-600">{key}:</span>
                    <span className="font-medium">{formatParameterValue(value, key)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-secondary-200 flex justify-between">
            <span className="text-xs text-secondary-500">Análisis #{bath.analysis_number}</span>
            <button
              onClick={() => handleViewAnalysis(bath)}
              className="text-xs text-primary-600 hover:text-primary-800"
            >
              Ver detalles
            </button>
          </div>
        </Card>
      ))}
      
      {recentBathAnalyses.length === 0 && (
        <Card className="col-span-full p-8 text-center">
          <Beaker className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-1">Sin análisis recientes</h3>
          <p className="text-secondary-600">No se encontraron análisis de baños en los últimos días</p>
        </Card>
      )}
    </div>
  );

  const renderTrendsChart = () => (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">Tendencias de Parámetros</h3>
        
        {kpis && kpis.parameter_trends && kpis.parameter_trends.length > 0 ? (
          <div className="space-y-4">
            {kpis.parameter_trends.map((trend) => (
              <div key={trend.parameter_name} className="border border-secondary-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900">{trend.parameter_name}</h4>
                  <span className="text-sm text-secondary-600">{trend.sample_count} muestras</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-secondary-600">Promedio:</span>
                    <span className="ml-2 font-medium">{formatParameterValue(trend.avg_value, trend.parameter_name)}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Mínimo:</span>
                    <span className="ml-2 font-medium text-blue-600">{formatParameterValue(trend.min_value, trend.parameter_name)}</span>
                  </div>
                  <div>
                    <span className="text-secondary-600">Máximo:</span>
                    <span className="ml-2 font-medium text-red-600">{formatParameterValue(trend.max_value, trend.parameter_name)}</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${((trend.avg_value - trend.min_value) / (trend.max_value - trend.min_value)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-secondary-500">
            <LineChart className="w-12 h-12 mx-auto mb-3" />
            <p>No hay datos de tendencias disponibles</p>
          </div>
        )}
      </div>
    </Card>
  );

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
          <h1 className="text-2xl font-bold text-secondary-900">Laboratorio</h1>
          <p className="text-secondary-600">Análisis químicos, pH, concentraciones y tendencias</p>
        </div>
        <Button
          onClick={() => setShowAnalysisForm(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Análisis
        </Button>
      </div>

      {/* KPIs */}
      {renderKPIs()}

      {/* Filters */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por número, baño o analista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos los tipos</option>
                <option value="ph">pH</option>
                <option value="concentration">Concentración</option>
                <option value="titration">Titulación</option>
                <option value="contamination">Contaminación</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={specFilter}
                onChange={(e) => setSpecFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos los estados</option>
                <option value="true">Dentro de especificación</option>
                <option value="false">Fuera de especificación</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'analyses', label: 'Análisis', count: analyses.length },
            { id: 'bath-status', label: 'Estado Baños', count: recentBathAnalyses.length },
            { id: 'trends', label: 'Tendencias', count: trends.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-secondary-100 text-secondary-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'analyses' && renderAnalysesTable()}
      {activeTab === 'bath-status' && renderRecentBathStatus()}
      {activeTab === 'trends' && renderTrendsChart()}

      {/* Analysis Details Modal */}
      <Modal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        title={`Detalles de Análisis - ${selectedAnalysis?.analysis_number}`}
        size="lg"
      >
        {selectedAnalysis && (
          <div className="space-y-6">
            {/* Analysis Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Tipo de Análisis
                </label>
                <div className="flex items-center">
                  {getAnalysisTypeIcon(selectedAnalysis.analysis_type)}
                  <span className="ml-2 capitalize">{selectedAnalysis.analysis_type}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Estado
                </label>
                {selectedAnalysis.is_within_specification ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
                    Dentro de Especificación
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                    Fuera de Especificación
                  </span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Baño
                </label>
                <p className="text-secondary-900 font-medium">{selectedAnalysis.bath_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Línea de Producción
                </label>
                <p className="text-secondary-900">{selectedAnalysis.production_line_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Analista
                </label>
                <p className="text-secondary-900">{selectedAnalysis.analyst_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Fecha de Análisis
                </label>
                <p className="text-secondary-900">
                  {format(new Date(selectedAnalysis.analysis_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                </p>
              </div>
            </div>

            {/* Results */}
            {selectedAnalysis.results && (
              <div>
                <h3 className="font-semibold text-secondary-900 mb-3">Resultados del Análisis</h3>
                <div className="bg-secondary-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedAnalysis.results).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-secondary-700">{key}:</span>
                        <span className="text-sm font-bold text-secondary-900">
                          {formatParameterValue(value, key)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Specification Limits */}
            {selectedAnalysis.specification_limits && (
              <div>
                <h3 className="font-semibold text-secondary-900 mb-3">Límites de Especificación</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedAnalysis.specification_limits).map(([key, limits]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium text-blue-900">{key}:</span>
                        {limits.min !== undefined && limits.max !== undefined ? (
                          <span className="ml-2 text-blue-700">
                            {formatParameterValue(limits.min, key)} - {formatParameterValue(limits.max, key)}
                          </span>
                        ) : limits.min !== undefined ? (
                          <span className="ml-2 text-blue-700">
                            Mín: {formatParameterValue(limits.min, key)}
                          </span>
                        ) : limits.max !== undefined ? (
                          <span className="ml-2 text-blue-700">
                            Máx: {formatParameterValue(limits.max, key)}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedAnalysis.observations && (
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Observaciones
                </label>
                <p className="text-secondary-900 bg-secondary-50 rounded-lg p-3">
                  {selectedAnalysis.observations}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowAnalysisModal(false)}
                className="btn-secondary"
              >
                Cerrar
              </Button>
              <Button className="btn-primary">
                Editar Análisis
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Laboratory;

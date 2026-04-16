import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
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
  Play,
  Pause,
  AlertTriangle,
  FileText,
  XCircle
} from 'lucide-react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import Input from '../../components/common/Input';

// Iconos para subprocesos según tipo
const getSubProcessIcon = (name) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('recibo') || nameLower.includes('inspección')) return <ClipboardCheck className="w-6 h-6" />;
  if (nameLower.includes('desengrase') || nameLower.includes('limpieza')) return <Droplets className="w-6 h-6" />;
  if (nameLower.includes('anodizado') || nameLower.includes('activación')) return <Sparkles className="w-6 h-6" />;
  if (nameLower.includes('temperatura') || nameLower.includes('secado')) return <Thermometer className="w-6 h-6" />;
  if (nameLower.includes('tiempo') || nameLower.includes('ciclo')) return <Timer className="w-6 h-6" />;
  if (nameLower.includes('químico') || nameLower.includes('baño')) return <FlaskConical className="w-6 h-6" />;
  if (nameLower.includes('empaque') || nameLower.includes('embalaje')) return <Package className="w-6 h-6" />;
  return <Settings className="w-6 h-6" />;
};

const ExecutionPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [process, setProcess] = useState(null);
  const [subProcesses, setSubProcesses] = useState([]);
  const [executionData, setExecutionData] = useState(null);
  const [activeSubProcess, setActiveSubProcess] = useState(null);

  useEffect(() => {
    console.log('🔄 ExecutionPanel mounted, id:', id);
    const loadData = async () => {
      let subProcessList = [];
      
      try {
        setLoading(true);
        
        if (!id) {
          console.error('❌ No ID provided');
          setLoading(false);
          return;
        }
        
        // Cargar orden
        console.log('📋 Loading order:', id);
        const orderRef = doc(db, 'production_orders', id);
        const orderSnap = await getDoc(orderRef);
        
        if (!orderSnap.exists()) {
          console.error('❌ Order not found:', id);
          setOrder(null);
          setLoading(false);
          return;
        }
        
        const orderData = { id: orderSnap.id, ...orderSnap.data() };
        console.log('✅ Order loaded:', orderData);
        setOrder(orderData);
        
        // Cargar producto
        if (orderData.productId) {
          const productRef = doc(db, 'products', orderData.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            setProduct({ id: productSnap.id, ...productSnap.data() });
          }
        }
        
        // Cargar proceso
        if (orderData.processId) {
          const processRef = doc(db, 'processes', orderData.processId);
          const processSnap = await getDoc(processRef);
          if (processSnap.exists()) {
            setProcess({ id: processSnap.id, ...processSnap.data() });
          }
          
          // Cargar subprocesos de localStorage
          const savedSubprocesses = localStorage.getItem('subprocesses');
          if (savedSubprocesses) {
            const allSubprocesses = JSON.parse(savedSubprocesses);
            subProcessList = allSubprocesses
              .filter(sp => sp.process_id === orderData.processId)
              .sort((a, b) => (a.sequence_order || 0) - (b.sequence_order || 0));
            setSubProcesses(subProcessList);
          }
        }
        
        // Cargar execution data
        const executionRef = doc(db, 'order_executions', id);
        const executionSnap = await getDoc(executionRef);
        
        if (executionSnap.exists()) {
          setExecutionData(executionSnap.data());
        } else {
          setExecutionData({
            subProcesses: subProcessList.map(sp => ({
              subProcessId: sp.id,
              status: 'pending',
              name: sp.name,
              parameters: (sp.parameters || []).map(p => ({
                name: p.name,
                type: p.type,
                value: '',
                ok: false,
                min: p.min,
                max: p.max,
                unit: p.unit
              })),
              liberatedAt: null,
              liberatedBy: null
            })),
            status: 'pending',
            startedAt: null,
            completedAt: null
          });
        }
        
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setOrder(null);
      } finally {
        console.log('✅ Loading complete');
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, navigate]);

  const canLiberateSubProcess = (index) => {
    if (index === 0) return true;
    const prevSubProcess = executionData?.subProcesses?.[index - 1];
    return prevSubProcess?.status === 'liberated' || prevSubProcess?.status === 'completed';
  };

  const handleParameterChange = (subProcessId, paramIndex, value) => {
    setExecutionData(prev => {
      const newSubProcesses = [...(prev?.subProcesses || [])];
      const spIndex = newSubProcesses.findIndex(sp => sp.subProcessId === subProcessId);
      
      if (spIndex !== -1 && newSubProcesses[spIndex].parameters[paramIndex]) {
        newSubProcesses[spIndex].parameters[paramIndex].value = value;
        
        const param = newSubProcesses[spIndex].parameters[paramIndex];
        let isOk = false;
        
        switch (param.type) {
          case 'number':
            const numValue = parseFloat(value);
            isOk = !isNaN(numValue) && numValue >= (param.min || 0) && numValue <= (param.max || Infinity);
            break;
          case 'select':
            isOk = value === 'approved' || value === 'aprobado';
            break;
          case 'checkbox':
            isOk = value === true || value === 'true';
            break;
          default:
            isOk = value && value.toString().trim() !== '';
        }
        
        newSubProcesses[spIndex].parameters[paramIndex].ok = isOk;
      }
      
      return { ...prev, subProcesses: newSubProcesses };
    });
  };

  const handleLiberateSubProcess = async (subProcessId, index) => {
    if (!canLiberateSubProcess(index)) {
      alert('Debes liberar el subproceso anterior primero');
      return;
    }
    
    const spExecution = executionData?.subProcesses?.find(sp => sp.subProcessId === subProcessId);
    const allParamsOk = spExecution?.parameters?.every(p => p.ok);
    
    if (!allParamsOk) {
      alert('Todos los parámetros deben cumplir los criterios de aceptación');
      return;
    }
    
    const newSubProcesses = [...(executionData?.subProcesses || [])];
    const spIndex = newSubProcesses.findIndex(sp => sp.subProcessId === subProcessId);
    
    if (spIndex !== -1) {
      newSubProcesses[spIndex].status = 'liberated';
      newSubProcesses[spIndex].liberatedAt = new Date().toISOString();
      newSubProcesses[spIndex].liberatedBy = 'current-user';
      
      const newExecutionData = { 
        ...executionData, 
        subProcesses: newSubProcesses,
        status: 'in_progress'
      };
      
      setExecutionData(newExecutionData);
      
      try {
        await setDoc(doc(db, 'order_executions', id), newExecutionData, { merge: true });
        await updateDoc(doc(db, 'production_orders', id), { status: 'in_progress' });
      } catch (error) {
        console.error('Error guardando:', error);
      }
    }
  };

  const handleCompleteOrder = async () => {
    const allLiberated = executionData?.subProcesses?.every(sp => sp.status === 'liberated');
    if (!allLiberated) {
      alert('Todos los subprocesos deben estar liberados');
      return;
    }
    
    try {
      await setDoc(doc(db, 'order_executions', id), {
        ...executionData,
        status: 'completed',
        completedAt: serverTimestamp()
      }, { merge: true });
      
      await updateDoc(doc(db, 'production_orders', id), { 
        status: 'completed',
        actualEnd: serverTimestamp()
      });
      
      alert('Orden completada exitosamente');
      navigate('/production');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    console.log('⏳ Still loading...');
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  console.log('🎨 Rendering, order:', order, 'product:', product);

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Orden no encontrada</h2>
          <Button onClick={() => navigate('/production')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/production')} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Orden {order.orderNumber || order.order_number}
                </h1>
                <p className="text-gray-500">{product?.name || order.productName}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button className="btn-secondary">
                <Paperclip className="w-4 h-4 mr-2" />
                Adjuntos
              </Button>
              <Button className="btn-primary">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Inspección AQL
              </Button>
              <Button className="btn-danger">
                <Ban className="w-4 h-4 mr-2" />
                Cancelar Orden
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* TRES COLUMNAS DE INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* INFO DE LA ORDEN */}
          <Card className="border-t-4 border-t-blue-500">
            <div className="bg-blue-50 px-4 py-2 -mx-6 -mt-6 mb-4 border-b">
              <h3 className="font-semibold text-blue-800">Información de la orden</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha Prom:</span>
                <span className="font-medium">{order.endDate || order.end_date || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
                <span className="font-medium text-blue-600">{order.customerName || order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prioridad:</span>
                <StatusBadge status={order.priority || 'normal'} className="text-xs" />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Originador:</span>
                <span className="font-medium">{order.generatedBy || order.generated_by || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">No. Odt:</span>
                <span className="font-medium">{order.orderNumber || order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">No. P.O:</span>
                <span className="font-medium">{order.poNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Generada:</span>
                <span className="font-medium">{order.createdAt || order.created_at || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <StatusBadge status={executionData?.status || order.status || 'pending'} className="text-xs" />
              </div>
            </div>
          </Card>

          {/* INFO DE LA PIEZA */}
          <Card className="border-t-4 border-t-blue-500">
            <div className="bg-blue-50 px-4 py-2 -mx-6 -mt-6 mb-4 border-b">
              <h3 className="font-semibold text-blue-800">Información de la pieza</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Cantidad:</span>
                <span className="font-medium">{order.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">No. de Parte:</span>
                <span className="font-medium">{product?.partNumber || product?.part_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Revisión:</span>
                <span className="font-medium">{product?.revision || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DWG:</span>
                <span className="font-medium">{product?.dwg || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Descripción:</span>
                <span className="font-medium">{product?.description || order.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Departamento:</span>
                <span className="font-medium">{process?.department || product?.department || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock:</span>
                <span className="font-medium">{product?.stock || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ubicación:</span>
                <span className="font-medium">{product?.location || 'N/A'}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Progreso:</span>
                <span className="font-medium">
                  {executionData?.subProcesses?.filter(sp => sp.status === 'liberated').length || 0} / {subProcesses.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${subProcesses.length > 0 ? (executionData?.subProcesses?.filter(sp => sp.status === 'liberated').length / subProcesses.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </Card>

          {/* IMAGEN / ESPECIFICACIÓN */}
          <Card className="border-t-4 border-t-blue-500">
            <div className="bg-blue-500 px-4 py-2 -mx-6 -mt-6 mb-4 text-white">
              <h3 className="font-semibold">No. de Parte: {product?.partNumber || product?.part_number || 'N/A'}</h3>
            </div>
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <div className="text-center text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-2" />
                <p>Sin especificación</p>
              </div>
            </div>
            <Button className="w-full btn-primary">
              <Paperclip className="w-4 h-4 mr-2" />
              Especificación de Pieza
            </Button>
          </Card>
        </div>

        {/* FLUJO DE SUBPROCESOS */}
        <Card className="mb-6">
          <div className="bg-blue-500 px-6 py-3 -mx-6 -mt-6 mb-6 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Flujo de Proceso - {process?.name || 'Sin proceso'}</h3>
            </div>
          </div>

          {/* Timeline de subprocesos */}
          <div className="relative">
            <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 mx-12"></div>
            
            <div className="grid grid-cols-8 gap-4 relative z-10">
              {subProcesses.map((sp, index) => {
                const spExecution = executionData?.subProcesses?.find(
                  e => e.subProcessId === sp.id
                );
                const status = spExecution?.status || 'pending';
                const isLiberated = status === 'liberated' || status === 'completed';
                const canAccess = canLiberateSubProcess(index);
                
                return (
                  <div 
                    key={sp.id}
                    className={`text-center cursor-pointer transition-all ${!canAccess ? 'opacity-50' : ''}`}
                    onClick={() => setActiveSubProcess(activeSubProcess === sp.id ? null : sp.id)}
                  >
                    <div className={`
                      w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2
                      border-4 transition-all
                      ${isLiberated 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : canAccess
                          ? 'bg-white border-blue-500 text-blue-500'
                          : 'bg-gray-200 border-gray-300 text-gray-400'
                      }
                    `}>
                      {isLiberated ? <CheckCircle className="w-8 h-8" /> : getSubProcessIcon(sp.name)}
                    </div>
                    
                    <p className="text-xs font-medium leading-tight">{sp.name}</p>
                    
                    <div className="mt-1">
                      <span className={`
                        text-xs px-2 py-1 rounded-full
                        ${isLiberated 
                          ? 'bg-green-100 text-green-700' 
                          : canAccess
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                        }
                      `}>
                        {isLiberated ? 'Completado' : canAccess ? 'Pendiente' : 'Bloqueado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel de parámetros */}
          {activeSubProcess && (
            <div className="mt-8 border-t pt-6">
              {(() => {
                const sp = subProcesses.find(s => s.id === activeSubProcess);
                const spExecution = executionData?.subProcesses?.find(e => e.subProcessId === activeSubProcess);
                const spIndex = subProcesses.findIndex(s => s.id === activeSubProcess);
                const isLiberated = spExecution?.status === 'liberated';
                const canLiberate = canLiberateSubProcess(spIndex);
                
                return sp ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        {sp.name} - Parámetros de Liberación
                      </h4>
                      <StatusBadge status={spExecution?.status || 'pending'} className="text-sm" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                      {(spExecution?.parameters || []).map((param, pIndex) => (
                        <div key={pIndex} className="bg-white p-4 rounded-lg border">
                          <label className="text-sm text-gray-600 block mb-2">
                            {param.name}
                            {param.unit && <span className="text-gray-400"> ({param.unit})</span>}
                          </label>
                          
                          {param.type === 'number' && (
                            <Input
                              type="number"
                              value={param.value || ''}
                              onChange={(e) => handleParameterChange(sp.id, pIndex, e.target.value)}
                              disabled={isLiberated}
                              className={param.ok ? 'border-green-500' : 'border-gray-300'}
                            />
                          )}
                          {param.type === 'select' && (
                            <select
                              value={param.value || ''}
                              onChange={(e) => handleParameterChange(sp.id, pIndex, e.target.value)}
                              disabled={isLiberated}
                              className="input w-full"
                            >
                              <option value="">Seleccionar</option>
                              <option value="aprobado">Aprobado</option>
                              <option value="rechazado">Rechazado</option>
                            </select>
                          )}
                          {param.type === 'text' && (
                            <Input
                              type="text"
                              value={param.value || ''}
                              onChange={(e) => handleParameterChange(sp.id, pIndex, e.target.value)}
                              disabled={isLiberated}
                              className={param.ok ? 'border-green-500' : 'border-gray-300'}
                            />
                          )}
                          {param.type === 'checkbox' && (
                            <input
                              type="checkbox"
                              checked={param.value || false}
                              onChange={(e) => handleParameterChange(sp.id, pIndex, e.target.checked)}
                              disabled={isLiberated}
                              className="w-5 h-5"
                            />
                          )}
                          
                          {param.min !== undefined && param.max !== undefined && (
                            <p className="text-xs text-gray-400 mt-1">
                              Rango: {param.min} - {param.max}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {!isLiberated && (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleLiberateSubProcess(sp.id, spIndex)}
                          disabled={!canLiberate || !spExecution?.parameters?.every(p => p.ok)}
                          className={canLiberate && spExecution?.parameters?.every(p => p.ok) ? 'btn-success' : 'btn-secondary'}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Liberar Subproceso
                        </Button>
                      </div>
                    )}
                    
                    {isLiberated && (
                      <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">
                          Subproceso liberado el {new Date(spExecution.liberatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </Card>

        {/* BOTÓN FINAL */}
        <div className="flex justify-center">
          <Button
            onClick={handleCompleteOrder}
            className="btn-success px-8 py-4 text-lg"
            disabled={!executionData?.subProcesses?.every(sp => sp.status === 'liberated')}
          >
            <CheckCircle className="w-6 h-6 mr-3" />
            Liberar Orden Completa
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExecutionPanel;

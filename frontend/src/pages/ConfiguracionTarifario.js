import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import axios from '../services/axios';

const ConfiguracionTarifario = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tarifario, setTarifario] = useState(null);
  const [configuracionAvisos, setConfiguracionAvisos] = useState(null);
  const [activeTab, setActiveTab] = useState('conceptos');
  
  // Modales
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
  const [editModal, setEditModal] = useState({ isOpen: false, item: null, type: '' });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [tarifarioRes, configRes] = await Promise.all([
        axios.get('/tarifario/activo'),
        axios.get('/tarifario/configuracion-avisos')
      ]);
      
      setTarifario(tarifarioRes.data);
      setConfiguracionAvisos(configRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos del tarifario',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item, type) => {
    setEditModal({ isOpen: true, item: { ...item }, type });
  };

  const handleSaveEdit = async () => {
    try {
      const { item, type } = editModal;
      
      let endpoint = '';
      let payload = {};

      switch (type) {
        case 'concepto':
          endpoint = `/tarifario/concepto-fijo/${item.id}`;
          payload = { monto: parseFloat(item.monto) };
          break;
        case 'escala':
          endpoint = `/tarifario/escala-consumo/${item.id}`;
          payload = { precio: parseFloat(item.precio_por_m3) };
          break;
        case 'cargo':
          endpoint = `/tarifario/cargo-extra/${item.id}`;
          payload = { monto: parseFloat(item.monto) };
          break;
        case 'config':
          endpoint = '/tarifario/configuracion-avisos';
          payload = {
            aviso_deuda_meses: parseInt(item.aviso_deuda_meses),
            aviso_deuda_monto: parseFloat(item.aviso_deuda_monto),
            aviso_corte_dias_despues: parseInt(item.aviso_corte_dias_despues),
            aviso_corte_monto: parseFloat(item.aviso_corte_monto),
            corte_dias_despues_aviso: parseInt(item.corte_dias_despues_aviso),
            reconexion_monto: parseFloat(item.reconexion_monto),
            reconexion_cuotas_max: parseInt(item.reconexion_cuotas_max),
            recargo_mora_monto: parseFloat(item.recargo_mora_monto),
            recargo_mora_activo: item.recargo_mora_activo
          };
          break;
        default:
          return;
      }

      await axios.put(endpoint, payload);
      
      setModal({
        isOpen: true,
        type: 'success',
        title: '¡Actualizado!',
        message: 'Los valores se actualizaron correctamente',
        onConfirm: () => {
          setModal({ ...modal, isOpen: false });
          cargarDatos();
        }
      });
      
      setEditModal({ isOpen: false, item: null, type: '' });
    } catch (error) {
      console.error('Error al guardar:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar la actualización',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
    }
  };

  const formatMonto = (monto) => {
    return new Intl.NumberFormat('es-AR', { 
      style: 'currency', 
      currency: 'ARS',
      minimumFractionDigits: 0 
    }).format(monto);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración del Tarifario</h1>
                <p className="text-gray-600 mt-1">
                  {tarifario?.nombre} - Vigente desde {new Date(tarifario?.vigencia_desde).toLocaleDateString('es-AR')}
                </p>
              </div>
              <button
                onClick={() => navigate('/administrativo/clientes')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Volver
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-8">
            <button
              onClick={() => setActiveTab('conceptos')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'conceptos'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Conceptos Fijos
            </button>
            <button
              onClick={() => setActiveTab('escalas')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'escalas'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Escalas de Consumo
            </button>
            <button
              onClick={() => setActiveTab('cargos')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'cargos'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Cargos Extras
            </button>
            <button
              onClick={() => setActiveTab('avisos')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'avisos'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              Configuración de Avisos
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Conceptos Fijos */}
          {activeTab === 'conceptos' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Condición
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tarifario?.conceptosFijos?.map((concepto) => (
                      <tr key={concepto.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{concepto.nombre}</div>
                          <div className="text-sm text-gray-500">{concepto.descripcion}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{concepto.tipo_cliente}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {concepto.condicion_umbral_m3 
                              ? `${concepto.condicion_umbral_m3 > 20 ? '>' : '≤'} ${concepto.condicion_umbral_m3}m³`
                              : '-'
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatMonto(concepto.monto)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(concepto, 'concepto')}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Escalas de Consumo */}
          {activeTab === 'escalas' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Particulares */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined">person</span>
                    Particulares
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {tarifario?.escalasConsumo
                    ?.filter(e => e.tipo_cliente === 'Particulares')
                    .sort((a, b) => a.orden - b.orden)
                    .map((escala) => (
                      <div key={escala.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            {escala.desde_m3} - {escala.hasta_m3 || '∞'} m³
                          </div>
                          <div className="text-2xl font-bold text-blue-600 mt-1">
                            {formatMonto(escala.precio_por_m3)}/m³
                          </div>
                        </div>
                        <button
                          onClick={() => handleEdit(escala, 'escala')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Entidad Pública */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined">domain</span>
                    Entidad Pública
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {tarifario?.escalasConsumo
                    ?.filter(e => e.tipo_cliente === 'Entidad Pública')
                    .sort((a, b) => a.orden - b.orden)
                    .map((escala) => (
                      <div key={escala.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            {escala.desde_m3} - {escala.hasta_m3 || '∞'} m³
                          </div>
                          <div className="text-2xl font-bold text-green-600 mt-1">
                            {formatMonto(escala.precio_por_m3)}/m³
                          </div>
                        </div>
                        <button
                          onClick={() => handleEdit(escala, 'escala')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Cargos Extras */}
          {activeTab === 'cargos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tarifario?.cargosExtras?.map((cargo) => (
                <div key={cargo.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{cargo.nombre}</h3>
                      <p className="text-sm text-gray-600 mt-1">{cargo.descripcion}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      cargo.tipo_aplicacion === 'AUTOMATICO' 
                        ? 'bg-blue-100 text-blue-800'
                        : cargo.tipo_aplicacion === 'MANUAL'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {cargo.tipo_aplicacion}
                    </span>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-3xl font-bold text-gray-900">
                      {cargo.es_gratuito ? 'Gratuito' : formatMonto(cargo.monto)}
                    </div>
                  </div>

                  {!cargo.es_gratuito && (
                    <button
                      onClick={() => handleEdit(cargo, 'cargo')}
                      className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Editar Monto
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Configuración de Avisos */}
          {activeTab === 'avisos' && configuracionAvisos && (
            <div className="bg-white rounded-lg border p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Aviso de Deuda */}
                <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-yellow-600">warning</span>
                    Aviso de Deuda
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Meses sin pagar:</span>
                      <div className="text-2xl font-bold text-gray-900">{configuracionAvisos.aviso_deuda_meses}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Monto del cargo:</span>
                      <div className="text-2xl font-bold text-yellow-600">{formatMonto(configuracionAvisos.aviso_deuda_monto)}</div>
                    </div>
                  </div>
                </div>

                {/* Aviso de Corte */}
                <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-orange-600">notification_important</span>
                    Aviso de Corte
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Días después del aviso de deuda:</span>
                      <div className="text-2xl font-bold text-gray-900">{configuracionAvisos.aviso_corte_dias_despues}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Monto del cargo:</span>
                      <div className="text-2xl font-bold text-orange-600">Gratuito</div>
                    </div>
                  </div>
                </div>

                {/* Corte de Servicio */}
                <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-red-600">power_off</span>
                    Corte de Servicio
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Días después del aviso de corte:</span>
                      <div className="text-2xl font-bold text-gray-900">{configuracionAvisos.corte_dias_despues_aviso}</div>
                    </div>
                  </div>
                </div>

                {/* Reconexión */}
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-green-600">power</span>
                    Reconexión
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Monto:</span>
                      <div className="text-2xl font-bold text-green-600">{formatMonto(configuracionAvisos.reconexion_monto)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Cuotas máximas:</span>
                      <div className="text-2xl font-bold text-gray-900">{configuracionAvisos.reconexion_cuotas_max}</div>
                    </div>
                  </div>
                </div>

                {/* Recargo por Mora */}
                <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-purple-600">schedule</span>
                    Recargo por Mora
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600">Monto:</span>
                      <div className="text-2xl font-bold text-purple-600">{formatMonto(configuracionAvisos.recargo_mora_monto)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Estado:</span>
                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        configuracionAvisos.recargo_mora_activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {configuracionAvisos.recargo_mora_activo ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => handleEdit(configuracionAvisos, 'config')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Editar Configuración
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Editar {editModal.type === 'concepto' ? 'Concepto Fijo' : 
                     editModal.type === 'escala' ? 'Escala de Consumo' : 
                     editModal.type === 'cargo' ? 'Cargo Extra' : 'Configuración'}
            </h3>

            {editModal.type !== 'config' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editModal.type === 'concepto' ? 'Monto' : 
                     editModal.type === 'escala' ? 'Precio por m³' : 'Monto'}
                  </label>
                  <input
                    type="number"
                    value={editModal.type === 'escala' ? editModal.item.precio_por_m3 : editModal.item.monto}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      item: {
                        ...editModal.item,
                        [editModal.type === 'escala' ? 'precio_por_m3' : 'monto']: e.target.value
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingrese el monto"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meses para Aviso de Deuda
                    </label>
                    <input
                      type="number"
                      value={editModal.item.aviso_deuda_meses}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        item: { ...editModal.item, aviso_deuda_meses: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Aviso de Deuda
                    </label>
                    <input
                      type="number"
                      value={editModal.item.aviso_deuda_monto}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        item: { ...editModal.item, aviso_deuda_monto: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días Aviso de Corte
                    </label>
                    <input
                      type="number"
                      value={editModal.item.aviso_corte_dias_despues}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        item: { ...editModal.item, aviso_corte_dias_despues: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días Corte
                    </label>
                    <input
                      type="number"
                      value={editModal.item.corte_dias_despues_aviso}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        item: { ...editModal.item, corte_dias_despues_aviso: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Reconexión
                    </label>
                    <input
                      type="number"
                      value={editModal.item.reconexion_monto}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        item: { ...editModal.item, reconexion_monto: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cuotas Máx. Reconexión
                    </label>
                    <input
                      type="number"
                      value={editModal.item.reconexion_cuotas_max}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        item: { ...editModal.item, reconexion_cuotas_max: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recargo por Mora
                    </label>
                    <input
                      type="number"
                      value={editModal.item.recargo_mora_monto}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        item: { ...editModal.item, recargo_mora_monto: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recargo Activo
                    </label>
                    <select
                      value={editModal.item.recargo_mora_activo}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        item: { ...editModal.item, recargo_mora_activo: e.target.value === 'true' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditModal({ isOpen: false, item: null, type: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mensajes */}
      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal({ ...modal, isOpen: false })}
      />
    </div>
  );
};

export default ConfiguracionTarifario;


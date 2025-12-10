import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import axios from '../services/axios';

const EstadosServicio = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modales
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
  const [reconexionModal, setReconexionModal] = useState({ isOpen: false, cliente: null, pagoContado: true, cantidadCuotas: 1 });

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/usuarios');
      const clientesData = response.data.filter(u => u.rol === 'cliente');
      setClientes(clientesData);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los clientes',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarEstados = async () => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Verificar Estados',
      message: '¿Desea ejecutar la verificación manual de estados de servicio para todos los clientes? Este proceso puede tardar unos momentos.',
      confirmText: 'Ejecutar',
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        try {
          await axios.post('/tarifario/verificar-estados');
          setModal({
            isOpen: true,
            type: 'success',
            title: '¡Completado!',
            message: 'La verificación de estados se completó correctamente',
            onConfirm: () => {
              setModal({ ...modal, isOpen: false });
              cargarClientes();
            }
          });
        } catch (error) {
          console.error('Error:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'No se pudo completar la verificación de estados',
            onConfirm: () => setModal({ ...modal, isOpen: false })
          });
        }
      },
      onCancel: () => setModal({ ...modal, isOpen: false })
    });
  };

  const handleReconexion = (cliente) => {
    setReconexionModal({
      isOpen: true,
      cliente: cliente,
      pagoContado: true,
      cantidadCuotas: 1
    });
  };

  const procesarReconexion = async () => {
    try {
      const { cliente, pagoContado, cantidadCuotas } = reconexionModal;
      
      const response = await axios.post(`/tarifario/reconexion/${cliente.id}`, {
        pagoContado: pagoContado,
        cantidadCuotas: pagoContado ? undefined : parseInt(cantidadCuotas)
      });

      setReconexionModal({ isOpen: false, cliente: null, pagoContado: true, cantidadCuotas: 1 });
      
      setModal({
        isOpen: true,
        type: 'success',
        title: '¡Reconexión Exitosa!',
        message: pagoContado 
          ? `El servicio fue reconectado. Debe pagar $${response.data.monto_a_pagar?.toLocaleString('es-AR')} al contado.`
          : `Plan de pago creado con ${cantidadCuotas} cuotas de $${response.data.monto_cuota?.toLocaleString('es-AR')} c/u. El servicio fue reconectado.`,
        onConfirm: () => {
          setModal({ ...modal, isOpen: false });
          cargarClientes();
        }
      });
    } catch (error) {
      console.error('Error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo procesar la reconexión. Verifique que el cliente no tenga deuda pendiente.',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
    }
  };

  const getEstadoBadge = (cliente) => {
    if (cliente.servicio_dado_de_baja) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <span className="material-symbols-outlined text-sm">link_off</span>
          Baja de servicio
        </span>
      );
    }

    const estados = {
      'ACTIVO': { bg: 'bg-green-100', text: 'text-green-800', icon: 'check_circle', label: 'Activo' },
      'AVISO_DEUDA': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'warning', label: 'Aviso de Deuda' },
      'AVISO_CORTE': { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'notification_important', label: 'Aviso de Corte' },
      'CORTADO': { bg: 'bg-red-100', text: 'text-red-800', icon: 'power_off', label: 'Cortado' },
    };
    
    const estado = estados[cliente.estado_servicio] || estados['ACTIVO'];
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${estado.bg} ${estado.text}`}>
        <span className="material-symbols-outlined text-sm">{estado.icon}</span>
        {estado.label}
      </span>
    );
  };

  const getEstadisticas = () => {
    return {
      activos: clientes.filter(c => !c.servicio_dado_de_baja && c.estado_servicio === 'ACTIVO').length,
      avisoDeuda: clientes.filter(c => !c.servicio_dado_de_baja && c.estado_servicio === 'AVISO_DEUDA').length,
      avisoCorte: clientes.filter(c => !c.servicio_dado_de_baja && c.estado_servicio === 'AVISO_CORTE').length,
      cortados: clientes.filter(c => !c.servicio_dado_de_baja && c.estado_servicio === 'CORTADO').length,
      bajas: clientes.filter(c => c.servicio_dado_de_baja).length,
    };
  };

  const clientesFiltrados = clientes.filter(cliente => {
    const matchEstado =
      filtroEstado === 'TODOS'
        ? true
        : filtroEstado === 'BAJA'
          ? cliente.servicio_dado_de_baja
          : !cliente.servicio_dado_de_baja && cliente.estado_servicio === filtroEstado;

    const matchSearch =
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.padron?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchEstado && matchSearch;
  });

  const stats = getEstadisticas();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando estados de servicio...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Estados de Servicio</h1>
                <p className="text-gray-600 mt-1">Gestión y monitoreo de estados de clientes</p>
              </div>
              <button
                onClick={handleVerificarEstados}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <span className="material-symbols-outlined">refresh</span>
                Verificar Estados
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Activos</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.activos}</p>
                </div>
                <span className="material-symbols-outlined text-4xl text-green-600">check_circle</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aviso de Deuda</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.avisoDeuda}</p>
                </div>
                <span className="material-symbols-outlined text-4xl text-yellow-600">warning</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aviso de Corte</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.avisoCorte}</p>
                </div>
                <span className="material-symbols-outlined text-4xl text-orange-600">notification_important</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cortados</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.cortados}</p>
                </div>
                <span className="material-symbols-outlined text-4xl text-red-600">power_off</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bajas servicio</p>
                  <p className="text-3xl font-bold text-gray-700 mt-2">{stats.bajas}</p>
                </div>
                <span className="material-symbols-outlined text-4xl text-gray-600">link_off</span>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o padrón..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="AVISO_DEUDA">Aviso de Deuda</option>
                <option value="AVISO_CORTE">Aviso de Corte</option>
                <option value="CORTADO">Cortados</option>
                <option value="BAJA">Baja de servicio</option>
              </select>
            </div>
          </div>

          {/* Tabla de clientes */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                          <div className="text-sm text-gray-500">{cliente.padron}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEstadoBadge(cliente)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {cliente.fecha_aviso_deuda && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Aviso Deuda: {new Date(cliente.fecha_aviso_deuda).toLocaleDateString('es-AR')}
                          </div>
                        )}
                        {cliente.fecha_aviso_corte && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Aviso Corte: {new Date(cliente.fecha_aviso_corte).toLocaleDateString('es-AR')}
                          </div>
                        )}
                        {cliente.fecha_corte && (
                          <div className="flex items-center gap-1 text-red-600">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            Cortado: {new Date(cliente.fecha_corte).toLocaleDateString('es-AR')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/administrativo/clientes/ver/${cliente.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Ver Detalle
                        </button>
                        {cliente.estado_servicio === 'CORTADO' && !cliente.servicio_dado_de_baja && (
                          <button
                            onClick={() => handleReconexion(cliente)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Reconectar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {clientesFiltrados.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-400">search_off</span>
                <p className="mt-4 text-gray-600">No se encontraron clientes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Reconexión */}
      {reconexionModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600">power</span>
              Reconectar Servicio
            </h3>

            <div className="mb-6">
              <p className="text-gray-700">Cliente: <span className="font-semibold">{reconexionModal.cliente?.nombre}</span></p>
              <p className="text-gray-700">Padrón: <span className="font-semibold">{reconexionModal.cliente?.padron}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Pago
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="tipoPago"
                      checked={reconexionModal.pagoContado}
                      onChange={() => setReconexionModal({ ...reconexionModal, pagoContado: true })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Pago al Contado</div>
                      <div className="text-sm text-gray-600">$74,000 en un solo pago</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="tipoPago"
                      checked={!reconexionModal.pagoContado}
                      onChange={() => setReconexionModal({ ...reconexionModal, pagoContado: false })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Plan de Cuotas</div>
                      <div className="text-sm text-gray-600">Hasta 5 cuotas mensuales</div>
                    </div>
                  </label>
                </div>
              </div>

              {!reconexionModal.pagoContado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad de Cuotas
                  </label>
                  <select
                    value={reconexionModal.cantidadCuotas}
                    onChange={(e) => setReconexionModal({ ...reconexionModal, cantidadCuotas: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 cuota</option>
                    <option value="2">2 cuotas</option>
                    <option value="3">3 cuotas</option>
                    <option value="4">4 cuotas</option>
                    <option value="5">5 cuotas</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-600">
                    Monto por cuota: ${(74000 / reconexionModal.cantidadCuotas).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setReconexionModal({ isOpen: false, cliente: null, pagoContado: true, cantidadCuotas: 1 })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={procesarReconexion}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmar Reconexión
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
        confirmText={modal.confirmText}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
      />
    </div>
  );
};

export default EstadosServicio;


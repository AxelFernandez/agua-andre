import React, { useState, useEffect } from 'react';
import axios from '../services/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

const ControlPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comprobanteModal, setComprobanteModal] = useState({ isOpen: false, url: null });
  const [rechazarModal, setRechazarModal] = useState({ isOpen: false, pagoId: null, observaciones: '' });
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: null
  });

  useEffect(() => {
    cargarPagosPendientes();
  }, []);

  const cargarPagosPendientes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/pagos/pendientes-revision');
      setPagos(response.data);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los pagos pendientes',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerComprobante = (filename) => {
    setComprobanteModal({
      isOpen: true,
      url: `http://localhost:3001/uploads/comprobantes/${filename}`
    });
  };

  const handleAprobar = (pago) => {
    setModal({
      isOpen: true,
      type: 'info',
      title: '✅ Aprobar Pago',
      message: `¿Confirma que desea aprobar el pago de ${pago.boleta?.usuario?.nombre}?

💰 Monto: $${Number(pago.monto).toLocaleString('es-AR')}
📄 Boleta: ${pago.boleta?.mes}/${pago.boleta?.anio}

Al aprobar, la boleta cambiará a estado PAGADA.`,
      confirmText: 'Sí, Aprobar',
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        setLoading(true);
        
        try {
          await axios.put(`/pagos/${pago.id}/aprobar`);
          
          setModal({
            isOpen: true,
            type: 'success',
            title: '¡Pago Aprobado!',
            message: 'El pago ha sido aprobado correctamente. La boleta ahora está marcada como PAGADA.',
            onConfirm: () => {
              setModal({ ...modal, isOpen: false });
              cargarPagosPendientes();
            }
          });
        } catch (error) {
          console.error('Error al aprobar pago:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error.response?.data?.message || 'No se pudo aprobar el pago',
            onConfirm: () => setModal({ ...modal, isOpen: false })
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => setModal({ ...modal, isOpen: false })
    });
  };

  const handleRechazarClick = (pago) => {
    setRechazarModal({
      isOpen: true,
      pago: pago,
      observaciones: ''
    });
  };

  const handleRechazarConfirm = async () => {
    if (!rechazarModal.observaciones.trim()) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Campo Requerido',
        message: 'Debe ingresar el motivo del rechazo',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
      return;
    }

    setRechazarModal({ ...rechazarModal, isOpen: false });
    setLoading(true);

    try {
      await axios.put(`/pagos/${rechazarModal.pago.id}/rechazar`, {
        observaciones: rechazarModal.observaciones
      });

      setModal({
        isOpen: true,
        type: 'success',
        title: 'Pago Rechazado',
        message: 'El pago ha sido rechazado. La boleta volvió a estado PENDIENTE y el cliente será notificado.',
        onConfirm: () => {
          setModal({ ...modal, isOpen: false });
          cargarPagosPendientes();
        }
      });
    } catch (error) {
      console.error('Error al rechazar pago:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'No se pudo rechazar el pago',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Control de Pagos</h1>
              <button
                onClick={cargarPagosPendientes}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Actualizar
              </button>
            </div>
            <p className="text-gray-600">Revisa y gestiona los comprobantes de pago enviados por los clientes</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes de Revisión</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{pagos.length}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <span className="material-symbols-outlined text-3xl text-orange-600">pending_actions</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monto Total Pendiente</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    ${pagos.reduce((sum, p) => sum + Number(p.monto || 0), 0).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <span className="material-symbols-outlined text-3xl text-blue-600">payments</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Último Pago Recibido</p>
                  <p className="text-sm font-medium text-gray-900 mt-2">
                    {pagos.length > 0 ? formatFecha(pagos[0].fechaPago).split(',')[0] : 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pagos.length > 0 ? formatFecha(pagos[0].fechaPago).split(',')[1] : ''}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <span className="material-symbols-outlined text-3xl text-green-600">schedule</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Pagos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pagos Pendientes de Verificación</h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando pagos...</p>
                </div>
              </div>
            ) : pagos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">check_circle</span>
                <p className="text-gray-600 text-lg font-medium">¡Todo al día!</p>
                <p className="text-gray-500 text-sm mt-2">No hay pagos pendientes de revisión</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Boleta
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comprobante
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagos.map((pago) => (
                      <tr key={pago.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatFecha(pago.fechaPago).split(',')[0]}</div>
                          <div className="text-xs text-gray-500">{formatFecha(pago.fechaPago).split(',')[1]}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {pago.boleta?.usuario?.nombre}
                          </div>
                          <div className="text-xs text-gray-500">
                            Padrón: {pago.boleta?.usuario?.padron}
                          </div>
                          <div className="text-xs text-gray-500">
                            {pago.boleta?.usuario?.zona?.nombre}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {pago.boleta?.mes}/{pago.boleta?.anio}
                          </div>
                          <div className="text-xs text-gray-500">
                            Venc: {pago.boleta?.fechaVencimiento ? 
                              new Date(pago.boleta.fechaVencimiento).toLocaleDateString('es-AR') : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            ${Number(pago.monto).toLocaleString('es-AR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {pago.comprobanteUrl ? (
                            <button
                              onClick={() => handleVerComprobante(pago.comprobanteUrl)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                              Ver
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Sin comprobante</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAprobar(pago)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                              title="Aprobar pago"
                            >
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                              Aprobar
                            </button>
                            <button
                              onClick={() => handleRechazarClick(pago)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              title="Rechazar pago"
                            >
                              <span className="material-symbols-outlined text-lg">cancel</span>
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-blue-600">info</span>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Instrucciones</h3>
                <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                  <li>Revise cada comprobante antes de aprobar o rechazar el pago</li>
                  <li>Al <strong>aprobar</strong>, la boleta cambiará automáticamente a estado PAGADA</li>
                  <li>Al <strong>rechazar</strong>, debe indicar el motivo. La boleta volverá a PENDIENTE</li>
                  <li>Los clientes podrán ver el estado de sus pagos desde su panel</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Ver Comprobante */}
      {comprobanteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Comprobante de Pago</h3>
              <button
                onClick={() => setComprobanteModal({ isOpen: false, url: null })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <img 
                src={comprobanteModal.url} 
                alt="Comprobante de pago" 
                className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none' }} className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300">broken_image</span>
                <p className="text-gray-600 mt-4">No se pudo cargar la imagen</p>
                <a 
                  href={comprobanteModal.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  Abrir en nueva pestaña
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar con Observaciones */}
      {rechazarModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">❌ Rechazar Pago</h3>
              <button
                onClick={() => setRechazarModal({ isOpen: false, pago: null, observaciones: '' })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Por favor, indique el motivo del rechazo. Esta información será visible para el cliente.
              </p>
              <textarea
                value={rechazarModal.observaciones}
                onChange={(e) => setRechazarModal({ ...rechazarModal, observaciones: e.target.value })}
                placeholder="Ej: El comprobante no coincide con el monto de la boleta..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows="4"
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setRechazarModal({ isOpen: false, pago: null, observaciones: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazarConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal General */}
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

export default ControlPagos;



import React, { useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../services/axios';
import Modal from '../components/Modal';

const estadoBadge = (estado) => {
  switch (estado) {
    case 'pendiente':
      return 'bg-amber-100 text-amber-800';
    case 'pagada':
      return 'bg-emerald-100 text-emerald-800';
    case 'procesando':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const formatearMonto = (monto) => Number(monto || 0).toFixed(2);
const formatearFecha = (fecha) => (fecha ? new Date(fecha).toLocaleDateString('es-AR') : '-');
const hoyStr = () => new Date().toISOString().slice(0, 10);

function CobrosEfectivo() {
  const [padron, setPadron] = useState('');
  const [boletaIdInput, setBoletaIdInput] = useState('');
  const [cliente, setCliente] = useState(null);
  const [boletas, setBoletas] = useState([]);
  const [selectedBoleta, setSelectedBoleta] = useState(null);
  const [montoCobro, setMontoCobro] = useState('');
  const [fechaPago, setFechaPago] = useState(hoyStr());
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Aceptar',
    onConfirm: null,
    onCancel: null,
    cancelText: null,
  });

  const cerrarModal = () =>
    setModal((prev) => ({
      ...prev,
      isOpen: false,
      onConfirm: null,
      onCancel: null,
      cancelText: null,
    }));

  const mostrarModal = (config) =>
    setModal({
      isOpen: true,
      type: config.type || 'info',
      title: config.title || '',
      message: config.message || '',
      confirmText: config.confirmText || 'Aceptar',
      onConfirm: config.onConfirm,
      onCancel: config.onCancel,
      cancelText: config.cancelText,
    });

  const seleccionarBoleta = (boleta) => {
    setSelectedBoleta(boleta);
    setMontoCobro(formatearMonto(boleta.total));
    setFechaPago(hoyStr());
    setObservaciones('');
  };

  const buscar = async () => {
    if (!padron && !boletaIdInput) {
      mostrarModal({
        type: 'warning',
        title: 'Falta información',
        message: 'Ingresa un padrón o un número de boleta para buscar.',
        onConfirm: cerrarModal,
      });
      return;
    }

    setLoading(true);
    setCliente(null);
    setBoletas([]);
    setSelectedBoleta(null);

    try {
      if (boletaIdInput) {
        const boletaRes = await axios.get(`/boletas/${boletaIdInput}`);
        const boleta = boletaRes.data;
        setBoletas([boleta]);
        seleccionarBoleta(boleta);
        setCliente(boleta.usuario || null);
      } else {
        const clienteRes = await axios.get(`/usuarios/padron/${padron}`);
        const usuario = clienteRes.data;
        setCliente(usuario);

        const boletasRes = await axios
          .get(`/boletas/usuario/${usuario.id}`)
          .catch(() => ({ data: [] }));

        const listaOrdenada = [...(boletasRes.data || [])].sort(
          (a, b) =>
            new Date(b.fechaEmision || b.createdAt || 0).getTime() -
            new Date(a.fechaEmision || a.createdAt || 0).getTime(),
        );

        setBoletas(listaOrdenada);

        const primera = listaOrdenada.find((b) => b.estado !== 'pagada') || listaOrdenada[0] || null;
        if (primera) {
          seleccionarBoleta(primera);
        }
      }
    } catch (error) {
      mostrarModal({
        type: 'error',
        title: 'No se encontró información',
        message:
          error.response?.data?.message ||
          'No se pudo obtener datos del cliente o boleta. Verifica la información e intenta nuevamente.',
        onConfirm: cerrarModal,
      });
    } finally {
      setLoading(false);
    }
  };

  const refrescarBoleta = async (boletaId) => {
    try {
      const res = await axios.get(`/boletas/${boletaId}`);
      const actualizada = res.data;
      setBoletas((prev) =>
        prev.map((b) => (b.id === actualizada.id ? actualizada : b)),
      );
      setSelectedBoleta(actualizada);
    } catch (_) {
      // mantener estado local si falla la recarga
    }
  };

  const ejecutarCobro = async () => {
    if (!selectedBoleta) {
      mostrarModal({
        type: 'warning',
        title: 'Selecciona una boleta',
        message: 'Debes elegir una boleta para registrar el cobro.',
        onConfirm: cerrarModal,
      });
      return;
    }

    setDetailLoading(true);
    try {
      await axios.post('/pagos/efectivo', {
        boletaId: selectedBoleta.id,
        monto: Number(montoCobro),
        fechaPago,
        observaciones,
      });

      await refrescarBoleta(selectedBoleta.id);

      mostrarModal({
        type: 'success',
        title: 'Cobro registrado',
        message: 'El pago en efectivo se guardó y la boleta quedó marcada como PAGADA.',
        onConfirm: cerrarModal,
      });
    } catch (error) {
      mostrarModal({
        type: 'error',
        title: 'No se pudo registrar el cobro',
        message: error.response?.data?.message || 'Ocurrió un error al intentar guardar el cobro en efectivo.',
        onConfirm: cerrarModal,
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmarCobro = () => {
    if (!selectedBoleta) {
      mostrarModal({
        type: 'warning',
        title: 'Selecciona una boleta',
        message: 'Elige la boleta a cobrar antes de continuar.',
        onConfirm: cerrarModal,
      });
      return;
    }

    if (selectedBoleta.estado === 'pagada') {
      mostrarModal({
        type: 'warning',
        title: 'Boleta ya pagada',
        message: 'Esta boleta ya se encuentra pagada. Selecciona otra boleta pendiente.',
        onConfirm: cerrarModal,
      });
      return;
    }

    const montoNumero = Number(montoCobro);
    if (Number.isNaN(montoNumero) || montoNumero <= 0) {
      mostrarModal({
        type: 'warning',
        title: 'Monto inválido',
        message: 'Ingresa un monto válido para registrar el cobro.',
        onConfirm: cerrarModal,
      });
      return;
    }

    mostrarModal({
      type: 'info',
      title: 'Confirmar cobro en efectivo',
      message: `¿Registrar el cobro en efectivo de $${formatearMonto(montoNumero)} para la boleta ${selectedBoleta.mes}/${selectedBoleta.anio} del padrón ${selectedBoleta.usuario?.padron || ''}?`,
      confirmText: 'Registrar cobro',
      cancelText: 'Cancelar',
      onConfirm: () => {
        cerrarModal();
        ejecutarCobro();
      },
      onCancel: cerrarModal,
    });
  };

  const boletasPendientes = useMemo(
    () => boletas.filter((b) => b.estado !== 'pagada'),
    [boletas],
  );

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-[#617c89]">Caja • Cobros presenciales</p>
              <h1 className="text-3xl font-bold text-[#111618]">Cobros en efectivo</h1>
              <p className="text-gray-600">Registra pagos de boletas abonadas en el local.</p>
            </div>
            <div className="hidden md:flex gap-2">
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
                <span className="font-semibold">{boletasPendientes.length}</span> boletas pendientes del resultado
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase text-[#617c89]">Búsqueda</p>
                    <h2 className="text-lg font-semibold text-[#111618]">Encontrar boleta</h2>
                  </div>
                  <button
                    onClick={buscar}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-gray-300"
                  >
                    <span className="material-symbols-outlined text-lg">search</span>
                    {loading ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Padrón del cliente
                    </label>
                    <input
                      type="text"
                      value={padron}
                      onChange={(e) => setPadron(e.target.value)}
                      placeholder="Ej: 1234"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      También puedes buscar por número de boleta si lo tienes a mano.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de boleta
                    </label>
                    <input
                      type="number"
                      value={boletaIdInput}
                      onChange={(e) => setBoletaIdInput(e.target.value)}
                      placeholder="Ej: 1023"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {cliente && (
                  <div className="mt-4 flex items-center gap-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    <span className="material-symbols-outlined text-primary">person</span>
                    <div>
                      <p className="font-semibold">{cliente.nombre}</p>
                      <p className="text-xs text-gray-500">
                        Padrón {cliente.padron} {cliente.zona ? `• ${cliente.zona.nombre}` : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-[#617c89]">Resultados</p>
                    <h2 className="text-lg font-semibold text-[#111618]">Boletas encontradas</h2>
                  </div>
                  <div className="text-sm text-gray-500">
                    {boletas.length === 0
                      ? 'Sin resultados'
                      : `${boletas.length} boleta${boletas.length > 1 ? 's' : ''}`}
                  </div>
                </div>

                {loading ? (
                  <div className="py-10 text-center text-gray-600">Buscando boletas...</div>
                ) : boletas.length === 0 ? (
                  <div className="py-10 text-center text-gray-500">
                    Ingresa un padrón o una boleta para ver resultados.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-6 py-3 text-left font-medium">Boleta</th>
                          <th className="px-6 py-3 text-left font-medium">Vencimiento</th>
                          <th className="px-6 py-3 text-left font-medium">Total</th>
                          <th className="px-6 py-3 text-left font-medium">Estado</th>
                          <th className="px-6 py-3 text-right font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {boletas.map((boleta) => (
                          <tr key={boleta.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-[#111618]">
                                {boleta.mes}/{boleta.anio}
                              </p>
                              <p className="text-xs text-gray-500">ID #{boleta.id}</p>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {formatearFecha(boleta.fechaVencimiento)}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-[#111618]">
                              ${formatearMonto(boleta.total)}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estadoBadge(boleta.estado)}`}
                              >
                                {boleta.estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => seleccionarBoleta(boleta)}
                                className="text-primary hover:text-primary/80 font-medium text-sm"
                              >
                                Seleccionar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase text-[#617c89]">Cobro</p>
                  <h2 className="text-lg font-semibold text-[#111618]">Registrar pago en efectivo</h2>
                </div>
                {detailLoading && (
                  <span className="material-symbols-outlined text-primary animate-spin">refresh</span>
                )}
              </div>

              {!selectedBoleta ? (
                <div className="text-center text-gray-500 py-10">
                  Selecciona una boleta para continuar.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs uppercase text-[#617c89]">Boleta</p>
                        <p className="text-xl font-bold text-[#111618]">
                          {selectedBoleta.mes}/{selectedBoleta.anio}
                        </p>
                        <p className="text-sm text-gray-600">
                          Vence {formatearFecha(selectedBoleta.fechaVencimiento)}
                        </p>
                        {selectedBoleta.fechaPago && (
                          <p className="text-xs text-gray-500 mt-1">
                            Último pago registrado: {formatearFecha(selectedBoleta.fechaPago)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estadoBadge(
                          selectedBoleta.estado,
                        )}`}
                      >
                        {selectedBoleta.estado}
                      </span>
                    </div>
                    <div className="mt-3 flex justify-between text-sm">
                      <span className="text-gray-600">Total a pagar</span>
                      <span className="font-semibold text-[#111618]">
                        ${formatearMonto(selectedBoleta.total)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Monto cobrado en efectivo
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={montoCobro}
                      onChange={(e) => setMontoCobro(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500">
                      Usa el total de la boleta o ajusta si incluye recargos adicionales.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Fecha de pago</label>
                    <input
                      type="date"
                      value={fechaPago}
                      onChange={(e) => setFechaPago(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                    <textarea
                      rows={3}
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Ej: Pago en ventanilla, incluye mora..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>

                  <button
                    onClick={confirmarCobro}
                    disabled={detailLoading || selectedBoleta.estado === 'pagada'}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">point_of_sale</span>
                    Registrar cobro en efectivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Modal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
        cancelText={modal.cancelText}
      />
    </div>
  );
}

export default CobrosEfectivo;


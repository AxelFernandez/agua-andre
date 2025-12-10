import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import axios from '../services/axios';

const GenerarBoletas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMasivo, setLoadingMasivo] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [boletasPeriodo, setBoletasPeriodo] = useState([]);
  const [activeTab, setActiveTab] = useState('individual');
  
  // Modal
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (activeTab === 'masivo') {
      cargarBoletasPeriodo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, anio, activeTab]);

  useEffect(() => {
    if (!clienteSeleccionado) return;
    const clienteValido = clientes.some(
      c => c.id === parseInt(clienteSeleccionado) && c.activo !== false && !c.servicio_dado_de_baja
    );
    if (!clienteValido) {
      setClienteSeleccionado('');
    }
  }, [clientes, clienteSeleccionado]);

  const cargarClientes = async () => {
    try {
      const response = await axios.get('/usuarios');
      const clientesData = response.data.filter(u => u.rol === 'cliente');
      setClientes(clientesData);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const cargarBoletasPeriodo = async () => {
    try {
      const response = await axios.get(`/tarifario/boletas-periodo?mes=${mes}&anio=${anio}`);
      setBoletasPeriodo(response.data || []);
    } catch (error) {
      console.error('Error al cargar boletas:', error);
      setBoletasPeriodo([]);
    }
  };

  const handleGenerarBoleta = async () => {
    if (!clienteSeleccionado) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Cliente requerido',
        message: 'Por favor seleccione un cliente',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
      return;
    }

    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Confirmar Generación',
      message: `¿Desea generar la boleta para el mes ${mes}/${anio}?`,
      confirmText: 'Generar',
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        setLoading(true);
        
        try {
          const response = await axios.post('/tarifario/generar-boleta', {
            usuarioId: parseInt(clienteSeleccionado),
            mes: parseInt(mes),
            anio: parseInt(anio)
          });

          const boleta = response.data;
          
          setModal({
            isOpen: true,
            type: 'success',
            title: '¡Boleta Generada!',
            message: `Boleta generada exitosamente.
            
Servicio Base: $${boleta.monto_servicio_base?.toLocaleString('es-AR')}
Consumo: $${boleta.monto_consumo?.toLocaleString('es-AR')}
Cargos Extras: $${boleta.total_cargos_extras?.toLocaleString('es-AR')}
${boleta.monto_cuota_plan ? `Cuota Plan: $${boleta.monto_cuota_plan?.toLocaleString('es-AR')}` : ''}

TOTAL: $${boleta.total?.toLocaleString('es-AR')}`,
            onConfirm: () => {
              setModal({ ...modal, isOpen: false });
              setClienteSeleccionado('');
            }
          });
        } catch (error) {
          console.error('Error:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error.response?.data?.message || 'No se pudo generar la boleta',
            onConfirm: () => setModal({ ...modal, isOpen: false })
          });
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => setModal({ ...modal, isOpen: false })
    });
  };

  const handleGenerarMasivo = async () => {
    setModal({
      isOpen: true,
      type: 'warning',
      title: 'Generación Masiva',
      message: `¿Desea generar boletas para todos los clientes activos y sin baja de servicio para el período ${meses.find(m => m.value === parseInt(mes))?.label} ${anio}?\n\nEsto puede tomar unos segundos.`,
      confirmText: 'Generar Todas',
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        setLoadingMasivo(true);
        
        try {
          const response = await axios.post('/tarifario/generar-boletas-masivas', {
            mes: parseInt(mes),
            anio: parseInt(anio)
          });

          const resultado = response.data;
          
          setModal({
            isOpen: true,
            type: 'success',
            title: '¡Generación Completada!',
            message: `Resultados de la generación masiva:

📊 Total de clientes: ${resultado.totalClientes}
✅ Boletas generadas: ${resultado.boletasGeneradas}
📋 Ya existían: ${resultado.boletasExistentes}
${resultado.errores.length > 0 ? `❌ Errores: ${resultado.errores.length}` : ''}`,
            onConfirm: () => {
              setModal({ ...modal, isOpen: false });
              cargarBoletasPeriodo();
            }
          });
        } catch (error) {
          console.error('Error:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error.response?.data?.message || 'No se pudieron generar las boletas',
            onConfirm: () => setModal({ ...modal, isOpen: false })
          });
        } finally {
          setLoadingMasivo(false);
        }
      },
      onCancel: () => setModal({ ...modal, isOpen: false })
    });
  };

  const handleDescargarPdfMasivo = async () => {
    if (boletasPeriodo.length === 0) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Sin boletas',
        message: 'No hay boletas generadas para este período. Primero genere las boletas.',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
      return;
    }

    setLoadingPdf(true);
    try {
      const response = await axios.get(`/tarifario/pdf/boletas-masivas?mes=${mes}&anio=${anio}`, {
        responseType: 'blob'
      });

      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boletas-${mes}-${anio}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setModal({
        isOpen: true,
        type: 'success',
        title: '¡PDF Generado!',
        message: `Se descargó el PDF con ${boletasPeriodo.length} boletas.`,
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
    } catch (error) {
      console.error('Error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo generar el PDF',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDescargarPdfIndividual = async (boletaId, padron) => {
    try {
      const response = await axios.get(`/tarifario/pdf/boleta/${boletaId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `boleta-${padron}-${mes}-${anio}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo descargar el PDF',
        onConfirm: () => setModal({ ...modal, isOpen: false })
      });
    }
  };

  const handleRecalcularBoleta = (boleta) => {
    // Modal con explicación detallada
    setModal({
      isOpen: true,
      type: 'info',
      title: '🔄 Recalcular Boleta',
      message: `¿Desea recalcular la boleta de ${boleta.usuario?.nombre}?

📌 ¿CUÁNDO USAR ESTA FUNCIÓN?

Use "Recalcular" cuando:
• El operario corrigió una lectura errónea del medidor
• Hay una nueva lectura más reciente para el mismo mes
• Los datos del cliente cambiaron y necesita reflejarlos

⚙️ ¿QUÉ HACE ESTA FUNCIÓN?

1. Elimina la boleta actual
2. Busca la lectura MÁS RECIENTE del mes
3. Recalcula todos los montos con el tarifario vigente
4. Genera una nueva boleta actualizada

⚠️ IMPORTANTE:

• Solo funciona con boletas PENDIENTE o EN PROCESO
• NO se puede recalcular una boleta ya PAGADA
• Los montos pueden cambiar si hubo cambios en las lecturas

¿Confirma que desea recalcular esta boleta?`,
      confirmText: 'Sí, Recalcular',
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        setLoadingMasivo(true);

        try {
          await axios.post(`/tarifario/recalcular-boleta/${boleta.id}`);

          setModal({
            isOpen: true,
            type: 'success',
            title: '¡Boleta Recalculada!',
            message: `La boleta de ${boleta.usuario?.nombre} ha sido recalculada correctamente con la lectura más reciente.`,
            onConfirm: () => {
              setModal({ ...modal, isOpen: false });
              cargarBoletasPeriodo();
            }
          });
        } catch (error) {
          console.error('Error al recalcular:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error.response?.data?.message || 'No se pudo recalcular la boleta',
            onConfirm: () => setModal({ ...modal, isOpen: false })
          });
        } finally {
          setLoadingMasivo(false);
        }
      },
      onCancel: () => setModal({ ...modal, isOpen: false })
    });
  };

  const meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);
  const clientesDisponibles = clientes.filter(c => c.activo !== false && !c.servicio_dado_de_baja);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Generar Boletas</h1>
            <p className="text-gray-600 mt-1">Generación individual o masiva de boletas mensuales</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('individual')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'individual'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">person</span>
                Generación Individual
              </span>
            </button>
            <button
              onClick={() => setActiveTab('masivo')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'masivo'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">groups</span>
                Generación Masiva
              </span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === 'individual' ? (
            /* Tab Individual */
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg border p-8">
                <div className="space-y-6">
                  {/* Información */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-blue-600">info</span>
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-1">Generación Individual</h3>
                        <p className="text-sm text-blue-800">
                          Genera boletas para un cliente específico y período determinado.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente *
                    </label>
                    <select
                      value={clienteSeleccionado}
                      onChange={(e) => setClienteSeleccionado(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="">Seleccione un cliente</option>
                    {clientesDisponibles.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.padron} - {cliente.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Período */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mes *
                      </label>
                      <select
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        {meses.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Año *
                      </label>
                      <select
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                      >
                        {anios.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Resumen */}
                  {clienteSeleccionado && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Resumen</h4>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p>Cliente: <span className="font-semibold">
                          {clientesDisponibles.find(c => c.id === parseInt(clienteSeleccionado))?.nombre}
                        </span></p>
                        <p>Padrón: <span className="font-semibold">
                          {clientesDisponibles.find(c => c.id === parseInt(clienteSeleccionado))?.padron}
                        </span></p>
                        <p>Período: <span className="font-semibold">
                          {meses.find(m => m.value === parseInt(mes))?.label} {anio}
                        </span></p>
                      </div>
                    </div>
                  )}

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => navigate('/administrativo/clientes')}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGenerarBoleta}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">receipt_long</span>
                          Generar Boleta
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Tab Masivo */
            <div className="max-w-6xl mx-auto">
              {/* Controles superiores */}
              <div className="bg-white rounded-lg border p-6 mb-6">
                <div className="flex flex-wrap gap-4 items-end justify-between">
                  <div className="flex gap-4">
                    {/* Período */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mes
                      </label>
                      <select
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loadingMasivo || loadingPdf}
                      >
                        {meses.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Año
                      </label>
                      <select
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loadingMasivo || loadingPdf}
                      >
                        {anios.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {/* Botón Generar Masivo */}
                    <button
                      onClick={handleGenerarMasivo}
                      disabled={loadingMasivo || loadingPdf}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMasivo ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">flash_on</span>
                          Generar Todas las Boletas
                        </>
                      )}
                    </button>

                    {/* Botón Descargar PDF */}
                    <button
                      onClick={handleDescargarPdfMasivo}
                      disabled={loadingPdf || loadingMasivo || boletasPeriodo.length === 0}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingPdf ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Generando PDF...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">picture_as_pdf</span>
                          Descargar PDF ({boletasPeriodo.length})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600">groups</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Clientes</p>
                      <p className="text-2xl font-bold text-gray-900">{clientes.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-green-600">receipt_long</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Boletas Generadas</p>
                      <p className="text-2xl font-bold text-gray-900">{boletasPeriodo.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-orange-600">pending</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pendientes</p>
                      <p className="text-2xl font-bold text-gray-900">{clientes.length - boletasPeriodo.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de Boletas */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900">
                    Boletas de {meses.find(m => m.value === parseInt(mes))?.label} {anio}
                  </h3>
                </div>

                {boletasPeriodo.length === 0 ? (
                  <div className="p-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">receipt_long</span>
                    <p className="text-gray-500 text-lg">No hay boletas generadas para este período</p>
                    <p className="text-gray-400 text-sm mt-2">Use el botón "Generar Todas las Boletas" para crearlas</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Padrón</th>
                          <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Cliente</th>
                          <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Zona</th>
                          <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Consumo</th>
                          <th className="text-right px-6 py-3 text-sm font-medium text-gray-600">Total</th>
                          <th className="text-center px-6 py-3 text-sm font-medium text-gray-600">Estado</th>
                          <th className="text-center px-6 py-3 text-sm font-medium text-gray-600">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {boletasPeriodo.map((boleta) => (
                          <tr key={boleta.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {boleta.usuario?.padron}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {boleta.usuario?.nombre}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {boleta.usuario?.zona?.nombre || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 text-right">
                              {boleta.consumo_m3} m³
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                              ${Number(boleta.total).toLocaleString('es-AR')}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                boleta.estado === 'pagada' 
                                  ? 'bg-green-100 text-green-700'
                                  : boleta.estado === 'procesando'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {boleta.estado === 'pagada' ? 'Pagada' : 
                                 boleta.estado === 'procesando' ? 'Procesando' : 'Pendiente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* Botón PDF */}
                                <button
                                  onClick={() => handleDescargarPdfIndividual(boleta.id, boleta.usuario?.padron)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Descargar PDF"
                                >
                                  <span className="material-symbols-outlined">picture_as_pdf</span>
                                </button>

                                {/* Botón Recalcular - Solo visible si NO está pagada */}
                                {boleta.estado !== 'pagada' && (
                                  <button
                                    onClick={() => handleRecalcularBoleta(boleta)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Recalcular boleta con lectura más reciente"
                                  >
                                    <span className="material-symbols-outlined">refresh</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Info adicional */}
              <div className="mt-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-blue-600">info</span>
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1">Sobre la Generación Masiva</h3>
                      <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                        <li>Se generan boletas para todos los clientes activos</li>
                        <li>Si ya existe una boleta para un cliente, no se duplica</li>
                        <li>El PDF incluye 2 boletas por página para imprimir y repartir</li>
                        <li>Cada boleta incluye un talón para que el cliente conserve</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-green-600">auto_awesome</span>
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">🔄 Recálculo Inteligente</h3>
                      <p className="text-sm text-green-800 mb-2">
                        El sistema recalcula automáticamente las boletas pendientes cuando detecta nuevas lecturas:
                      </p>
                      <ul className="text-sm text-green-800 list-disc list-inside space-y-1">
                        <li><strong>Automático:</strong> Si una boleta está PENDIENTE y hay una lectura más reciente, se recalcula al regenerar</li>
                        <li><strong>Manual:</strong> Use el botón 🔄 para forzar el recálculo en cualquier momento</li>
                        <li><strong>Protegido:</strong> Las boletas PAGADAS no se pueden recalcular</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
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

export default GenerarBoletas;

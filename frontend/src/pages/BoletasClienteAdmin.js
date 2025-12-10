import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from '../services/axios';

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

const formatearPeriodo = (mes, anio) => {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${meses[(mes || 1) - 1]} ${anio}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-AR');
};

const formatearMonto = (monto) => parseFloat(monto || 0).toFixed(2);

const BoletasClienteAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [boletas, setBoletas] = useState([]);
  const [selectedBoleta, setSelectedBoleta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState('pendientes');

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const deduplicarPorPeriodo = (lista) => {
    const map = new Map();
    lista.forEach((boleta) => {
      const key = `${boleta.anio}-${boleta.mes}`;
      const previa = map.get(key);
      if (!previa) {
        map.set(key, boleta);
        return;
      }
      const fechaPrev = new Date(previa.fechaEmision || previa.createdAt || 0).getTime();
      const fechaNueva = new Date(boleta.fechaEmision || boleta.createdAt || 0).getTime();
      if (fechaNueva >= fechaPrev) {
        map.set(key, boleta);
      }
    });
    return Array.from(map.values());
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [clienteRes, boletasRes] = await Promise.all([
        axios.get(`/usuarios/${id}`),
        axios.get(`/boletas/usuario/${id}`).catch(() => ({ data: [] })),
      ]);

      setCliente(clienteRes.data);
      const boletasLimpias = deduplicarPorPeriodo(boletasRes.data || []);
      setBoletas(boletasLimpias);

      if (boletasLimpias.length > 0) {
        seleccionarBoleta(boletasLimpias[0]);
      } else {
        setSelectedBoleta(null);
      }
    } catch (error) {
      console.error('Error al cargar boletas:', error);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarBoleta = async (boletaBase) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`/boletas/${boletaBase.id}`);
      setSelectedBoleta(res.data);
    } catch (error) {
      console.error('No se pudo cargar el detalle de la boleta:', error);
      setSelectedBoleta(boletaBase);
    } finally {
      setDetailLoading(false);
    }
  };

  const boletasFiltradas = useMemo(() => {
    const lista = tab === 'pendientes'
      ? boletas.filter((b) => b.estado === 'pendiente')
      : boletas;

    return [...lista].sort((a, b) => {
      const fechaA = new Date(a.fechaVencimiento || a.createdAt || 0).getTime();
      const fechaB = new Date(b.fechaVencimiento || b.createdAt || 0).getTime();
      return fechaB - fechaA;
    });
  }, [boletas, tab]);

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-primary text-6xl animate-spin">refresh</span>
            <p className="text-[#617c89] mt-4">Cargando boletas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/administrativo/clientes/ver/${id}`)}
                className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <p className="text-xs uppercase text-[#617c89] dark:text-gray-400">Cliente</p>
                <h1 className="text-[#111618] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
                  {cliente?.nombre || 'Cliente'}
                </h1>
                <p className="text-sm text-[#617c89] dark:text-gray-400">Padrón {cliente?.padron}</p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-[#617c89] dark:text-gray-400">Total boletas</p>
                <p className="text-2xl font-bold text-[#111618] dark:text-white">{boletas.length}</p>
              </div>
              <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
            </div>
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-[#617c89] dark:text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-debt-red">
                  {boletas.filter((b) => b.estado === 'pendiente').length}
                </p>
              </div>
              <span className="material-symbols-outlined text-debt-red text-3xl">warning</span>
            </div>
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-[#617c89] dark:text-gray-400">Pagadas</p>
                <p className="text-2xl font-bold text-active-green">
                  {boletas.filter((b) => b.estado === 'pagada').length}
                </p>
              </div>
              <span className="material-symbols-outlined text-active-green text-3xl">task_alt</span>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Tabla */}
            <div className="xl:col-span-2 bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
                <div>
                  <p className="text-xs uppercase text-[#617c89] dark:text-gray-400">Historial</p>
                  <h2 className="text-xl font-bold text-[#111618] dark:text-white">Boletas del cliente</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTab('pendientes')}
                    className={`px-3 py-1 text-sm rounded-full border ${tab === 'pendientes' ? 'bg-primary text-white border-primary' : 'border-gray-300 dark:border-gray-700 text-[#617c89] dark:text-gray-300'}`}
                  >
                    Pendientes
                  </button>
                  <button
                    onClick={() => setTab('todas')}
                    className={`px-3 py-1 text-sm rounded-full border ${tab === 'todas' ? 'bg-primary text-white border-primary' : 'border-gray-300 dark:border-gray-700 text-[#617c89] dark:text-gray-300'}`}
                  >
                    Todas
                  </button>
                </div>
              </div>

              {boletasFiltradas.length === 0 ? (
                <div className="p-10 text-center text-[#617c89] dark:text-gray-400">
                  <span className="material-symbols-outlined text-5xl text-gray-400 block mb-3">draft</span>
                  No hay boletas {tab === 'pendientes' ? 'pendientes' : 'registradas'}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-[#617c89] dark:text-gray-400 uppercase">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium">Período</th>
                        <th className="px-6 py-3 text-left font-medium">Vencimiento</th>
                        <th className="px-6 py-3 text-left font-medium">Total</th>
                        <th className="px-6 py-3 text-left font-medium">Estado</th>
                        <th className="px-6 py-3 text-right font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {boletasFiltradas.map((boleta) => (
                        <tr
                          key={boleta.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-[#111618] dark:text-white">
                            {formatearPeriodo(boleta.mes, boleta.anio)}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#617c89] dark:text-gray-300">
                            {formatearFecha(boleta.fechaVencimiento)}
                          </td>
                          <td className="px-6 py-4 text-sm text-[#111618] dark:text-white font-semibold">
                            ${formatearMonto(boleta.total)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estadoBadge(boleta.estado)}`}>
                              {boleta.estado || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => seleccionarBoleta(boleta)}
                              className="text-primary hover:text-primary/80 font-medium text-sm"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Detalle */}
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase text-[#617c89] dark:text-gray-400">Detalle</p>
                  <h3 className="text-lg font-bold text-[#111618] dark:text-white">
                    {selectedBoleta ? 'Boleta seleccionada' : 'Selecciona una boleta'}
                  </h3>
                </div>
                {detailLoading && (
                  <span className="material-symbols-outlined text-primary animate-spin">refresh</span>
                )}
              </div>

              {!selectedBoleta ? (
                <div className="text-center text-[#617c89] dark:text-gray-400 py-10">
                  <span className="material-symbols-outlined text-5xl text-gray-400 mb-2">description</span>
                  <p>Elige una boleta para ver el detalle.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs uppercase text-[#617c89] dark:text-gray-400">Período</p>
                        <p className="text-xl font-bold text-[#111618] dark:text-white">
                          {formatearPeriodo(selectedBoleta.mes, selectedBoleta.anio)}
                        </p>
                        <p className="text-sm text-[#617c89] dark:text-gray-400">
                          Vence {formatearFecha(selectedBoleta.fechaVencimiento)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estadoBadge(selectedBoleta.estado)}`}>
                        {selectedBoleta.estado}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 border border-[#dbe2e6] dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#617c89] dark:text-gray-400">Servicio base</span>
                      <span className="text-[#111618] dark:text-white font-semibold">
                        ${formatearMonto(selectedBoleta.monto_servicio_base)}
                      </span>
                    </div>
                    {selectedBoleta.tiene_medidor && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#617c89] dark:text-gray-400">Consumo</span>
                        <span className="text-[#111618] dark:text-white font-semibold">
                          ${formatearMonto(selectedBoleta.monto_consumo)}
                        </span>
                      </div>
                    )}
                    {parseFloat(selectedBoleta.total_cargos_extras) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#617c89] dark:text-gray-400">Cargos extras</span>
                        <span className="text-[#111618] dark:text-white font-semibold">
                          ${formatearMonto(selectedBoleta.total_cargos_extras)}
                        </span>
                      </div>
                    )}
                    {selectedBoleta.cuota_plan_numero && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#617c89] dark:text-gray-400">
                          Plan de reconexión (Cuota {selectedBoleta.cuota_plan_numero})
                        </span>
                        <span className="text-[#111618] dark:text-white font-semibold">
                          ${formatearMonto(selectedBoleta.monto_cuota_plan)}
                        </span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-[#dbe2e6] dark:border-gray-700 flex justify-between items-center">
                      <span className="text-sm font-bold text-[#111618] dark:text-white">Total</span>
                      <span className="text-2xl font-bold text-primary">${formatearMonto(selectedBoleta.total)}</span>
                    </div>
                  </div>

                  {selectedBoleta.lectura && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-semibold text-[#111618] dark:text-white">Datos de consumo</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[#617c89] dark:text-gray-400">Lectura anterior</p>
                          <p className="font-semibold text-[#111618] dark:text-white">{selectedBoleta.lectura.lecturaAnterior} m³</p>
                        </div>
                        <div>
                          <p className="text-[#617c89] dark:text-gray-400">Lectura actual</p>
                          <p className="font-semibold text-[#111618] dark:text-white">{selectedBoleta.lectura.lecturaActual} m³</p>
                        </div>
                        <div>
                          <p className="text-[#617c89] dark:text-gray-400">Consumo</p>
                          <p className="font-semibold text-[#111618] dark:text-white">{formatearMonto(selectedBoleta.consumo_m3)} m³</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BoletasClienteAdmin;


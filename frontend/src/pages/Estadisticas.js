import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../services/axios';

const StatCard = ({ title, value, subtitle, icon, accent = 'primary' }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 border border-slate-100 dark:border-slate-700">
    <div className="flex items-center justify-between mb-3">
      <div className="bg-primary/10 text-primary rounded-full p-2">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {accent}
      </span>
    </div>
    <p className="text-sm text-slate-500 dark:text-slate-300">{title}</p>
    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    {subtitle && (
      <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">{subtitle}</p>
    )}
  </div>
);

function Estadisticas() {
  const [data, setData] = useState(null);
  const [tendencias, setTendencias] = useState(null);
  const [deudaPorZona, setDeudaPorZona] = useState([]);
  const [topDeudaClientes, setTopDeudaClientes] = useState([]);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarTodo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resumenRes, tendenciasRes, deudaZonaRes, topClientesRes] =
        await Promise.all([
          axios.get('/estadisticas/resumen', {
            params: {
              desde: filtros.desde || undefined,
              hasta: filtros.hasta || undefined,
            },
          }),
          axios.get('/estadisticas/tendencias', { params: { meses: 12 } }),
          axios.get('/estadisticas/deuda-por-zona', { params: { limit: 10 } }),
          axios.get('/estadisticas/top-deuda-clientes', { params: { limit: 20 } }),
        ]);

      setData(resumenRes.data);
      setTendencias(tendenciasRes.data);
      setDeudaPorZona(deudaZonaRes.data || []);
      setTopDeudaClientes(topClientesRes.data || []);
    } catch (err) {
      setError('No se pudieron cargar las estadísticas. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatoMoneda = useMemo(
    () =>
      new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
      }),
    [],
  );

  const pagosPorMetodo = data?.pagos?.porMetodo || {};
  const tasas = data?.pagos?.tasas || {};
  const proximasVencer = data?.boletas?.proximasVencer || {};

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Panel de Estadísticas
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Visibilidad rápida de cobros, medidores y estados de servicio.
            </p>
          </div>
          <div className="bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined">query_stats</span>
            Actualizado en vivo
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-400">Desde</label>
            <input
              type="date"
              value={filtros.desde}
              onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))}
              className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 dark:text-slate-400">Hasta</label>
            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))}
              className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={cargarTodo}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-primary/90"
            >
              Aplicar filtros
            </button>
            <button
              onClick={() => {
                setFiltros({ desde: '', hasta: '' });
                cargarTodo();
              }}
              className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700"
            >
              Limpiar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Cargando estadísticas...
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Pagos aprobados"
                value={data?.pagos?.aprobados ?? 0}
                subtitle={`Monto cobrado ${formatoMoneda.format(data?.pagos?.montoAprobado ?? 0)}`}
                icon="verified"
                accent="cobros"
              />
              <StatCard
                title="Pagos pendientes"
                value={data?.pagos?.pendientes ?? 0}
                subtitle="Esperando revisión"
                icon="hourglass_bottom"
                accent="atención"
              />
              <StatCard
                title="Pagos rechazados"
                value={data?.pagos?.rechazados ?? 0}
                subtitle="Requieren reenvío"
                icon="block"
                accent="alerta"
              />
              <StatCard
                title="Tasa de aprobación"
                value={`${Math.round((tasas.aprobacion || 0) * 100)}%`}
                subtitle={`Rechazo: ${Math.round((tasas.rechazo || 0) * 100)}%`}
                icon="percent"
                accent="quality"
              />
              <StatCard
                title="Clientes"
                value={data?.usuarios?.totalClientes ?? 0}
                subtitle="Solo clientes activos en el sistema"
                icon="group"
                accent="clientes"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Cobros por método
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Solo pagos aprobados
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">payments</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.keys(pagosPorMetodo).map((metodo) => (
                    <div
                      key={metodo}
                      className="p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                    >
                      <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                        {metodo}
                      </p>
                      <p className="text-xl font-semibold text-slate-900 dark:text-white">
                        {pagosPorMetodo[metodo]?.cantidad ?? 0}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatoMoneda.format(pagosPorMetodo[metodo]?.monto ?? 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Medidores
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Cobertura y estado de los medidores
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">speed</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StatCard
                    title="Clientes con medidor activo"
                    value={data?.medidores?.clientesConMedidorActivo ?? 0}
                    subtitle={`Total con historial: ${data?.medidores?.clientesConMedidor ?? 0}`}
                    icon="check_circle"
                    accent="medidores"
                  />
                  <StatCard
                    title="Clientes sin medidor"
                    value={data?.medidores?.clientesSinMedidor ?? 0}
                    subtitle="Asignación pendiente"
                    icon="priority_high"
                    accent="pendiente"
                  />
                  <StatCard
                    title="Medidores dados de baja"
                    value={data?.medidores?.medidoresDadosDeBaja ?? 0}
                    subtitle={`Rotos: ${data?.medidores?.medidoresRotos ?? 0}`}
                    icon="build"
                    accent="baja"
                  />
                  <StatCard
                    title="Boletas sin medidor"
                    value={data?.boletas?.sinMedidor ?? 0}
                    subtitle={`Con medidor: ${data?.boletas?.conMedidor ?? 0}`}
                    icon="receipt_long"
                    accent="consumo"
                  />
                  <StatCard
                    title="Próximas a vencer"
                    value={proximasVencer?.cantidad ?? 0}
                    subtitle={`En ${proximasVencer?.diasVencimiento ?? 0} días - ${formatoMoneda.format(proximasVencer?.monto ?? 0)}`}
                    icon="event_upcoming"
                    accent="alerta"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Deuda por zona
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Top zonas con mayor deuda pendiente
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">map</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 dark:text-slate-400">
                        <th className="py-2 pr-4">Zona</th>
                        <th className="py-2 pr-4">Boletas</th>
                        <th className="py-2 pr-4">Deuda</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deudaPorZona.map((row, idx) => (
                        <tr key={`${row.zonaId}-${idx}`} className="border-b border-slate-100 dark:border-slate-700">
                          <td className="py-2 pr-4">{row.zonaNombre || 'Sin zona'}</td>
                          <td className="py-2 pr-4">{row.boletas}</td>
                          <td className="py-2 pr-4 font-semibold">
                            {formatoMoneda.format(row.monto || 0)}
                          </td>
                        </tr>
                      ))}
                      {deudaPorZona.length === 0 && (
                        <tr>
                          <td className="py-3 text-slate-500" colSpan={3}>
                            Sin datos para mostrar.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Estados de servicio
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Distribución de clientes por estado
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">monitor_heart</span>
                </div>
                <div className="space-y-3">
                  {data?.usuarios?.estadosServicio &&
                    Object.entries(data.usuarios.estadosServicio).map(
                      ([estado, cantidad]) => (
                        <div
                          key={estado}
                          className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-900/40"
                        >
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">circle</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {estado.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Clientes en este estado
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {cantidad}
                          </span>
                        </div>
                      ),
                    )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Boletas
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Estado de facturación y deuda pendiente
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">description</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data?.boletas?.porEstado &&
                    Object.entries(data.boletas.porEstado).map(([estado, info]) => (
                      <div
                        key={estado}
                        className="p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40"
                      >
                        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                          {estado}
                        </p>
                        <p className="text-xl font-semibold text-slate-900 dark:text-white">
                          {info.cantidad}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatoMoneda.format(info.monto ?? 0)}
                        </p>
                      </div>
                    ))}
                </div>
                <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-800 dark:text-amber-100 font-semibold">
                      Deuda pendiente estimada
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-200/80">
                      Suma de boletas pendientes, procesando o vencidas
                    </p>
                  </div>
                  <p className="text-lg font-bold text-amber-900 dark:text-amber-50">
                    {formatoMoneda.format(data?.boletas?.deudaPendiente ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Tendencias de cobros (12 meses)
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Cantidad y monto aprobado por mes y método de pago
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">show_chart</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 dark:text-slate-400">
                        <th className="py-2 pr-4">Mes</th>
                        <th className="py-2 pr-4">Aprobados</th>
                        <th className="py-2 pr-4">Monto</th>
                        <th className="py-2 pr-4">Transf.</th>
                        <th className="py-2 pr-4">Efectivo</th>
                        <th className="py-2 pr-4">Tarjeta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tendencias?.pagos?.map((row) => (
                        <tr key={row.mes} className="border-b border-slate-100 dark:border-slate-700">
                          <td className="py-2 pr-4">{row.mes}</td>
                          <td className="py-2 pr-4">{row.pagos_aprobados}</td>
                          <td className="py-2 pr-4 font-semibold">
                            {formatoMoneda.format(row.monto_aprobado || 0)}
                          </td>
                          <td className="py-2 pr-4">
                            {row.transferencia_cant} ({formatoMoneda.format(row.transferencia_monto || 0)})
                          </td>
                          <td className="py-2 pr-4">
                            {row.efectivo_cant} ({formatoMoneda.format(row.efectivo_monto || 0)})
                          </td>
                          <td className="py-2 pr-4">
                            {row.tarjeta_cant} ({formatoMoneda.format(row.tarjeta_monto || 0)})
                          </td>
                        </tr>
                      ))}
                      {!tendencias?.pagos?.length && (
                        <tr>
                          <td className="py-3 text-slate-500" colSpan={6}>
                            Sin datos de tendencia aún.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Tendencias de boletas (12 meses)
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Emitidas vs. pagadas por mes
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-primary">timeline</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 dark:text-slate-400">
                        <th className="py-2 pr-4">Mes</th>
                        <th className="py-2 pr-4">Emitidas</th>
                        <th className="py-2 pr-4">Pagadas</th>
                        <th className="py-2 pr-4">Monto pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tendencias?.boletas?.map((row) => (
                        <tr key={row.mes} className="border-b border-slate-100 dark:border-slate-700">
                          <td className="py-2 pr-4">{row.mes}</td>
                          <td className="py-2 pr-4">{row.boletas_emitidas}</td>
                          <td className="py-2 pr-4">{row.boletas_pagadas}</td>
                          <td className="py-2 pr-4 font-semibold">
                            {formatoMoneda.format(row.monto_pagado || 0)}
                          </td>
                        </tr>
                      ))}
                      {!tendencias?.boletas?.length && (
                        <tr>
                          <td className="py-3 text-slate-500" colSpan={4}>
                            Sin datos de tendencia aún.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Top clientes con mayor deuda
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Ranking por monto adeudado (boletas pendientes/procesando/vencidas)
                  </p>
                </div>
                <span className="material-symbols-outlined text-primary">trophy</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400">
                      <th className="py-2 pr-4">Cliente</th>
                      <th className="py-2 pr-4">Padrón</th>
                      <th className="py-2 pr-4">Boletas</th>
                      <th className="py-2 pr-4">Deuda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDeudaClientes.map((row) => (
                      <tr key={row.usuarioId} className="border-b border-slate-100 dark:border-slate-700">
                        <td className="py-2 pr-4">{row.nombre || 'Sin nombre'}</td>
                        <td className="py-2 pr-4">{row.padron || '-'}</td>
                        <td className="py-2 pr-4">{row.boletas}</td>
                        <td className="py-2 pr-4 font-semibold">
                          {formatoMoneda.format(row.monto || 0)}
                        </td>
                      </tr>
                    ))}
                    {topDeudaClientes.length === 0 && (
                      <tr>
                        <td className="py-3 text-slate-500" colSpan={4}>
                          Sin clientes en deuda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Estadisticas;


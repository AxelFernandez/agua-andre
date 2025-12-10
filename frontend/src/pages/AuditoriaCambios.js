import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import axios from '../services/axios';

const ACCIONES = [
  { value: '', label: 'Todas las acciones' },
  { value: 'creacion', label: 'Creación' },
  { value: 'actualizacion', label: 'Actualización' },
  { value: 'eliminacion', label: 'Eliminación' },
  { value: 'recalculo', label: 'Re-cálculo' },
];

const MODULOS = [
  { value: '', label: 'Todos los módulos' },
  { value: 'boletas', label: 'Boletas' },
  { value: 'lecturas', label: 'Lecturas' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'usuarios', label: 'Usuarios' },
];

const initialFilters = {
  modulo: '',
  accion: '',
  usuarioId: '',
  registroId: '',
  desde: '',
  hasta: '',
};

const actionStyles = {
  creacion: 'bg-green-50 text-green-700',
  actualizacion: 'bg-amber-50 text-amber-700',
  eliminacion: 'bg-red-50 text-red-700',
  recalculo: 'bg-blue-50 text-blue-700',
};

function AuditoriaCambios() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [error, setError] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = async (currentFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = Object.entries(currentFilters).reduce((acc, [key, value]) => {
        if (value) {
          acc[key] = value;
        }
        return acc;
      }, {});

      params.limit = 100;

      const response = await axios.get('/auditoria', { params });
      setLogs(response.data || []);
    } catch (err) {
      console.error('Error al cargar auditoría:', err);
      setError('No se pudieron cargar los registros de auditoría. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchLogs(filters);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    fetchLogs(initialFilters);
  };

  const formatFecha = (fechaIso) => {
    if (!fechaIso) return 'N/A';
    return new Date(fechaIso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatJSON = (obj) => {
    if (!obj || Object.keys(obj).length === 0) {
      return 'Sin datos';
    }
    return JSON.stringify(obj, null, 2);
  };

  const toggleExpand = (logId) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Auditoría en tiempo real</h1>
            <p className="text-gray-600 mt-2">
              Revisa cada modificación que realizan operarios y administrativos sobre datos sensibles.
            </p>
          </header>

          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col flex-1 min-w-[200px]">
                <label className="text-sm text-gray-600 mb-1">Módulo</label>
                <select
                  name="modulo"
                  value={filters.modulo}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {MODULOS.map((modulo) => (
                    <option key={modulo.value} value={modulo.value}>
                      {modulo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col flex-1 min-w-[200px]">
                <label className="text-sm text-gray-600 mb-1">Acción</label>
                <select
                  name="accion"
                  value={filters.accion}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ACCIONES.map((accion) => (
                    <option key={accion.value} value={accion.value}>
                      {accion.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col flex-1 min-w-[200px]">
                <label className="text-sm text-gray-600 mb-1">ID Usuario</label>
                <input
                  type="number"
                  name="usuarioId"
                  value={filters.usuarioId}
                  onChange={handleFilterChange}
                  placeholder="Ej: 42"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col flex-1 min-w-[200px]">
                <label className="text-sm text-gray-600 mb-1">ID Registro</label>
                <input
                  type="text"
                  name="registroId"
                  value={filters.registroId}
                  onChange={handleFilterChange}
                  placeholder="Ej: 1050"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Desde</label>
                <input
                  type="date"
                  name="desde"
                  value={filters.desde}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Hasta</label>
                <input
                  type="date"
                  name="hasta"
                  value={filters.hasta}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={handleApplyFilters}
                className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Aplicar filtros
              </button>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </section>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <section className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Registros recientes</h2>
                <p className="text-sm text-gray-500">
                  Mostrando {logs.length} eventos. Se mantiene un máximo de 100 registros recientes.
                </p>
              </div>
              <button
                onClick={() => fetchLogs(filters)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Actualizar
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-600">Cargando registros de auditoría...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                  verified_user
                </span>
                <p className="text-gray-700 text-lg font-medium">Sin movimientos registrados</p>
                <p className="text-gray-500 text-sm mt-1">
                  Todavía no hay cambios para mostrar con los filtros seleccionados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Módulo / Entidad
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Registro
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Detalle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {formatFecha(log.creadoEn)}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-900">
                              {log.usuario?.nombre || 'Sistema'}
                            </p>
                            <p className="text-xs text-gray-500">ID: {log.usuario?.id ?? 'N/A'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs font-semibold px-3 py-1 rounded-full inline-flex ${
                                actionStyles[log.accion] || 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {ACCIONES.find((accion) => accion.value === log.accion)?.label ||
                                log.accion}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900 capitalize">{log.modulo}</p>
                            <p className="text-xs text-gray-500">{log.entidad}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{log.registroId}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-700">
                              {log.descripcion || 'Sin descripción'}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                            >
                              <span className="material-symbols-outlined text-base">
                                {expandedLogId === log.id ? 'expand_less' : 'visibility'}
                              </span>
                              {expandedLogId === log.id ? 'Ocultar' : 'Ver'}
                            </button>
                          </td>
                        </tr>

                        {expandedLogId === log.id && (
                          <tr className="bg-gray-50">
                            <td colSpan={7} className="px-6 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                    Datos previos
                                  </h3>
                                  <pre className="text-xs bg-gray-900 text-green-200 rounded-lg p-3 overflow-auto max-h-60">
                                    {formatJSON(log.datosPrevios)}
                                  </pre>
                                </div>
                                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                    Datos nuevos
                                  </h3>
                                  <pre className="text-xs bg-gray-900 text-blue-100 rounded-lg p-3 overflow-auto max-h-60">
                                    {formatJSON(log.datosNuevos)}
                                  </pre>
                                </div>
                              </div>
                              {log.metadata && (
                                <div className="mt-4 border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                    Metadatos
                                  </h3>
                                  <pre className="text-xs bg-gray-900 text-purple-100 rounded-lg p-3 overflow-auto max-h-48">
                                    {formatJSON(log.metadata)}
                                  </pre>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AuditoriaCambios;


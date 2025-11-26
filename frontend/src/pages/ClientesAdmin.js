import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../services/axios';
import Sidebar from '../components/Sidebar';

function ClientesAdmin() {
  const { API_URL } = useAuth();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [zonaFilter, setZonaFilter] = useState('todas');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [zonas, setZonas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filtrarClientes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes, searchTerm, zonaFilter, estadoFilter]);

  const cargarDatos = async () => {
    try {
      const [clientesRes, zonasRes] = await Promise.all([
        axios.get(`${API_URL}/usuarios`),
        axios.get(`${API_URL}/zonas`),
      ]);
      
      // Filtrar solo clientes
      const soloClientes = clientesRes.data.filter(u => u.rol === 'cliente');
      setClientes(soloClientes);
      setZonas(zonasRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarClientes = () => {
    let filtered = [...clientes];

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.nombre?.toLowerCase().includes(term) ||
          c.padron?.toLowerCase().includes(term) ||
          c.cuit?.toLowerCase().includes(term) ||
          c.direccion?.toLowerCase().includes(term)
      );
    }

    // Filtro de zona
    if (zonaFilter !== 'todas') {
      filtered = filtered.filter((c) => c.zona?.id === parseInt(zonaFilter));
    }

    // Filtro de estado
    if (estadoFilter !== 'todos') {
      if (estadoFilter === 'activo') {
        filtered = filtered.filter((c) => c.activo !== false);
      } else if (estadoFilter === 'inactivo') {
        filtered = filtered.filter((c) => c.activo === false);
      }
      // Para 'con-deuda' necesitarías agregar lógica de boletas pendientes
    }

    setFilteredClientes(filtered);
    setCurrentPage(1);
  };

  const getEstadoBadge = (cliente) => {
    // Determinar estado basado en datos reales del cliente
    // Por defecto todos los clientes son activos
    // Puedes modificar esta lógica según tus necesidades
    
    let estado = 'activo';
    
    // Si el cliente tiene campo activo en false, es inactivo
    if (cliente.activo === false) {
      estado = 'inactivo';
    }
    // Aquí podrías agregar lógica para detectar deuda:
    // else if (cliente.tieneDeuda || cliente.boletasPendientes > 0) {
    //   estado = 'con-deuda';
    // }
    
    const badgeClasses = {
      'activo': 'bg-active-green/10 text-active-green',
      'con-deuda': 'bg-debt-red/10 text-debt-red',
      'inactivo': 'bg-inactive-gray/10 text-inactive-gray',
    };

    const labels = {
      'activo': 'Activo',
      'con-deuda': 'Con Deuda',
      'inactivo': 'Inactivo',
    };

    return { class: badgeClasses[estado], label: labels[estado] };
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Page Heading */}
          <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h1 className="text-[#111618] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              Gestión de Clientes
            </h1>
            <button
              onClick={() => navigate('/administrativo/clientes/crear')}
              className="flex min-w-[84px] items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span className="truncate">Crear Nuevo Cliente</span>
            </button>
          </header>

          {/* Search & Filter Bar */}
          <div className="p-4 bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="flex flex-col w-full">
                  <div className="flex w-full flex-1 items-stretch rounded-lg h-12 bg-[#f0f3f4] dark:bg-gray-700">
                    <div className="text-[#617c89] dark:text-gray-400 flex items-center justify-center pl-4">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-[#111618] dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-[#617c89] dark:placeholder:text-gray-400 px-2 text-base font-normal leading-normal"
                      placeholder="Buscar por nombre, padrón, CUIT o dirección..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={zonaFilter}
                  onChange={(e) => setZonaFilter(e.target.value)}
                  className="flex h-12 w-full items-center justify-between gap-x-2 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 px-4 text-[#111618] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 border-none focus:outline-none focus:ring-0"
                >
                  <option value="todas">Zona: Todas</option>
                  {zonas.map((zona) => (
                    <option key={zona.id} value={zona.id}>
                      Zona: {zona.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className="flex h-12 w-full items-center justify-between gap-x-2 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 px-4 text-[#111618] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 border-none focus:outline-none focus:ring-0"
                >
                  <option value="todos">Estado: Todos</option>
                  <option value="activo">Activo</option>
                  <option value="con-deuda">Con Deuda</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-4">
              <p className="text-[#617c89] dark:text-gray-400 text-sm font-medium mb-1">Total Clientes</p>
              <p className="text-2xl font-bold text-[#111618] dark:text-white">{clientes.length}</p>
            </div>
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-4">
              <p className="text-[#617c89] dark:text-gray-400 text-sm font-medium mb-1">Activos</p>
              <p className="text-2xl font-bold text-active-green">
                {clientes.filter(c => c.activo !== false).length}
              </p>
            </div>
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-4">
              <p className="text-[#617c89] dark:text-gray-400 text-sm font-medium mb-1">Con Deuda</p>
              <p className="text-2xl font-bold text-debt-red">0</p>
            </div>
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-4">
              <p className="text-[#617c89] dark:text-gray-400 text-sm font-medium mb-1">Inactivos</p>
              <p className="text-2xl font-bold text-inactive-gray">
                {clientes.filter(c => c.activo === false).length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-[#dbe2e6] dark:border-gray-700 bg-white dark:bg-background-dark shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-[#617c89]">Cargando clientes...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white dark:bg-gray-800">
                      <tr className="border-b dark:border-gray-700">
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                          Padrón
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                          Nombre Completo
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                          CUIT
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                          Dirección
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                          Zona
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                          Teléfono
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider text-center">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbe2e6] dark:divide-gray-700">
                      {currentItems.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center text-[#617c89]">
                            No se encontraron clientes
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((cliente) => {
                          const estado = getEstadoBadge(cliente);
                          return (
                            <tr key={cliente.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#617c89] dark:text-gray-400">
                                {cliente.padron}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111618] dark:text-white">
                                {cliente.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#617c89] dark:text-gray-400">
                                {cliente.cuit || '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-[#617c89] dark:text-gray-400 max-w-xs truncate">
                                {cliente.direccion}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#617c89] dark:text-gray-400">
                                {cliente.zona?.nombre}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-[#617c89] dark:text-gray-400">
                                {cliente.whatsapp || cliente.telefono || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estado.class}`}>
                                  {estado.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <button
                                  onClick={() => navigate(`/administrativo/clientes/editar/${cliente.id}`)}
                                  className="text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 p-2 rounded-full hover:bg-primary/10 transition-colors"
                                  title="Editar cliente"
                                >
                                  <span className="material-symbols-outlined text-xl">edit</span>
                                </button>
                                <button
                                  onClick={() => navigate(`/administrativo/clientes/ver/${cliente.id}`)}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  title="Ver detalles"
                                >
                                  <span className="material-symbols-outlined text-xl">visibility</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-[#dbe2e6] dark:border-gray-700 px-6 py-3">
                  <p className="text-sm text-[#617c89] dark:text-gray-400">
                    Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(indexOfLastItem, filteredClientes.length)}</span> de{' '}
                    <span className="font-medium">{filteredClientes.length}</span> resultados
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center justify-center h-8 w-8 rounded-lg border dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 text-[#333333] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-xl">chevron_left</span>
                    </button>
                    <span className="text-sm text-[#617c89] dark:text-gray-400">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center justify-center h-8 w-8 rounded-lg border dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 text-[#333333] hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-xl">chevron_right</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ClientesAdmin;


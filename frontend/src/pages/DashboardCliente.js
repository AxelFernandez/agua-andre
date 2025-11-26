import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../services/axios';

function DashboardCliente() {
  const { user, logout, API_URL } = useAuth();
  const navigate = useNavigate();
  const [boletas, setBoletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('boletas');

  useEffect(() => {
    cargarBoletas();
  }, []);

  const cargarBoletas = async () => {
    try {
      const response = await axios.get(`${API_URL}/boletas/usuario/${user.id}`);
      setBoletas(response.data);
    } catch (error) {
      console.error('Error al cargar boletas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const estadoColor = (estado) => {
    switch (estado) {
      case 'pagada':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'vencida':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="size-8 text-blue-600">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Portal Cliente</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user?.nombre}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Información del cliente */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Información de Cuenta</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Padrón</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.padron}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Dirección</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.direccion || 'No registrada'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Zona</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.zona?.nombre || 'No asignada'}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('boletas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'boletas'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Mis Boletas
              </button>
              <button
                onClick={() => setActiveTab('consumo')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'consumo'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                Consumo
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido */}
        {activeTab === 'boletas' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Boletas de Pago</h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-slate-500">Cargando...</div>
            ) : boletas.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No hay boletas registradas</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Período</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vencimiento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {boletas.map((boleta) => (
                      <tr key={boleta.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {boleta.mes}/{boleta.anio}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">
                          ${parseFloat(boleta.montoTotal).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                          {new Date(boleta.fechaVencimiento).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoColor(boleta.estado)}`}>
                            {boleta.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {boleta.estado === 'pendiente' && (
                            <button className="text-blue-600 hover:text-blue-900 font-medium">
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'consumo' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Historial de Consumo</h3>
            <div className="text-slate-500 text-center py-8">
              Información de consumo disponible próximamente
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardCliente;


import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../services/axios';

function DashboardOperario() {
  const { user, logout, API_URL } = useAuth();
  const navigate = useNavigate();
  const [padronBusqueda, setPadronBusqueda] = useState('');
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [ultimaLectura, setUltimaLectura] = useState(null);
  const [nuevaLectura, setNuevaLectura] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const buscarUsuario = async () => {
    setLoading(true);
    setMensaje('');
    try {
      const response = await axios.get(`${API_URL}/usuarios/padron/${padronBusqueda}`);
      setUsuarioEncontrado(response.data);
      
      // Buscar última lectura
      if (response.data.medidor) {
        const lecturaResponse = await axios.get(`${API_URL}/lecturas/medidor/${response.data.medidor.id}/ultima`);
        setUltimaLectura(lecturaResponse.data);
      }
    } catch (error) {
      setMensaje('Usuario no encontrado');
      setUsuarioEncontrado(null);
      setUltimaLectura(null);
    } finally {
      setLoading(false);
    }
  };

  const guardarLectura = async () => {
    if (!nuevaLectura || !usuarioEncontrado?.medidor) return;

    setLoading(true);
    setMensaje('');
    try {
      await axios.post(`${API_URL}/lecturas`, {
        medidorId: usuarioEncontrado.medidor.id,
        lecturaActual: parseFloat(nuevaLectura),
      });
      
      setMensaje('Lectura guardada exitosamente');
      setNuevaLectura('');
      setPadronBusqueda('');
      setUsuarioEncontrado(null);
      setUltimaLectura(null);
    } catch (error) {
      setMensaje(error.response?.data?.message || 'Error al guardar lectura');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const calcularConsumo = () => {
    if (!nuevaLectura || !ultimaLectura) return 0;
    return parseFloat(nuevaLectura) - parseFloat(ultimaLectura.lecturaActual);
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
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Portal Operario</h1>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Búsqueda */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Buscar Usuario por Padrón</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={padronBusqueda}
              onChange={(e) => setPadronBusqueda(e.target.value)}
              placeholder="Ingrese el padrón (ej: 10-0036)"
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <button
              onClick={buscarUsuario}
              disabled={loading || !padronBusqueda}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buscar
            </button>
          </div>
          
          {mensaje && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              mensaje.includes('Error') || mensaje.includes('no encontrado')
                ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
                : 'bg-green-50 dark:bg-green-900/20 text-green-600'
            }`}>
              {mensaje}
            </div>
          )}
        </div>

        {/* Información del usuario */}
        {usuarioEncontrado && (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6 mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Información del Usuario</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nombre</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{usuarioEncontrado.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Padrón</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{usuarioEncontrado.padron}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Dirección</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{usuarioEncontrado.direccion}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Medidor</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {usuarioEncontrado.medidor?.numeroSerie || 'Sin medidor'}
                  </p>
                </div>
              </div>
            </div>

            {/* Última lectura y nueva lectura */}
            {usuarioEncontrado.medidor && (
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Registro de Lectura</h3>
                
                {ultimaLectura && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Última Lectura</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Lectura</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {parseFloat(ultimaLectura.lecturaActual).toFixed(2)} m³
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Consumo</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                          {parseFloat(ultimaLectura.consumoM3).toFixed(2)} m³
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Fecha</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">
                          {new Date(ultimaLectura.fechaLectura).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nueva Lectura (m³)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={nuevaLectura}
                      onChange={(e) => setNuevaLectura(e.target.value)}
                      placeholder="Ingrese la lectura actual"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/50 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {nuevaLectura && ultimaLectura && (
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Consumo calculado</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {calcularConsumo().toFixed(2)} m³
                      </p>
                    </div>
                  )}

                  <button
                    onClick={guardarLectura}
                    disabled={loading || !nuevaLectura}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Guardar Lectura
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardOperario;


import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../services/axios';
import DetalleBoleta from '../components/DetalleBoleta';

function DashboardCliente() {
  const { user, logout, API_URL } = useAuth();
  const navigate = useNavigate();
  const [boletas, setBoletas] = useState([]);
  const [lecturas, setLecturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    consumoActual: 0,
    totalAPagar: 0,
  });
  const [boletaSeleccionada, setBoletaSeleccionada] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    try {
      // Cargar boletas con relaciones completas
      const boletasRes = await axios.get(`${API_URL}/boletas/usuario/${user.id}`);
      const boletasOrdenadas = boletasRes.data.sort((a, b) => {
        if (a.anio !== b.anio) return b.anio - a.anio;
        return b.mes - a.mes;
      });
      setBoletas(boletasOrdenadas);

      // Calcular total de boletas pendientes
      const totalPendiente = boletasOrdenadas
        .filter(b => b.estado === 'pendiente' || b.estado === 'procesando')
        .reduce((sum, b) => sum + parseFloat(b.total || 0), 0);

      // Cargar lecturas si tiene medidor
      let consumoActual = 0;
      if (user.medidores && user.medidores.length > 0) {
        const medidorActivo = user.medidores.find(m => m.activo);
        if (medidorActivo) {
          try {
            const lecturasRes = await axios.get(`${API_URL}/lecturas?medidorId=${medidorActivo.id}`);
            if (lecturasRes.data && lecturasRes.data.length > 0) {
              const lecturasOrdenadas = lecturasRes.data.sort((a, b) => 
                new Date(b.fechaLectura) - new Date(a.fechaLectura)
              );
              const lecturasParaGrafico = lecturasOrdenadas.slice(0, 6).reverse();
              console.log('Lecturas para gráfico:', lecturasParaGrafico);
              setLecturas(lecturasParaGrafico);
              
              // Usar el consumo de la última lectura
              if (lecturasOrdenadas.length > 0) {
                consumoActual = parseFloat(lecturasOrdenadas[0].consumoM3) || 0;
              }
            }
          } catch (err) {
            console.log('No se pudieron cargar lecturas:', err);
          }
        }
      }

      // Si no hay lecturas pero hay boletas, usar el consumo de la boleta más reciente
      if (consumoActual === 0 && boletasOrdenadas.length > 0) {
        consumoActual = parseFloat(boletasOrdenadas[0].consumo_m3) || 0;
      }

      // Actualizar stats
      setStats({
        consumoActual: consumoActual,
        totalAPagar: totalPendiente,
      });
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = async (boleta) => {
    try {
      // Cargar boleta completa con todas las relaciones
      const response = await axios.get(`${API_URL}/boletas/${boleta.id}`);
      setBoletaSeleccionada(response.data);
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error al cargar detalle de boleta:', error);
    }
  };

  const handleCerrarDetalle = () => {
    setShowDetalleModal(false);
    setBoletaSeleccionada(null);
  };

  const handlePagarBoleta = (boleta) => {
    navigate(`/cliente/pagar-boleta/${boleta.id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const estadoColor = (estado) => {
    switch (estado) {
      case 'pagada':
        return 'bg-green-500/10 text-green-600';
      case 'procesando':
        return 'bg-blue-500/10 text-blue-600';
      case 'pendiente':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'vencida':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const estadoTexto = (estado) => {
    switch (estado) {
      case 'pagada':
        return 'Pagada';
      case 'procesando':
        return 'En Proceso';
      case 'pendiente':
        return 'Pendiente';
      case 'vencida':
        return 'Vencida';
      default:
        return estado;
    }
  };

  const obtenerBoletaPendiente = () => {
    // Priorizar boletas pendientes, luego procesando
    return boletas.find(b => b.estado === 'pendiente') || 
           boletas.find(b => b.estado === 'procesando') || 
           null;
  };

  const formatearMes = (mes) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[mes - 1] || mes;
  };

  const formatearPeriodo = (mes, anio) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[mes - 1]} ${anio}`;
  };

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calcularAltura = (consumo) => {
    if (!lecturas.length) return 0;
    const maxConsumo = Math.max(...lecturas.map(l => l.consumoM3 || 0));
    if (maxConsumo === 0) return 0;
    const altura = ((consumo || 0) / maxConsumo) * 100;
    // Asegurar que al menos se vea algo si hay consumo
    return altura > 0 ? Math.max(altura, 10) : 0;
  };

  const ultimoPagoRechazado = useMemo(() => {
    const pagosRechazados = boletas.flatMap(b =>
      (b.pagos || []).filter(p => p.estado === 'rechazado').map(p => ({ ...p, boleta: b }))
    );
    if (!pagosRechazados.length) return null;
    return pagosRechazados.sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))[0];
  }, [boletas]);

  const boletaPendiente = obtenerBoletaPendiente();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101c22] flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101c22]">
      {/* Modal de Detalle */}
      {showDetalleModal && (
        <DetalleBoleta 
          boleta={boletaSeleccionada} 
          onClose={handleCerrarDetalle}
        />
      )}

      {/* Header */}
      <header className="bg-white dark:bg-[#101c22] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.nombre?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#111618] dark:text-white">Portal Cliente</h1>
                <p className="text-sm text-[#617c89] dark:text-gray-400">{user?.padron}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-[#617c89] dark:text-gray-400 hover:text-[#111618] dark:hover:text-white transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {ultimoPagoRechazado && ultimoPagoRechazado.boleta?.estado === 'pendiente' && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined">cancel</span>
              <div>
                <p className="font-semibold">Pago rechazado</p>
                <p className="mt-1">
                  Boleta {ultimoPagoRechazado.boleta.mes}/{ultimoPagoRechazado.boleta.anio} • ID #{ultimoPagoRechazado.boleta.id}
                </p>
                {ultimoPagoRechazado.observaciones && (
                  <p className="mt-1">{ultimoPagoRechazado.observaciones}</p>
                )}
                <p className="mt-1 text-xs text-red-700">
                  Fecha: {formatearFechaHora(ultimoPagoRechazado.fechaPago)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Page Heading */}
        <div className="flex flex-wrap justify-between gap-3 items-center mb-6">
          <h1 className="text-[#111618] dark:text-white text-3xl md:text-4xl font-black leading-tight">
            Bienvenido, {user?.nombre}
          </h1>
        </div>

        {/* Section Header */}
        <h2 className="text-[#111618] dark:text-white text-xl md:text-[22px] font-bold leading-tight mb-4">
          Consumo del Mes Actual
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#101c22] border border-[#dbe2e6] dark:border-gray-700">
            <p className="text-[#617c89] dark:text-gray-300 text-base font-medium leading-normal">
              Consumo (m³)
            </p>
            <p className="text-[#111618] dark:text-white tracking-light text-3xl font-bold leading-tight">
              {stats.consumoActual.toFixed(0)}
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#101c22] border border-[#dbe2e6] dark:border-gray-700">
            <p className="text-[#617c89] dark:text-gray-300 text-base font-medium leading-normal">
              Monto Total a Pagar
            </p>
            <p className="text-[#111618] dark:text-white tracking-light text-3xl font-bold leading-tight">
              ${parseFloat(stats.totalAPagar).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Grid con Historial y Boleta Pendiente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Historial de Consumo */}
          <div className="lg:col-span-2">
            <h2 className="text-[#111618] dark:text-white text-xl md:text-[22px] font-bold leading-tight mb-4">
              Tu Historial de Consumo
            </h2>
            <div className="flex flex-col gap-2 rounded-xl border border-[#dbe2e6] dark:border-gray-700 p-6 bg-white dark:bg-[#101c22]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[#617c89] dark:text-gray-300 text-base font-medium leading-normal">
                    Consumo Total
                  </p>
                  <p className="text-[#007BFF] tracking-light text-2xl md:text-[32px] font-bold leading-tight truncate">
                    {lecturas.reduce((sum, l) => sum + (l.consumoM3 || 0), 0).toFixed(0)} m³
                  </p>
                </div>
                <div className="flex gap-1 items-center">
                  <p className="text-[#617c89] dark:text-gray-400 text-sm font-normal leading-normal">
                    Últimos {lecturas.length} Meses
                  </p>
                </div>
              </div>
              
              {/* Chart */}
              {lecturas.length > 0 ? (
                <div className="grid min-h-[220px] grid-flow-col gap-4 grid-rows-[1fr_auto] items-end justify-items-center px-3 pt-4">
                  {lecturas.map((lectura, index) => {
                    const altura = calcularAltura(lectura.consumoM3);
                    const consumo = parseFloat(lectura.consumoM3) || 0;
                    return (
                      <div key={index} className="flex flex-col items-center w-full h-full justify-end group relative">
                        {/* Tooltip con consumo */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          {consumo.toFixed(2)} m³
                        </div>
                        <div 
                          className={`${
                            index === lecturas.length - 1 
                              ? 'bg-[#007BFF]' 
                              : 'bg-[#007BFF]/20 dark:bg-[#007BFF]/30 group-hover:bg-[#007BFF]'
                          } w-full rounded-t-md transition-all duration-200`}
                          style={{ 
                            height: altura > 0 ? `${altura}%` : '5%',
                            minHeight: consumo > 0 ? '20px' : '5px'
                          }}
                        ></div>
                        <p className={`${
                          index === lecturas.length - 1 
                            ? 'text-[#007BFF] font-bold' 
                            : 'text-[#617c89] dark:text-gray-400'
                        } text-xs leading-normal tracking-[0.015em] pt-2`}>
                          {formatearMes(lectura.mes)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[220px] flex flex-col items-center justify-center text-[#617c89] dark:text-gray-400">
                  <svg className="w-16 h-16 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p>No hay datos de consumo disponibles</p>
                  <p className="text-xs mt-1">Las lecturas aparecerán aquí cuando se registren</p>
                </div>
              )}
            </div>
          </div>

          {/* Boleta Pendiente */}
          <div className="lg:col-span-1">
            <h2 className="text-[#111618] dark:text-white text-xl md:text-[22px] font-bold leading-tight mb-4">
              Boleta Pendiente
            </h2>
            {boletaPendiente ? (
              <div className="flex flex-col gap-4 rounded-xl border border-[#dbe2e6] dark:border-gray-700 p-6 bg-white dark:bg-[#101c22]">
                <div className="flex justify-between items-center">
                  <p className="text-[#111618] dark:text-gray-300 font-medium">
                    {formatearPeriodo(boletaPendiente.mes, boletaPendiente.anio)}
                  </p>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${estadoColor(boletaPendiente.estado)}`}>
                    {estadoTexto(boletaPendiente.estado)}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#617c89] dark:text-gray-400">Monto a Pagar</p>
                  <p className="text-4xl font-bold text-[#111618] dark:text-white">
                    ${parseFloat(boletaPendiente.total).toFixed(2)}
                  </p>
                  <p className="text-xs text-[#DC3545] mt-1">
                    Vence el {new Date(boletaPendiente.fechaVencimiento).toLocaleDateString('es-AR')}
                  </p>
                </div>
                {boletaPendiente.estado === 'pendiente' ? (
                  <button 
                    onClick={() => handlePagarBoleta(boletaPendiente)}
                    className="w-full bg-[#007BFF] text-white font-medium py-3 rounded-lg hover:bg-[#007BFF]/90 transition-colors"
                  >
                    Pagar Boleta
                  </button>
                ) : (
                  <button 
                    onClick={() => handleVerDetalle(boletaPendiente)}
                    className="w-full bg-gray-500 text-white font-medium py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Ver Detalle
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-xl border border-[#dbe2e6] dark:border-gray-700 p-6 bg-white dark:bg-[#101c22]">
                <div className="text-center py-8">
                  <p className="text-[#617c89] dark:text-gray-400">No hay boletas pendientes</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div>
          <h2 className="text-[#111618] dark:text-white text-xl md:text-[22px] font-bold leading-tight mb-4">
            Estado de Cuenta y Boletas
          </h2>
          <div className="overflow-x-auto bg-white dark:bg-[#101c22] rounded-xl border border-[#dbe2e6] dark:border-gray-700">
            {boletas.length === 0 ? (
              <div className="p-8 text-center text-[#617c89] dark:text-gray-400">
                No hay boletas registradas
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-[#617c89] dark:text-gray-400 uppercase">
                  <tr>
                    <th scope="col" className="px-6 py-3">Período</th>
                    <th scope="col" className="px-6 py-3">Vencimiento</th>
                    <th scope="col" className="px-6 py-3">Monto</th>
                    <th scope="col" className="px-6 py-3">Estado</th>
                    <th scope="col" className="px-6 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {boletas.map((boleta, index) => (
                    <tr 
                      key={boleta.id}
                      className={index !== boletas.length - 1 ? 'border-b dark:border-gray-700' : ''}
                    >
                      <td className="px-6 py-4 font-medium text-[#111618] dark:text-white whitespace-nowrap">
                        {formatearPeriodo(boleta.mes, boleta.anio)}
                      </td>
                      <td className="px-6 py-4 text-[#617c89] dark:text-gray-400">
                        {new Date(boleta.fechaVencimiento).toLocaleDateString('es-AR')}
                      </td>
                      <td className="px-6 py-4 text-[#617c89] dark:text-gray-400">
                        ${parseFloat(boleta.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${estadoColor(boleta.estado)}`}>
                          {estadoTexto(boleta.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            if (boleta.estado === 'pendiente') {
                              navigate(`/cliente/pagar-boleta/${boleta.id}`);
                            } else {
                              handleVerDetalle(boleta);
                            }
                          }}
                          className="font-medium text-[#007BFF] hover:underline"
                        >
                          {boleta.estado === 'pendiente' ? 'Pagar' : (boleta.estado === 'procesando' ? 'Ver Estado' : 'Ver Detalle')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardCliente;

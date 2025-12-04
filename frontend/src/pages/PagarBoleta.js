import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../services/axios';

function PagarBoleta() {
  const { boletaId } = useParams();
  const { user, API_URL } = useAuth();
  const navigate = useNavigate();
  const [boleta, setBoleta] = useState(null);
  const [lecturas, setLecturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comprobante, setComprobante] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boletaId]);

  const cargarDatos = async () => {
    try {
      // Cargar boleta completa (incluye desglose_consumo guardado)
      const boletaRes = await axios.get(`${API_URL}/boletas/${boletaId}`);
      setBoleta(boletaRes.data);

      // Cargar lecturas del historial si tiene medidor
      if (user.medidores && user.medidores.length > 0) {
        const medidorActivo = user.medidores.find(m => m.activo);
        if (medidorActivo) {
          try {
            const lecturasRes = await axios.get(`${API_URL}/lecturas?medidorId=${medidorActivo.id}`);
            const lecturasOrdenadas = lecturasRes.data
              .sort((a, b) => new Date(b.fechaLectura) - new Date(a.fechaLectura))
              .slice(0, 6)
              .reverse();
            setLecturas(lecturasOrdenadas);
          } catch (err) {
            console.log('Error cargando lecturas:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarAlias = () => {
    navigator.clipboard.writeText('AGUA.GUSTAVO.ANDRE');
    // Mostrar feedback visual temporal
    const btn = document.getElementById('copy-btn');
    btn.textContent = '✓ Copiado';
    setTimeout(() => {
      btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
    }, 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 5MB.');
        return;
      }
      // Validar tipo
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Tipo de archivo no válido. Solo PDF, PNG o JPG.');
        return;
      }
      setComprobante(file);
    }
  };

  const handleConfirmarPago = async () => {
    if (!comprobante) {
      alert('Por favor, adjunta el comprobante de pago.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('comprobante', comprobante);
      formData.append('monto', boleta.total);
      formData.append('boletaId', boleta.id);

      await axios.post(`${API_URL}/pagos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setShowSuccess(true);
    } catch (error) {
      console.error('Error al confirmar pago:', error);
      alert('Error al procesar el pago. Por favor, inténtalo de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatearMonto = (monto) => {
    return parseFloat(monto || 0).toFixed(2);
  };

  const formatearPeriodo = (mes, anio) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${meses[mes - 1]} ${anio}`;
  };

  const calcularAltura = (consumo) => {
    if (!lecturas.length) return 0;
    const maxConsumo = Math.max(...lecturas.map(l => l.consumoM3 || 0));
    if (maxConsumo === 0) return 0;
    return ((consumo || 0) / maxConsumo) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101c22] flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (!boleta) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101c22] flex items-center justify-center">
        <div className="text-lg text-gray-600 dark:text-gray-400">Boleta no encontrada</div>
      </div>
    );
  }

  // Modal de éxito
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101c22] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1A2A33] rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#111618] dark:text-white mb-2">
            ¡Pago Registrado!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Tu comprobante ha sido enviado correctamente. Será revisado en las próximas 24-48 horas.
          </p>
          <button
            onClick={() => navigate('/cliente/dashboard')}
            className="w-full bg-[#13a4ec] text-white font-semibold py-3 rounded-lg hover:bg-[#13a4ec]/90 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101c22]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1A2A33] border-b border-gray-200 dark:border-gray-700 px-4 sm:px-10 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 text-[#13a4ec]">
              <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" />
              </svg>
            </div>
            <h2 className="text-[#111618] dark:text-white text-lg font-bold">
              Asociación de Agua Potable
            </h2>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 dark:text-gray-400 hover:text-[#111618] dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="px-4 sm:px-8 md:px-10 lg:px-20 xl:px-40 py-5">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={() => navigate('/cliente/dashboard')}
              className="text-[#617c89] dark:text-gray-400 text-sm font-medium hover:text-[#13a4ec]"
            >
              Mis Boletas
            </button>
            <span className="text-[#617c89] dark:text-gray-400 text-sm font-medium">/</span>
            <span className="text-[#111618] dark:text-white text-sm font-medium">
              Boleta #{boleta.id}
            </span>
          </div>

          {/* Título y Estado */}
          <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
            <h1 className="text-[#111618] dark:text-white text-3xl md:text-4xl font-black">
              Boleta de Agua - {formatearPeriodo(boleta.mes, boleta.anio)}
            </h1>
            {boleta.estado === 'procesando' ? (
              <div className="flex h-8 items-center justify-center gap-x-2 rounded-lg bg-blue-500/20 px-4">
                <p className="text-blue-700 dark:text-blue-400 text-sm font-medium">
                  En Proceso de Verificación
                </p>
              </div>
            ) : (
              <div className="flex h-8 items-center justify-center gap-x-2 rounded-lg bg-yellow-500/20 px-4">
                <p className="text-yellow-700 dark:text-yellow-500 text-sm font-medium">
                  Pendiente de Pago
                </p>
              </div>
            )}
          </div>

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Columna Izquierda: Detalles */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* Información del Socio */}
              <div className="bg-white dark:bg-[#1A2A33] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-[#111618] dark:text-white text-lg font-bold px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  Información del Socio
                </h2>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Nombre</p>
                    <p className="font-semibold dark:text-gray-200">{user.nombre}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Padrón</p>
                    <p className="font-semibold dark:text-gray-200">{user.padron}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-500 dark:text-gray-400">Dirección</p>
                    <p className="font-semibold dark:text-gray-200">{user.direccion || 'No registrada'}</p>
                  </div>
                </div>
              </div>

              {/* Resumen de la Boleta */}
              <div className="bg-white dark:bg-[#1A2A33] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-[#111618] dark:text-white text-lg font-bold px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  Resumen de la Boleta
                </h2>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Monto Total</p>
                    <p className="font-bold text-2xl text-[#13a4ec]">
                      ${formatearMonto(boleta.total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Fecha de Emisión</p>
                    <p className="font-semibold dark:text-gray-200 text-base">
                      {formatearFecha(boleta.fechaEmision)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Fecha de Vencimiento</p>
                    <p className="font-semibold dark:text-gray-200 text-base">
                      {formatearFecha(boleta.fechaVencimiento)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalle de Cargos */}
              <div className="bg-white dark:bg-[#1A2A33] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-[#111618] dark:text-white text-lg font-bold px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  Detalle de Cargos
                </h2>
                <div className="p-6 space-y-3">
                  {/* Servicio Base */}
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-300">Servicio de Agua Potable</span>
                    <span className="font-semibold dark:text-gray-200">
                      ${formatearMonto(boleta.monto_servicio_base)}
                    </span>
                  </div>

                  {/* Consumo Escalonado */}
                  {boleta.tiene_medidor && parseFloat(boleta.consumo_m3) > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                      <p className="text-sm font-semibold text-[#13a4ec] mb-2">Consumo por Escalas</p>
                      
                      {boleta.desglose_consumo && boleta.desglose_consumo.length > 0 ? (
                        <>
                          {boleta.desglose_consumo.map((escala, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">
                                Consumo {escala.desde}-{escala.hasta || '∞'} m³: {parseFloat(escala.consumo_m3).toFixed(2)} m³
                                {escala.precio_por_m3 > 0 && ` × $${formatearMonto(escala.precio_por_m3)}`}
                              </span>
                              <span className="text-gray-600 dark:text-gray-300">
                                {escala.precio_por_m3 === 0 ? 'Incluido en servicio base' : `$${formatearMonto(escala.subtotal)}`}
                              </span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Sin desglose disponible
                        </div>
                      )}

                      <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
                        <span className="font-semibold text-[#111618] dark:text-white">Total Consumo</span>
                        <span className="font-semibold text-[#111618] dark:text-white">
                          ${formatearMonto(boleta.monto_consumo)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Otros Cargos */}
                  {parseFloat(boleta.total_cargos_extras) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-300">Otros Cargos</span>
                      <span className="font-semibold dark:text-gray-200">
                        ${formatearMonto(boleta.total_cargos_extras)}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center py-3 pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="text-lg font-bold text-[#111618] dark:text-white">Total</span>
                    <span className="text-lg font-bold text-[#13a4ec]">
                      ${formatearMonto(boleta.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historial de Consumo */}
              {lecturas.length > 0 && (
                <div className="bg-white dark:bg-[#1A2A33] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-[#111618] dark:text-white text-lg font-bold px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    Historial de Consumo (Últimos {lecturas.length} meses)
                  </h2>
                  <div className="p-6">
                    <div className="flex justify-around items-end h-32 gap-3">
                      {lecturas.map((lectura, index) => {
                        const altura = calcularAltura(lectura.consumoM3);
                        const esActual = index === lecturas.length - 1;
                        return (
                          <div key={index} className="flex flex-col items-center gap-1 w-full text-center">
                            <div 
                              className={`${
                                esActual ? 'bg-[#13a4ec]' : 'bg-[#13a4ec]/20'
                              } rounded-t-md w-full transition-all`}
                              style={{ 
                                height: altura > 0 ? `${altura}%` : '10%',
                                minHeight: '15px'
                              }}
                            />
                            <span className={`text-xs ${
                              esActual 
                                ? 'text-[#13a4ec] font-bold' 
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][lectura.mes - 1]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna Derecha: Panel de Pago */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#1A2A33] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-5">
                <h2 className="text-[#111618] dark:text-white text-lg font-bold mb-4">
                  Realizar Pago
                </h2>
                <div className="flex flex-col gap-6">
                  {/* Instrucciones */}
                  <div>
                    <h3 className="font-semibold text-base mb-2 dark:text-gray-200">
                      Instrucciones de Pago
                    </h3>
                    <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <li>Copia el alias para realizar la transferencia.</li>
                      <li>Realiza el pago desde tu home banking.</li>
                      <li>Sube el comprobante de pago en esta pantalla.</li>
                      <li>Haz clic en "Confirmar Pago" para finalizar.</li>
                    </ol>
                  </div>

                  {/* Alias */}
                  <div>
                    <h3 className="font-semibold text-base mb-2 dark:text-gray-200">
                      Datos para la Transferencia
                    </h3>
                    <div className="flex items-center justify-between gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-[#101c22] dark:border-gray-600">
                      <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        AGUA.GUSTAVO.ANDRE
                      </p>
                      <button
                        id="copy-btn"
                        onClick={handleCopiarAlias}
                        className="flex items-center justify-center p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                        title="Copiar alias"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Upload de Comprobante */}
                  <div>
                    <h3 className="font-semibold text-base mb-2 dark:text-gray-200">
                      Adjuntar Comprobante
                    </h3>
                    <div className="flex items-center justify-center w-full">
                      <label 
                        htmlFor="dropzone-file" 
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {comprobante ? (
                            <>
                              <svg className="w-10 h-10 mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">
                                {comprobante.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Click para cambiar
                              </p>
                            </>
                          ) : (
                            <>
                              <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                PDF, PNG, JPG (MAX. 5MB)
                              </p>
                            </>
                          )}
                        </div>
                        <input 
                          id="dropzone-file" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Botón Confirmar */}
                  <button
                    onClick={handleConfirmarPago}
                    disabled={!comprobante || uploading}
                    className="w-full flex items-center justify-center h-12 bg-[#13a4ec] text-white text-base font-bold rounded-lg hover:bg-[#13a4ec]/90 disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-600 transition-colors"
                  >
                    {uploading ? 'Procesando...' : 'Confirmar Pago'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PagarBoleta;


import React from 'react';
import { useNavigate } from 'react-router-dom';

function DetalleBoleta({ boleta, onClose }) {
  const navigate = useNavigate();
  
  if (!boleta) return null;

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#101c22] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#101c22] border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#111618] dark:text-white">
            Detalle de Boleta
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info de la Factura */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#617c89] dark:text-gray-400 mb-1">Período de Facturación</p>
                <p className="text-lg font-bold text-[#111618] dark:text-white">
                  {formatearPeriodo(boleta.mes, boleta.anio)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#617c89] dark:text-gray-400 mb-1">Fecha de Vencimiento</p>
                <p className="text-lg font-bold text-[#111618] dark:text-white">
                  {formatearFecha(boleta.fechaVencimiento)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#617c89] dark:text-gray-400 mb-1">Padrón N°</p>
                <p className="text-lg font-bold text-[#111618] dark:text-white">
                  {boleta.usuario?.padron || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#617c89] dark:text-gray-400 mb-1">Zona</p>
                <p className="text-lg font-bold text-[#111618] dark:text-white">
                  {boleta.usuario?.zona?.nombre || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Información de Medidor */}
          {boleta.lectura && (
            <div className="border border-[#dbe2e6] dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-[#111618] dark:text-white mb-4">
                Información del Medidor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-[#617c89] dark:text-gray-400 mb-1">Lectura Anterior</p>
                  <p className="text-2xl font-bold text-[#111618] dark:text-white">
                    {boleta.lectura.lecturaAnterior} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#617c89] dark:text-gray-400 mb-1">Lectura Actual</p>
                  <p className="text-2xl font-bold text-[#111618] dark:text-white">
                    {boleta.lectura.lecturaActual} m³
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#617c89] dark:text-gray-400 mb-1">Consumo del Período</p>
                  <p className="text-2xl font-bold text-[#007BFF]">
                    {formatearMonto(boleta.consumo_m3)} m³
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Desglose de Conceptos */}
          <div className="border border-[#dbe2e6] dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-b border-[#dbe2e6] dark:border-gray-700">
              <h3 className="text-lg font-bold text-[#111618] dark:text-white">
                Desglose de Conceptos
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {/* Servicio Base */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-[#111618] dark:text-gray-300">Servicio de Agua Potable</span>
                <span className="font-semibold text-[#111618] dark:text-white">
                  ${formatearMonto(boleta.monto_servicio_base)}
                </span>
              </div>

              {/* Consumo Escalonado */}
              {boleta.tiene_medidor && parseFloat(boleta.consumo_m3) > 0 && (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-[#007BFF] mb-2">Consumo por Escalas</p>
                    
                    {boleta.desglose_consumo && boleta.desglose_consumo.length > 0 ? (
                      <>
                        {boleta.desglose_consumo.map((escala, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-[#617c89] dark:text-gray-400">
                              Consumo {escala.desde}-{escala.hasta || '∞'} m³: {parseFloat(escala.consumo_m3).toFixed(2)} m³
                              {escala.precio_por_m3 > 0 && ` × $${formatearMonto(escala.precio_por_m3)}`}
                            </span>
                            <span className="text-[#111618] dark:text-gray-300">
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
                </>
              )}

              {/* Subtotal */}
              <div className="flex justify-between items-center py-2 border-t border-gray-300 dark:border-gray-600 font-semibold">
                <span className="text-[#111618] dark:text-white">Subtotal</span>
                <span className="text-[#111618] dark:text-white">
                  ${formatearMonto(boleta.subtotal)}
                </span>
              </div>

              {/* Cargos Extras */}
              {parseFloat(boleta.total_cargos_extras) > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-[#111618] dark:text-gray-300">Cargos Extras</span>
                  <span className="font-semibold text-[#111618] dark:text-white">
                    ${formatearMonto(boleta.total_cargos_extras)}
                  </span>
                </div>
              )}

              {/* Cuota de Plan de Reconexión */}
              {boleta.cuota_plan_numero && parseFloat(boleta.monto_cuota_plan) > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-[#111618] dark:text-gray-300">
                    Plan de Reconexión (Cuota {boleta.cuota_plan_numero})
                  </span>
                  <span className="font-semibold text-[#111618] dark:text-white">
                    ${formatearMonto(boleta.monto_cuota_plan)}
                  </span>
                </div>
              )}

              {/* Total Final */}
              <div className="flex justify-between items-center py-4 border-t-2 border-gray-300 dark:border-gray-600">
                <span className="text-xl font-bold text-[#111618] dark:text-white">TOTAL</span>
                <span className="text-2xl font-bold text-[#007BFF]">
                  ${formatearMonto(boleta.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3">
            {boleta.estado === 'pendiente' && (
              <button 
                onClick={() => navigate(`/cliente/pagar-boleta/${boleta.id}`)}
                className="flex-1 bg-[#007BFF] text-white font-medium py-3 rounded-lg hover:bg-[#007BFF]/90 transition-colors"
              >
                Pagar Ahora
              </button>
            )}
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-200 dark:bg-gray-700 text-[#111618] dark:text-white font-medium py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetalleBoleta;


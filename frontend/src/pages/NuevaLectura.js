import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../services/axios';
import Sidebar from '../components/Sidebar';

function NuevaLectura() {
  const navigate = useNavigate();
  const { clienteId } = useParams();
  
  const [cliente, setCliente] = useState(null);
  const [ultimaLectura, setUltimaLectura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lecturaGuardada, setLecturaGuardada] = useState(null);
  const [error, setError] = useState('');
  
  // Estados para los dígitos de la lectura
  const [digitos, setDigitos] = useState(['', '', '', '']);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  // Referencias para los inputs
  const digitRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (clienteId) {
      cargarDatosCliente();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const cargarDatosCliente = async () => {
    try {
      const clienteRes = await axios.get(`/usuarios/${clienteId}`);
      setCliente(clienteRes.data);

      // Obtener última lectura del medidor
      if (clienteRes.data.medidor?.id) {
        try {
          const lecturasRes = await axios.get(`/lecturas?medidorId=${clienteRes.data.medidor.id}`);
          if (lecturasRes.data && lecturasRes.data.length > 0) {
            // Ordenar por fecha y tomar la última
            const lecturas = lecturasRes.data.sort((a, b) => 
              new Date(b.fechaLectura) - new Date(a.fechaLectura)
            );
            setUltimaLectura(lecturas[0]);
          }
        } catch (err) {
          console.log('No hay lecturas previas');
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    // Solo permitir números
    if (value === '' || /^\d$/.test(value)) {
      const newDigitos = [...digitos];
      newDigitos[index] = value;
      setDigitos(newDigitos);
      
      // Auto-focus al siguiente input
      if (value !== '' && index < 3) {
        digitRefs[index + 1].current?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: volver al input anterior si está vacío
    if (e.key === 'Backspace' && digitos[index] === '' && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
    // Flecha izquierda
    if (e.key === 'ArrowLeft' && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
    // Flecha derecha
    if (e.key === 'ArrowRight' && index < 3) {
      digitRefs[index + 1].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validar que todos los dígitos estén completos
      if (digitos.some(d => d === '')) {
        setError('Por favor ingrese todos los dígitos de la lectura');
        setSaving(false);
        return;
      }

      const lecturaActual = parseInt(digitos.join(''));
      
      // Validar que la lectura no sea menor a la anterior
      if (ultimaLectura && lecturaActual < ultimaLectura.lecturaActual) {
        setError(`La lectura ingresada no puede ser menor a la anterior (${ultimaLectura.lecturaActual} m³)`);
        setSaving(false);
        return;
      }

      // Crear la lectura - El backend calculará consumo y lecturaAnterior
      const payload = {
        medidorId: cliente.medidor.id,
        lecturaActual,
        fechaLectura: fecha,
      };

      const response = await axios.post('/lecturas', payload);
      
      // Guardar datos de la lectura para mostrar en el modal (usar los datos del backend)
      setLecturaGuardada({
        cliente: cliente.nombre,
        padron: cliente.padron,
        lecturaAnterior: response.data.lecturaAnterior,
        lecturaActual: response.data.lecturaActual,
        consumo: response.data.consumoM3,
        fecha: new Date(response.data.fechaLectura).toLocaleDateString('es-AR'),
      });
      
      setShowSuccessModal(true);
      setDigitos(['', '', '', '']);

    } catch (error) {
      console.error('Error al guardar lectura:', error);
      setError(error.response?.data?.message || 'Error al guardar la lectura');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate(`/administrativo/clientes/ver/${clienteId}`);
  };

  const handleNuevaLectura = () => {
    setShowSuccessModal(false);
    setDigitos(['', '', '', '']);
    setFecha(new Date().toISOString().split('T')[0]);
    setError('');
    cargarDatosCliente(); // Recargar para actualizar la última lectura
    setTimeout(() => {
      digitRefs[0].current?.focus();
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-primary text-6xl animate-spin">refresh</span>
            <p className="text-[#617c89] mt-4">Cargando datos del cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cliente || !cliente.medidor) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
            <p className="text-[#617c89] mt-4">Este cliente no tiene medidor asignado</p>
            <button
              onClick={() => navigate('/administrativo/clientes')}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
            >
              Volver a Clientes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="px-4 md:px-20 lg:px-40 py-5 sm:py-10">
          <div className="max-w-[960px] mx-auto">
            {/* Header */}
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <div className="flex min-w-72 flex-col gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/administrativo/clientes/ver/${clienteId}`)}
                    className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                  </button>
                  <p className="text-[#333333] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                    Ingreso de Lectura de Medidor
                  </p>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">
                  Registre la lectura actual del medidor del cliente
                </p>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="mt-8 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-[#333333] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 sm:px-6 pb-3 pt-5">
                Datos del Cliente
              </h2>
              <div className="p-4 sm:p-6 grid grid-cols-[35%_1fr] sm:grid-cols-[25%_1fr] gap-x-6">
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-gray-200 dark:border-t-gray-700 py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">Nombre Completo</p>
                  <p className="text-[#333333] dark:text-gray-200 text-sm font-medium leading-normal">{cliente.nombre}</p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-gray-200 dark:border-t-gray-700 py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">Padrón</p>
                  <p className="text-[#333333] dark:text-gray-200 text-sm font-medium leading-normal">{cliente.padron}</p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-gray-200 dark:border-t-gray-700 py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">Domicilio</p>
                  <p className="text-[#333333] dark:text-gray-200 text-sm font-medium leading-normal">
                    {cliente.direccion}, {cliente.localidad || 'Gustavo André'}
                  </p>
                </div>
                <div className="col-span-2 grid grid-cols-subgrid border-t border-t-gray-200 dark:border-t-gray-700 py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">Medidor</p>
                  <p className="text-[#333333] dark:text-gray-200 text-sm font-medium leading-normal">
                    {cliente.medidor.numeroSerie} - {cliente.medidor.marca}
                  </p>
                </div>
                {ultimaLectura && (
                  <>
                    <div className="col-span-2 grid grid-cols-subgrid border-t border-t-gray-200 dark:border-t-gray-700 py-4">
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">Última Lectura</p>
                      <p className="text-[#333333] dark:text-gray-200 text-sm font-medium leading-normal">
                        {ultimaLectura.lecturaActual} m³
                      </p>
                    </div>
                    <div className="col-span-2 grid grid-cols-subgrid border-t border-t-gray-200 dark:border-t-gray-700 py-4">
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">Fecha de Última Lectura</p>
                      <p className="text-[#333333] dark:text-gray-200 text-sm font-medium leading-normal">
                        {new Date(ultimaLectura.fechaLectura).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Formulario Nueva Lectura */}
            <form onSubmit={handleSubmit}>
              <div className="mt-8 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-[#333333] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 sm:px-6 pb-3 pt-5">
                  Nueva Lectura
                </h2>
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  {/* Lectura Actual */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lectura Actual del Medidor
                    </label>
                    <div className="flex items-center gap-2">
                      {digitos.map((digito, index) => (
                        <input
                          key={index}
                          ref={digitRefs[index]}
                          type="number"
                          value={digito}
                          onChange={(e) => handleDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          className="form-input block w-14 h-16 text-center text-3xl font-bold rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[#333333] dark:text-white focus:border-primary focus:ring-primary placeholder:text-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          maxLength="1"
                          min="0"
                          max="9"
                        />
                      ))}
                      <span className="ml-2 text-gray-500 text-xl font-medium">m³</span>
                    </div>
                  </div>

                  {/* Fecha de Lectura */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fecha de Lectura
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="form-input block w-full text-base py-3 px-4 rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-[#333333] dark:text-white focus:border-primary focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                {/* Botón Guardar */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">refresh</span>
                        Guardando...
                      </>
                    ) : (
                      'Guardar Lectura'
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Mensajes de Error */}
            {error && (
              <div className="mt-6 px-4">
                <div className="flex items-center gap-4 rounded-lg bg-error/10 p-4 text-sm text-error dark:text-error border border-error/20">
                  <span className="material-symbols-outlined text-error">error</span>
                  <p>{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Éxito */}
      {showSuccessModal && lecturaGuardada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="flex flex-col items-center">
              {/* Ícono de éxito con animación */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping"></div>
                <div className="relative bg-green-100 dark:bg-green-900/50 rounded-full p-6">
                  <span className="material-symbols-outlined text-6xl text-green-600 dark:text-green-400">
                    check_circle
                  </span>
                </div>
              </div>

              {/* Título */}
              <h2 className="text-3xl font-bold text-[#111618] dark:text-white mb-2 text-center">
                ¡Lectura Registrada!
              </h2>
              
              {/* Mensaje */}
              <p className="text-[#617c89] dark:text-gray-400 text-center mb-6">
                La lectura del medidor ha sido guardada exitosamente
              </p>

              {/* Detalles del cliente */}
              <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">person</span>
                    <div className="flex-1">
                      <p className="text-xs text-[#617c89] dark:text-gray-400">Cliente</p>
                      <p className="font-bold text-[#111618] dark:text-white">{lecturaGuardada.cliente}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">badge</span>
                    <div className="flex-1">
                      <p className="text-xs text-[#617c89] dark:text-gray-400">Padrón</p>
                      <p className="font-bold text-[#111618] dark:text-white">{lecturaGuardada.padron}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información de la lectura */}
              <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-[#617c89] dark:text-gray-400 mb-1">Lectura Anterior</p>
                    <p className="text-2xl font-bold text-[#111618] dark:text-white">{lecturaGuardada.lecturaAnterior}</p>
                    <p className="text-xs text-[#617c89] dark:text-gray-400">m³</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-[#617c89] dark:text-gray-400 mb-1">Lectura Actual</p>
                    <p className="text-2xl font-bold text-primary">{lecturaGuardada.lecturaActual}</p>
                    <p className="text-xs text-[#617c89] dark:text-gray-400">m³</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                  <div className="text-center">
                    <p className="text-xs text-[#617c89] dark:text-gray-400 mb-1">Consumo del Período</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{lecturaGuardada.consumo}</p>
                    <p className="text-sm text-[#617c89] dark:text-gray-400">metros cúbicos</p>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <p className="text-xs text-[#617c89] dark:text-gray-400">
                    📅 Fecha: {lecturaGuardada.fecha}
                  </p>
                </div>
              </div>

              {/* Botones */}
              <div className="w-full space-y-2">
                <button
                  onClick={handleCloseSuccessModal}
                  className="w-full h-12 px-6 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                  Volver al Cliente
                </button>
                <button
                  onClick={handleNuevaLectura}
                  className="w-full h-12 px-6 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Ingresar Otra Lectura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NuevaLectura;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

function CrearCliente() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [zonas, setZonas] = useState([]);
  const [currentStep, setCurrentStep] = useState(1); // 1 o 2
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [clienteCreado, setClienteCreado] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null
  });
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    cuit: '',
    direccion: '',
    localidad: '',
    codigoPostal: '',
    whatsapp: '',
    telefono: '',
    zonaId: '',
    tipo: '',
    rol: 'cliente',
    activo: true,
    // Datos del medidor (Step 2)
    numeroSerie: '',
    lecturaInicial: 0,
  });

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    try {
      const zonasRes = await axios.get('/zonas');
      setZonas(zonasRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    
    // Validar campos obligatorios del Step 1
    if (!formData.nombre || !formData.zonaId) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Campos Incompletos',
        message: 'Por favor complete los campos obligatorios:\n• Nombre\n• Zona',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
      });
      return;
    }
    
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitSinMedidor = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Crear el cliente SIN medidor
      const clientePayload = {
        nombre: formData.nombre,
        email: formData.email,
        cuit: formData.cuit,
        direccion: formData.direccion,
        localidad: formData.localidad,
        codigoPostal: formData.codigoPostal,
        whatsapp: formData.whatsapp,
        telefono: formData.telefono,
        zona: formData.zonaId ? { id: parseInt(formData.zonaId) } : null,
        tipo: formData.tipo,
        rol: 'cliente',
        activo: formData.activo,
      };

      const clienteRes = await axios.post('/usuarios', clientePayload);

      // Guardar datos del cliente creado y mostrar modal de éxito
      setClienteCreado({
        nombre: formData.nombre,
        padron: clienteRes.data.padron,
        medidor: null, // Sin medidor
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error al Crear Cliente',
        message: error.response?.data?.message || error.message || 'Ocurrió un error inesperado al crear el cliente.',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos del Step 2 (solo si se quiere asignar medidor)
    if (!formData.numeroSerie.trim()) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Número de Serie Requerido',
        message: 'Por favor ingrese el número de serie del medidor o use el botón "Crear Sin Medidor".',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
      });
      return;
    }
    
    setLoading(true);

    try {
      // 0. PRIMERO: Verificar si el número de serie ya existe
      try {
        const verificarRes = await axios.get(`/medidores/verificar-serie/${encodeURIComponent(formData.numeroSerie)}`);
        if (verificarRes.data.existe) {
          setModalConfig({
            isOpen: true,
            type: 'error',
            title: 'Número de Serie Duplicado',
            message: `Ya existe un medidor con el número de serie "${formData.numeroSerie}". Por favor, use un número de serie diferente.`,
            onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
          });
          setLoading(false);
          return;
        }
      } catch (verifyError) {
        console.log('Error al verificar serie, continuando...', verifyError);
        // Si falla la verificación, intentamos crear de todas formas
      }

      // 1. Crear el cliente
      const clientePayload = {
        nombre: formData.nombre,
        email: formData.email,
        cuit: formData.cuit,
        direccion: formData.direccion,
        localidad: formData.localidad,
        codigoPostal: formData.codigoPostal,
        whatsapp: formData.whatsapp,
        telefono: formData.telefono,
        zona: formData.zonaId ? { id: parseInt(formData.zonaId) } : null,
        tipo: formData.tipo,
        rol: 'cliente',
        activo: formData.activo,
      };

      const clienteRes = await axios.post('/usuarios', clientePayload);
      const clienteId = clienteRes.data.id;

      // 2. Asignar el medidor
      const medidorPayload = {
        numeroSerie: formData.numeroSerie,
        lecturaInicial: parseInt(formData.lecturaInicial) || 0,
      };
      
      await axios.post(`/medidores/asignar/${clienteId}`, medidorPayload);

      // Guardar datos del cliente creado y mostrar modal de éxito
      setClienteCreado({
        nombre: formData.nombre,
        padron: clienteRes.data.padron,
        medidor: formData.numeroSerie,
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error al Crear Cliente',
        message: error.response?.data?.message || error.message || 'Ocurrió un error inesperado al crear el cliente.',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigate('/administrativo/clientes');
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/administrativo/clientes')}
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex-1">
              <h1 className="text-[#111618] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                Crear Nuevo Cliente
              </h1>
              <p className="text-[#617c89] dark:text-gray-400 text-sm mt-1">
                {currentStep === 1 ? 'Paso 1 de 2: Datos del Cliente' : 'Paso 2 de 2: Asignar Medidor (Opcional)'}
              </p>
            </div>
          </div>

          {/* Indicador de Pasos */}
          <div className="max-w-5xl mb-6">
            <div className="flex items-center">
              {/* Step 1 */}
              <div className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {currentStep > 1 ? (
                    <span className="material-symbols-outlined">check</span>
                  ) : (
                    <span className="font-bold">1</span>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    currentStep >= 1 ? 'text-primary' : 'text-gray-500'
                  }`}>
                    Datos del Cliente
                  </p>
                </div>
              </div>

              {/* Conector */}
              <div className={`h-1 flex-1 mx-4 ${
                currentStep >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>

              {/* Step 2 */}
              <div className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  <span className="font-bold">2</span>
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${
                    currentStep >= 2 ? 'text-primary' : 'text-gray-500'
                  }`}>
                    Asignar Medidor
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={currentStep === 1 ? handleNextStep : handleSubmit} className="max-w-5xl">
            {/* STEP 1: Datos del Cliente */}
            {currentStep === 1 && (
              <>
                <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-bold text-[#111618] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person</span>
                    Información Personal
                  </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    CUIT / DNI
                  </label>
                  <input
                    type="text"
                    name="cuit"
                    value={formData.cuit}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 20-12345678-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="cliente@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Tipo de Cliente
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Particulares">Particulares</option>
                    <option value="Entidad Pública">Entidad Pública</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Estado
                  </label>
                  <select
                    name="activo"
                    value={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.value === 'true'})}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-[#111618] dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">home</span>
                Ubicación
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Calle Falsa 123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Localidad
                  </label>
                  <input
                    type="text"
                    name="localidad"
                    value={formData.localidad}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: Gustavo André"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="codigoPostal"
                    value={formData.codigoPostal}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 5730"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Zona *
                  </label>
                  <select
                    name="zonaId"
                    value={formData.zonaId}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar zona...</option>
                    {zonas.map((zona) => (
                      <option key={zona.id} value={zona.id}>
                        {zona.nombre} (Código: {zona.valor})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-bold text-[#111618] dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">phone</span>
                Contacto
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 2664123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: 2664123456"
                  />
                </div>
              </div>
            </div>
              </>
            )}

            {/* STEP 2: Asignar Medidor */}
            {currentStep === 2 && (
              <>
                {/* Resumen del Cliente */}
                <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined">check_circle</span>
                    Datos del Cliente
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[#617c89] dark:text-gray-400">Nombre:</span>
                      <p className="font-medium text-[#111618] dark:text-white">{formData.nombre}</p>
                    </div>
                    <div>
                      <span className="text-[#617c89] dark:text-gray-400">Zona:</span>
                      <p className="font-medium text-[#111618] dark:text-white">
                        {zonas.find(z => z.id === parseInt(formData.zonaId))?.nombre || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#617c89] dark:text-gray-400">Dirección:</span>
                      <p className="font-medium text-[#111618] dark:text-white">{formData.direccion || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[#617c89] dark:text-gray-400">Teléfono:</span>
                      <p className="font-medium text-[#111618] dark:text-white">{formData.whatsapp || formData.telefono || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Formulario del Medidor */}
                <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-bold text-[#111618] dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">speed</span>
                    Asignar Medidor de Agua (Opcional)
                  </h2>
                  
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                      <span className="material-symbols-outlined text-lg">lightbulb</span>
                      <span>
                        Puede asignar un medidor ahora o crearlo sin medidor. Si no asigna medidor, el cliente tendrá la conexión pero se le cobrará la tarifa mínima hasta que se le asigne uno.
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                        Número de Serie del Medidor
                      </label>
                      <input
                        type="text"
                        name="numeroSerie"
                        value={formData.numeroSerie}
                        onChange={handleChange}
                        className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Ej: MED-001 (opcional)"
                      />
                      <p className="text-xs text-[#617c89] dark:text-gray-400 mt-1">
                        Número identificador único del medidor
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                        Lectura Inicial (m³)
                      </label>
                      <input
                        type="number"
                        name="lecturaInicial"
                        value={formData.lecturaInicial}
                        onChange={handleChange}
                        className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0"
                        min="0"
                      />
                      <p className="text-xs text-[#617c89] dark:text-gray-400 mt-1">
                        💡 Normalmente 0 para medidores nuevos
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Botones de acción */}
            <div className="flex items-center gap-4">
              {currentStep === 1 ? (
                <>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 h-12 px-6 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined">arrow_forward</span>
                    Siguiente: Asignar Medidor
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/administrativo/clientes')}
                    className="flex items-center justify-center gap-2 h-12 px-6 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex items-center justify-center gap-2 h-12 px-6 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Atrás
                  </button>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSubmitSinMedidor}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 h-12 px-6 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">refresh</span>
                          Creando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">person_add</span>
                          Crear Sin Medidor
                        </>
                      )}
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 h-12 px-6 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">refresh</span>
                          Creando...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">save</span>
                          Crear Con Medidor
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </form>
        </div>
      </main>

      {/* Modal de Éxito */}
      {showSuccessModal && clienteCreado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            {/* Animación de éxito */}
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
                ¡Felicitaciones!
              </h2>
              
              {/* Mensaje */}
              <p className="text-[#617c89] dark:text-gray-400 text-center mb-6">
                El cliente ha sido creado exitosamente
              </p>

              {/* Detalles del cliente creado */}
              <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">person</span>
                    <div className="flex-1">
                      <p className="text-xs text-[#617c89] dark:text-gray-400">Cliente</p>
                      <p className="font-bold text-[#111618] dark:text-white">{clienteCreado.nombre}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">badge</span>
                    <div className="flex-1">
                      <p className="text-xs text-[#617c89] dark:text-gray-400">Padrón</p>
                      <p className="font-bold text-[#111618] dark:text-white">{clienteCreado.padron}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">speed</span>
                    <div className="flex-1">
                      <p className="text-xs text-[#617c89] dark:text-gray-400">Medidor</p>
                      <p className="font-bold text-[#111618] dark:text-white">
                        {clienteCreado.medidor || 'Sin medidor asignado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje adicional */}
              {clienteCreado.medidor ? (
                <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200 text-center flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">info</span>
                    <span>El cliente ya puede realizar lecturas de consumo</span>
                  </p>
                </div>
              ) : (
                <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-6">
                  <p className="text-sm text-amber-800 dark:text-amber-200 text-center flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">info</span>
                    <span>El cliente fue creado sin medidor. Se le cobrará la tarifa mínima hasta que se asigne uno.</span>
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="w-full space-y-2">
                <button
                  onClick={handleCloseSuccessModal}
                  className="w-full h-12 px-6 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">list</span>
                  Ver Lista de Clientes
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    window.location.reload();
                  }}
                  className="w-full h-12 px-6 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add</span>
                  Crear Otro Cliente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validación/Error */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}

export default CrearCliente;


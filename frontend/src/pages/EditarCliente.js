import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../services/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

function EditarCliente() {
  const { API_URL } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [zonas, setZonas] = useState([]);
  const [medidores, setMedidores] = useState([]);
  const [historialMedidores, setHistorialMedidores] = useState([]);
  const [showModalMedidorRoto, setShowModalMedidorRoto] = useState(false);
  const [showModalAsignarMedidor, setShowModalAsignarMedidor] = useState(false);
  const [nuevoMedidor, setNuevoMedidor] = useState({
    numeroSerie: '',
    lecturaInicial: 0,
  });
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
    medidorId: '',
    tipo: '',
    activo: true,
  });

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarDatos = async () => {
    try {
      const [clienteRes, zonasRes, medidoresRes] = await Promise.all([
        axios.get(`${API_URL}/usuarios/${id}`),
        axios.get(`${API_URL}/zonas`),
        axios.get(`${API_URL}/medidores`),
      ]);

      const cliente = clienteRes.data;
      setFormData({
        nombre: cliente.nombre || '',
        email: cliente.email || '',
        cuit: cliente.cuit || '',
        direccion: cliente.direccion || '',
        localidad: cliente.localidad || '',
        codigoPostal: cliente.codigoPostal || '',
        whatsapp: cliente.whatsapp || '',
        telefono: cliente.telefono || '',
        zonaId: cliente.zona?.id || '',
        medidorId: cliente.medidor?.id || '',
        tipo: cliente.tipo || '',
        activo: cliente.activo !== undefined ? cliente.activo : true,
      });

      setZonas(zonasRes.data);
      // Incluir el medidor actual y los no asignados
      const medidoresDisponibles = medidoresRes.data.filter(
        m => !m.usuario || m.id === cliente.medidor?.id
      );
      setMedidores(medidoresDisponibles);

      // Cargar historial de medidores del cliente
      try {
        const historialRes = await axios.get(`/medidores/usuario/${id}`);
        setHistorialMedidores(historialRes.data || []);
      } catch (err) {
        console.log('No hay historial de medidores');
        setHistorialMedidores([]);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error al Cargar',
        message: 'No se pudo cargar la información del cliente.',
        onConfirm: () => navigate('/administrativo/clientes')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclararMedidorRoto = async () => {
    const medidorActivo = historialMedidores.find(m => m.activo);
    if (!medidorActivo) return;

    try {
      await axios.put(`/medidores/${medidorActivo.id}/dar-baja`, {
        motivo: 'Medidor roto',
      });
      
      setShowModalMedidorRoto(false);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: '¡Medidor Declarado como Roto!',
        message: 'El medidor ha sido dado de baja exitosamente.\n\nEl cliente quedará sin medidor activo hasta que se asigne uno nuevo.',
        onConfirm: () => {
          setModalConfig({ ...modalConfig, isOpen: false });
          cargarDatos();
        }
      });
    } catch (error) {
      console.error('Error al declarar medidor roto:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error al Declarar Medidor Roto',
        message: error.response?.data?.message || error.message || 'Ocurrió un error inesperado.',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
      });
    }
  };

  const handleAsignarMedidor = async () => {
    if (!nuevoMedidor.numeroSerie.trim()) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Número de Serie Requerido',
        message: 'Por favor ingrese el número de serie del medidor.',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
      });
      return;
    }

    try {
      await axios.post(`/medidores/asignar/${id}`, {
        numeroSerie: nuevoMedidor.numeroSerie,
        lecturaInicial: parseInt(nuevoMedidor.lecturaInicial) || 0,
      });
      
      setShowModalAsignarMedidor(false);
      setNuevoMedidor({ numeroSerie: '', lecturaInicial: 0 });
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: '¡Medidor Asignado!',
        message: 'El medidor ha sido asignado exitosamente.\n\nYa se pueden registrar lecturas para este cliente.',
        onConfirm: () => {
          setModalConfig({ ...modalConfig, isOpen: false });
          cargarDatos();
        }
      });
    } catch (error) {
      console.error('Error al asignar medidor:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error al Asignar Medidor',
        message: error.response?.data?.message || error.message || 'Ocurrió un error inesperado.',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...formData,
        zona: formData.zonaId ? { id: parseInt(formData.zonaId) } : null,
        medidor: formData.medidorId ? { id: parseInt(formData.medidorId) } : null,
      };

      await axios.put(`${API_URL}/usuarios/${id}`, payload);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: '¡Cliente Actualizado!',
        message: 'Los datos del cliente han sido actualizados correctamente.',
        onConfirm: () => navigate(`/administrativo/clientes/ver/${id}`)
      });
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error al Actualizar',
        message: error.response?.data?.message || error.message || 'Ocurrió un error al actualizar el cliente.',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false })
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-primary text-6xl animate-spin">refresh</span>
            <p className="text-[#617c89] mt-4">Cargando información del cliente...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(`/administrativo/clientes/ver/${id}`)}
              className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-[#111618] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                Editar Cliente
              </h1>
              <p className="text-[#617c89] dark:text-gray-400 text-sm mt-1">
                Modifique los datos del cliente
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="max-w-5xl">
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

            {/* Sección de Medidores */}
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#111618] dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">speed</span>
                  Gestión de Medidores
                </h2>
                {historialMedidores.find(m => m.activo) && (
                  <button
                    type="button"
                    onClick={() => setShowModalMedidorRoto(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error border border-error/20 rounded-lg hover:bg-error/20 transition-colors text-sm font-medium"
                  >
                    <span className="material-symbols-outlined">build_circle</span>
                    Declarar Roto
                  </button>
                )}
                {!historialMedidores.find(m => m.activo) && (
                  <button
                    type="button"
                    onClick={() => setShowModalAsignarMedidor(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <span className="material-symbols-outlined">add_circle</span>
                    Asignar Medidor
                  </button>
                )}
              </div>

              {/* Medidor Activo */}
              {historialMedidores.find(m => m.activo) ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#617c89] dark:text-gray-400 mb-1">Medidor Activo</p>
                      <p className="text-lg font-bold text-[#111618] dark:text-white">
                        {historialMedidores.find(m => m.activo).numeroSerie}
                      </p>
                      <p className="text-sm text-[#617c89] dark:text-gray-400 mt-1">
                        Instalado: {new Date(historialMedidores.find(m => m.activo).fechaInstalacion).toLocaleDateString('es-AR')}
                      </p>
                      <p className="text-sm text-[#617c89] dark:text-gray-400">
                        Lectura Inicial: {historialMedidores.find(m => m.activo).lecturaInicial} m³
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">
                      check_circle
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
                      warning
                    </span>
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">Sin Medidor Activo</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Este cliente no tiene un medidor asignado. Se le cobrará la tarifa mínima.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Historial de Medidores */}
              {historialMedidores.length > 1 && (
                <div>
                  <h3 className="text-sm font-medium text-[#617c89] dark:text-gray-400 mb-3">
                    Historial de Medidores
                  </h3>
                  <div className="space-y-2">
                    {historialMedidores
                      .filter(m => !m.activo)
                      .sort((a, b) => new Date(b.fechaBaja) - new Date(a.fechaBaja))
                      .map((medidor) => (
                        <div
                          key={medidor.id}
                          className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-[#111618] dark:text-white">
                                {medidor.numeroSerie}
                              </p>
                              <p className="text-xs text-[#617c89] dark:text-gray-400 mt-1">
                                {new Date(medidor.fechaInstalacion).toLocaleDateString('es-AR')} - {new Date(medidor.fechaBaja).toLocaleDateString('es-AR')}
                              </p>
                              <p className="text-xs text-error mt-1">
                                Motivo: {medidor.motivoBaja || 'No especificado'}
                              </p>
                            </div>
                            <span className="material-symbols-outlined text-gray-400">
                              history
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
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

            {/* Botones de acción */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 h-12 px-6 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">save</span>
                    Guardar Cambios
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/administrativo/clientes/ver/${id}`)}
                className="flex items-center justify-center gap-2 h-12 px-6 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Modal: Declarar Medidor Roto */}
      {showModalMedidorRoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex flex-col items-center">
              <div className="bg-error/10 rounded-full p-4 mb-4">
                <span className="material-symbols-outlined text-5xl text-error">
                  build_circle
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#111618] dark:text-white mb-2 text-center">
                Declarar Medidor Roto
              </h2>
              
              <p className="text-[#617c89] dark:text-gray-400 text-center mb-6">
                El cliente quedará SIN medidor hasta que se asigne uno nuevo.
                Durante este período se le cobrará la tarifa mínima.
              </p>

              <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
                    warning
                  </span>
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                      Medidor: {historialMedidores.find(m => m.activo)?.numeroSerie}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full space-y-2">
                <button
                  onClick={handleDeclararMedidorRoto}
                  className="w-full h-12 px-6 bg-error text-white rounded-lg font-bold hover:bg-error/90 transition-colors"
                >
                  Confirmar - Declarar Roto
                </button>
                <button
                  onClick={() => setShowModalMedidorRoto(false)}
                  className="w-full h-12 px-6 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Asignar Medidor */}
      {showModalAsignarMedidor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-dark rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 rounded-full p-4 mb-4">
                <span className="material-symbols-outlined text-5xl text-primary">
                  add_circle
                </span>
              </div>

              <h2 className="text-2xl font-bold text-[#111618] dark:text-white mb-2 text-center">
                Asignar Nuevo Medidor
              </h2>
              
              <p className="text-[#617c89] dark:text-gray-400 text-center mb-6">
                Ingrese los datos del nuevo medidor a asignar
              </p>

              <div className="w-full space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Número de Serie *
                  </label>
                  <input
                    type="text"
                    value={nuevoMedidor.numeroSerie}
                    onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, numeroSerie: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ej: MED-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                    Lectura Inicial
                  </label>
                  <input
                    type="number"
                    value={nuevoMedidor.lecturaInicial}
                    onChange={(e) => setNuevoMedidor({ ...nuevoMedidor, lecturaInicial: e.target.value })}
                    className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-[#617c89] dark:text-gray-400 mt-1">
                    Usualmente 0 para medidores nuevos
                  </p>
                </div>
              </div>

              <div className="w-full space-y-2">
                <button
                  onClick={handleAsignarMedidor}
                  className="w-full h-12 px-6 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                >
                  Asignar Medidor
                </button>
                <button
                  onClick={() => {
                    setShowModalAsignarMedidor(false);
                    setNuevoMedidor({ numeroSerie: '', lecturaInicial: 0 });
                  }}
                  className="w-full h-12 px-6 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Validación/Error/Éxito */}
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

export default EditarCliente;


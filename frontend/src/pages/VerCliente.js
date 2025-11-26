import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../services/axios';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

function VerCliente() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [lecturas, setLecturas] = useState([]);
  const [boletas, setBoletas] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cargarDatos = async () => {
    try {
      const [clienteRes, boletasRes] = await Promise.all([
        axios.get(`/usuarios/${id}`),
        axios.get(`/boletas?usuarioId=${id}`).catch(() => ({ data: [] })),
      ]);
      
      setCliente(clienteRes.data);
      
      // Si hay medidor activo, cargar sus lecturas
      if (clienteRes.data.medidor?.id) {
        const lecturasRes = await axios.get(`/lecturas?medidorId=${clienteRes.data.medidor.id}`).catch(() => ({ data: [] }));
        setLecturas(lecturasRes.data || []);
      } else {
        setLecturas([]);
      }
      
      setBoletas(boletasRes.data || []);
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
    try {
      await axios.put(`/medidores/${cliente.medidor.id}/dar-baja`, {
        motivo: 'Medidor roto',
      });
      
      setShowModalMedidorRoto(false);
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: '¡Medidor Declarado como Roto!',
        message: 'El medidor ha sido dado de baja exitosamente.\n\nEl cliente quedará sin medidor activo.\nSe le cobrará la tarifa mínima hasta que se asigne un nuevo medidor.',
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

  if (!cliente) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
            <p className="text-[#617c89] mt-4">Cliente no encontrado</p>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/administrativo/clientes')}
                className="flex items-center justify-center h-10 w-10 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="text-[#111618] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                  {cliente.nombre}
                </h1>
                <p className="text-[#617c89] dark:text-gray-400 text-sm mt-1">
                  Padrón: {cliente.padron}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/administrativo/clientes/editar/${id}`)}
              className="flex items-center justify-center gap-2 h-10 px-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">edit</span>
              Editar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Datos Personales */}
              <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#111618] dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person</span>
                  Información Personal
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">CUIT/DNI</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">{cliente.cuit || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">Email</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">{cliente.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">Tipo</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white capitalize">{cliente.tipo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">Orden (Tarifa)</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">{cliente.orden || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#111618] dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">home</span>
                  Ubicación
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">Dirección</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">{cliente.direccion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">Localidad</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">{cliente.localidad || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">Código Postal</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">{cliente.codigoPostal || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">Zona</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">{cliente.zona?.nombre || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">Medidor</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">
                      {cliente.medidor?.numeroSerie || 'Sin medidor asignado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#111618] dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">phone</span>
                  Contacto
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">WhatsApp</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">{cliente.whatsapp || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#617c89] dark:text-gray-400 uppercase mb-1">Teléfono</p>
                    <p className="text-sm font-medium text-[#111618] dark:text-white">{cliente.telefono || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Últimas Lecturas */}
              <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#111618] dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">speed</span>
                  Últimas Lecturas
                </h2>
                {lecturas.length === 0 ? (
                  <p className="text-center text-[#617c89] py-4">No hay lecturas registradas</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b dark:border-gray-700">
                        <tr>
                          <th className="text-left text-xs font-medium text-[#617c89] uppercase py-2">Fecha</th>
                          <th className="text-right text-xs font-medium text-[#617c89] uppercase py-2">Lectura</th>
                          <th className="text-right text-xs font-medium text-[#617c89] uppercase py-2">Consumo m³</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-gray-700">
                        {lecturas.slice(0, 5).map((lectura) => (
                          <tr key={lectura.id}>
                            <td className="py-3 text-sm text-[#111618] dark:text-white">
                              {new Date(lectura.fecha).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-sm text-right font-medium text-[#111618] dark:text-white">
                              {lectura.valorLectura}
                            </td>
                            <td className="py-3 text-sm text-right font-bold text-primary">
                              {lectura.consumoM3 || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar derecho */}
            <div className="space-y-6">
              {/* Estado */}
              <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-medium text-[#617c89] dark:text-gray-400 mb-2">Estado</h3>
                {cliente.activo !== false ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-active-green/10 text-active-green">
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-inactive-gray/10 text-inactive-gray">
                    Inactivo
                  </span>
                )}
              </div>

              {/* Resumen de Cuenta */}
              <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-medium text-[#617c89] dark:text-gray-400 mb-4">Resumen de Cuenta</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#111618] dark:text-white">Total Boletas</span>
                    <span className="text-lg font-bold text-[#111618] dark:text-white">{boletas.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#111618] dark:text-white">Pendientes</span>
                    <span className="text-lg font-bold text-debt-red">
                      {boletas.filter(b => b.estado === 'pendiente').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#111618] dark:text-white">Pagadas</span>
                    <span className="text-lg font-bold text-active-green">
                      {boletas.filter(b => b.estado === 'pagada').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones Rápidas */}
              <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-6">
                <h3 className="text-sm font-medium text-[#617c89] dark:text-gray-400 mb-4">Acciones Rápidas</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#f0f3f4] dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <span className="material-symbols-outlined text-primary">receipt</span>
                    <span className="text-sm font-medium text-[#111618] dark:text-white">Ver Boletas</span>
                  </button>
                  {cliente.medidor && (
                    <button
                      onClick={() => navigate(`/administrativo/clientes/${id}/nueva-lectura`)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined">speed</span>
                      <span className="text-sm font-medium">Nueva Lectura</span>
                    </button>
                  )}
                  {cliente.medidor ? (
                    <button
                      onClick={() => setShowModalMedidorRoto(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-error/10 text-error border border-error/20 rounded-lg hover:bg-error/20 transition-colors"
                    >
                      <span className="material-symbols-outlined">build_circle</span>
                      <span className="text-sm font-medium">Declarar Medidor Roto</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowModalAsignarMedidor(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined">add_circle</span>
                      <span className="text-sm font-medium">Asignar Medidor</span>
                    </button>
                  )}
                  <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#f0f3f4] dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <span className="material-symbols-outlined text-primary">print</span>
                    <span className="text-sm font-medium text-[#111618] dark:text-white">Imprimir Info</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Declarar Medidor Roto */}
      {showModalMedidorRoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-dark rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#111618] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-error">build_circle</span>
                Declarar Medidor Roto
              </h3>
              <button
                onClick={() => setShowModalMedidorRoto(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-sm text-error font-medium mb-2">⚠️ Medidor Actual</p>
              <p className="text-sm text-[#617c89] dark:text-gray-400 mb-1">
                <strong>N° Serie:</strong> {cliente.medidor?.numeroSerie}
              </p>
              <p className="text-xs text-error mt-3 font-medium">
                Este medidor será dado de baja y el cliente quedará SIN medidor activo.
              </p>
            </div>

            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                <strong>ℹ️ Importante:</strong>
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                <li>El cliente quedará sin medidor hasta que se asigne uno nuevo</li>
                <li>No se podrán registrar lecturas mientras no haya medidor</li>
                <li>Se le cobrará la <strong>tarifa mínima</strong> durante este período</li>
                <li>El servicio NO se cortará</li>
              </ul>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDeclararMedidorRoto}
                className="flex-1 h-12 px-4 bg-error text-white rounded-lg font-bold hover:bg-error/90 transition-colors"
              >
                Sí, Declarar Roto
              </button>
              <button
                onClick={() => setShowModalMedidorRoto(false)}
                className="h-12 px-4 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Medidor */}
      {showModalAsignarMedidor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-dark rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#111618] dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_circle</span>
                Asignar Nuevo Medidor
              </h3>
              <button
                onClick={() => setShowModalAsignarMedidor(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium mb-1">
                ℹ️ Nuevo medidor para: {cliente.nombre}
              </p>
              <p className="text-xs text-[#617c89] dark:text-gray-400">
                Una vez asignado, se podrán registrar lecturas para este cliente
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                  Número de Serie *
                </label>
                <input
                  type="text"
                  value={nuevoMedidor.numeroSerie}
                  onChange={(e) => setNuevoMedidor({...nuevoMedidor, numeroSerie: e.target.value})}
                  className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: MED-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111618] dark:text-white mb-2">
                  Lectura Inicial (m³)
                </label>
                <input
                  type="number"
                  value={nuevoMedidor.lecturaInicial}
                  onChange={(e) => setNuevoMedidor({...nuevoMedidor, lecturaInicial: e.target.value})}
                  className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 border-none text-[#111618] dark:text-white placeholder:text-[#617c89] dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-[#617c89] dark:text-gray-400 mt-1">
                  💡 Normalmente 0 para medidores nuevos. Puede ingresar otro valor si es necesario.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAsignarMedidor}
                className="flex-1 h-12 px-4 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Asignar Medidor
              </button>
              <button
                onClick={() => setShowModalAsignarMedidor(false)}
                className="h-12 px-4 border border-gray-300 dark:border-gray-600 text-[#111618] dark:text-white rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
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

export default VerCliente;


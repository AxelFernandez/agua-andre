import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../services/axios';
import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';

function ZonasAdmin() {
  const { API_URL } = useAuth();
  const [zonas, setZonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZona, setEditingZona] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    valor: '',
    descripcion: '',
  });
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    cargarZonas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarZonas = async () => {
    try {
      const response = await axios.get(`${API_URL}/zonas`);
      setZonas(response.data);
    } catch (error) {
      console.error('Error al cargar zonas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (zona = null) => {
    if (zona) {
      setEditingZona(zona);
      setFormData({
        nombre: zona.nombre,
        valor: zona.valor,
        descripcion: zona.descripcion || '',
      });
    } else {
      setEditingZona(null);
      setFormData({
        nombre: '',
        valor: '',
        descripcion: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingZona(null);
    setFormData({
      nombre: '',
      valor: '',
      descripcion: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.valor) {
      setModalConfig({
        isOpen: true,
        type: 'warning',
        title: 'Campos Requeridos',
        message: 'Por favor complete el nombre y el código de la zona.',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false }),
      });
      return;
    }

    try {
      if (editingZona) {
        await axios.put(`${API_URL}/zonas/${editingZona.id}`, formData);
        setModalConfig({
          isOpen: true,
          type: 'success',
          title: 'Zona Actualizada',
          message: `La zona "${formData.nombre}" ha sido actualizada correctamente.`,
          onConfirm: () => {
            setModalConfig({ ...modalConfig, isOpen: false });
            handleCloseModal();
            cargarZonas();
          },
        });
      } else {
        await axios.post(`${API_URL}/zonas`, formData);
        setModalConfig({
          isOpen: true,
          type: 'success',
          title: 'Zona Creada',
          message: `La zona "${formData.nombre}" ha sido creada correctamente.`,
          onConfirm: () => {
            setModalConfig({ ...modalConfig, isOpen: false });
            handleCloseModal();
            cargarZonas();
          },
        });
      }
    } catch (error) {
      console.error('Error al guardar zona:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.message || 'Ocurrió un error al guardar la zona.',
        onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false }),
      });
    }
  };

  const handleDelete = (zona) => {
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmar Eliminación',
      message: `¿Está seguro que desea eliminar la zona "${zona.nombre}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await axios.delete(`${API_URL}/zonas/${zona.id}`);
          setModalConfig({
            isOpen: true,
            type: 'success',
            title: 'Zona Eliminada',
            message: `La zona "${zona.nombre}" ha sido eliminada correctamente.`,
            onConfirm: () => {
              setModalConfig({ ...modalConfig, isOpen: false });
              cargarZonas();
            },
          });
        } catch (error) {
          console.error('Error al eliminar zona:', error);
          setModalConfig({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: error.response?.data?.message || 'No se puede eliminar esta zona porque tiene clientes asociados.',
            onConfirm: () => setModalConfig({ ...modalConfig, isOpen: false }),
          });
        }
      },
      onCancel: () => setModalConfig({ ...modalConfig, isOpen: false }),
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">Cargando zonas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8 bg-[#f8f9fa] dark:bg-[#0d1117]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#111618] dark:text-white">Gestión de Zonas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra las zonas para la generación de padrones
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          Nueva Zona
        </button>
      </div>

      {/* Tabla de Zonas */}
      <div className="bg-white dark:bg-[#161b22] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-[#21262d] border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Nombre
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Código
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Descripción
              </th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Ejemplo Padrón
              </th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {zonas.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No hay zonas registradas
                </td>
              </tr>
            ) : (
              zonas.map((zona) => (
                <tr key={zona.id} className="hover:bg-gray-50 dark:hover:bg-[#21262d]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">map</span>
                      </div>
                      <span className="font-medium text-[#111618] dark:text-white">
                        {zona.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                      {zona.valor}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                    {zona.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300">
                      {zona.valor}-0001
                    </code>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(zona)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(zona)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Card */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-blue-500">info</span>
          <div>
            <h3 className="font-medium text-blue-700 dark:text-blue-400">Sobre los Padrones</h3>
            <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
              El padrón de cada cliente se genera automáticamente usando el código de la zona seguido de un número secuencial.
              Por ejemplo, para la zona "Gustavo André" con código "10", el primer cliente tendrá el padrón "10-0001".
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#161b22] rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[#111618] dark:text-white">
                  {editingZona ? 'Editar Zona' : 'Nueva Zona'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la Zona *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Gustavo André"
                  className="w-full h-12 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 border-none text-[#111618] dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Código (para Padrón) *
                </label>
                <input
                  type="number"
                  name="valor"
                  value={formData.valor}
                  onChange={handleChange}
                  placeholder="Ej: 10"
                  className="w-full h-12 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 border-none text-[#111618] dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Este código se usará para generar padrones: {formData.valor || 'XX'}-0001
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción de la zona..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 border-none text-[#111618] dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 h-12 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-12 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingZona ? 'Guardar Cambios' : 'Crear Zona'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Mensajes */}
      <Modal
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </main>
    </div>
  );
}

export default ZonasAdmin;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../services/axios';
import Sidebar from '../components/Sidebar';

function UsuariosSistema() {
  const { API_URL } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFilter, setRolFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    direccion: '',
    telefono: '',
    rol: 'operario'
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarUsuarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/usuarios`);
      // Filtrar solo usuarios del sistema (operarios y administrativos)
      const usuariosSistema = response.data.filter(
        u => u.rol === 'operario' || u.rol === 'administrativo'
      );
      setUsuarios(usuariosSistema);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarUsuarios = () => {
    let filtered = [...usuarios];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nombre?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
      );
    }

    if (rolFilter !== 'todos') {
      filtered = filtered.filter((u) => u.rol === rolFilter);
    }

    return filtered;
  };

  const handleOpenModal = (usuario = null) => {
    if (usuario) {
      setEditingUser(usuario);
      setFormData({
        nombre: usuario.nombre || '',
        email: usuario.email || '',
        password: '',
        direccion: usuario.direccion || '',
        telefono: usuario.telefono || '',
        rol: usuario.rol || 'operario'
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        direccion: '',
        telefono: '',
        rol: 'operario'
      });
    }
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      direccion: '',
      telefono: '',
      rol: 'operario'
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }

    if (!editingUser && !formData.password.trim()) {
      errors.password = 'La contraseña es requerida para usuarios nuevos';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.direccion.trim()) {
      errors.direccion = 'La dirección es requerida';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      const dataToSend = { ...formData };
      
      // No enviar password vacío en actualización
      if (editingUser && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (editingUser) {
        await axios.put(`${API_URL}/usuarios/${editingUser.id}`, dataToSend);
      } else {
        await axios.post(`${API_URL}/usuarios`, dataToSend);
      }

      handleCloseModal();
      cargarUsuarios();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      if (error.response?.data?.message) {
        setFormErrors({ general: error.response.data.message });
      } else {
        setFormErrors({ general: 'Error al guardar el usuario' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteModal = (usuario) => {
    setUserToDelete(usuario);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    try {
      await axios.delete(`${API_URL}/usuarios/${userToDelete.id}`);
      handleCloseDeleteModal();
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
    }
  };

  const getRolBadge = (rol) => {
    const badges = {
      administrativo: {
        class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        label: 'Administrativo',
        icon: 'admin_panel_settings'
      },
      operario: {
        class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'Operario',
        icon: 'engineering'
      }
    };
    return badges[rol] || badges.operario;
  };

  const filteredUsuarios = filtrarUsuarios();

  return (
    <div className="flex h-screen">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark">
        <div className="p-8">
          {/* Header */}
          <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h1 className="text-[#111618] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                Usuarios del Sistema
              </h1>
              <p className="text-[#617c89] dark:text-gray-400 mt-1">
                Gestiona los usuarios administrativos y operarios
              </p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex min-w-[84px] items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">person_add</span>
              <span className="truncate">Crear Usuario</span>
            </button>
          </header>

          {/* Search & Filter */}
          <div className="p-4 bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-12 bg-[#f0f3f4] dark:bg-gray-700">
                  <div className="text-[#617c89] dark:text-gray-400 flex items-center justify-center pl-4">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-[#111618] dark:text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-[#617c89] dark:placeholder:text-gray-400 px-2 text-base font-normal leading-normal"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <select
                  value={rolFilter}
                  onChange={(e) => setRolFilter(e.target.value)}
                  className="flex h-12 w-full items-center justify-between gap-x-2 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 px-4 text-[#111618] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 border-none focus:outline-none focus:ring-0"
                >
                  <option value="todos">Rol: Todos</option>
                  <option value="administrativo">Administrativo</option>
                  <option value="operario">Operario</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-4">
              <p className="text-[#617c89] dark:text-gray-400 text-sm font-medium mb-1">Total Usuarios</p>
              <p className="text-2xl font-bold text-[#111618] dark:text-white">{usuarios.length}</p>
            </div>
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-4">
              <p className="text-[#617c89] dark:text-gray-400 text-sm font-medium mb-1">Administrativos</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {usuarios.filter(u => u.rol === 'administrativo').length}
              </p>
            </div>
            <div className="bg-white dark:bg-background-dark dark:border dark:border-gray-700 rounded-xl shadow-sm p-4">
              <p className="text-[#617c89] dark:text-gray-400 text-sm font-medium mb-1">Operarios</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {usuarios.filter(u => u.rol === 'operario').length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-[#dbe2e6] dark:border-gray-700 bg-white dark:bg-background-dark shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-[#617c89]">Cargando usuarios...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white dark:bg-gray-800">
                    <tr className="border-b dark:border-gray-700">
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                        Dirección
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                        Teléfono
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-[#617c89] dark:text-gray-400 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dbe2e6] dark:divide-gray-700">
                    {filteredUsuarios.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-[#617c89]">
                          No se encontraron usuarios
                        </td>
                      </tr>
                    ) : (
                      filteredUsuarios.map((usuario) => {
                        const rolBadge = getRolBadge(usuario.rol);
                        return (
                          <tr key={usuario.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                  usuario.rol === 'administrativo' 
                                    ? 'bg-purple-100 dark:bg-purple-900/30' 
                                    : 'bg-blue-100 dark:bg-blue-900/30'
                                }`}>
                                  <span className={`material-symbols-outlined text-lg ${
                                    usuario.rol === 'administrativo'
                                      ? 'text-purple-600 dark:text-purple-400'
                                      : 'text-blue-600 dark:text-blue-400'
                                  }`}>
                                    {rolBadge.icon}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-[#111618] dark:text-white">
                                  {usuario.nombre}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#617c89] dark:text-gray-400">
                              {usuario.email || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-[#617c89] dark:text-gray-400 max-w-xs truncate">
                              {usuario.direccion || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#617c89] dark:text-gray-400">
                              {usuario.telefono || usuario.whatsapp || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${rolBadge.class}`}>
                                <span className="material-symbols-outlined text-sm">{rolBadge.icon}</span>
                                {rolBadge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleOpenModal(usuario)}
                                className="text-primary hover:text-primary/80 p-2 rounded-full hover:bg-primary/10 transition-colors"
                                title="Editar usuario"
                              >
                                <span className="material-symbols-outlined text-xl">edit</span>
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(usuario)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                title="Eliminar usuario"
                              >
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Crear/Editar Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#111618] dark:text-white">
                  {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
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
              {formErrors.general && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {formErrors.general}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#111618] dark:text-white mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 text-[#111618] dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary ${
                    formErrors.nombre ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="Ej: Juan Pérez"
                />
                {formErrors.nombre && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111618] dark:text-white mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 text-[#111618] dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary ${
                    formErrors.email ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="usuario@ejemplo.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111618] dark:text-white mb-1">
                  Contraseña {editingUser ? '(dejar vacío para mantener)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 text-[#111618] dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary ${
                    formErrors.password ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'}
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111618] dark:text-white mb-1">
                  Dirección *
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className={`w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 text-[#111618] dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary ${
                    formErrors.direccion ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="Ej: Calle Principal 123"
                />
                {formErrors.direccion && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.direccion}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111618] dark:text-white mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 text-[#111618] dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: +54 9 11 1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111618] dark:text-white mb-1">
                  Rol *
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  className="w-full h-12 px-4 rounded-lg bg-[#f0f3f4] dark:bg-gray-700 text-[#111618] dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="operario">Operario</option>
                  <option value="administrativo">Administrativo</option>
                </select>
                <p className="mt-1 text-xs text-[#617c89] dark:text-gray-400">
                  {formData.rol === 'administrativo' 
                    ? 'Acceso completo al sistema incluyendo configuración y gestión de usuarios'
                    : 'Acceso para tomar lecturas y ver información de clientes'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 h-12 rounded-lg border border-gray-300 dark:border-gray-600 text-[#617c89] dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-12 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">{editingUser ? 'save' : 'person_add'}</span>
                      {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
                <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">
                  warning
                </span>
              </div>
              <h2 className="text-xl font-bold text-center text-[#111618] dark:text-white mb-2">
                ¿Eliminar usuario?
              </h2>
              <p className="text-center text-[#617c89] dark:text-gray-400 mb-6">
                Estás a punto de eliminar al usuario <strong className="text-[#111618] dark:text-white">{userToDelete.nombre}</strong>. 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  className="flex-1 h-12 rounded-lg border border-gray-300 dark:border-gray-600 text-[#617c89] dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 h-12 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">delete</span>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosSistema;


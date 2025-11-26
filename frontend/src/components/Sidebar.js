import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/administrativo', icon: 'dashboard', label: 'Dashboard' },
    { path: '/administrativo/clientes', icon: 'group', label: 'Clientes', fill: true },
    { path: '/administrativo/facturacion', icon: 'receipt_long', label: 'Facturación' },
    { path: '/administrativo/reportes', icon: 'bar_chart', label: 'Reportes' },
    { path: '/administrativo/configuracion', icon: 'settings', label: 'Configuración' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className="flex flex-col w-64 bg-white dark:bg-background-dark dark:border-r dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-center h-20 border-b dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">water_drop</span>
          <h1 className="text-xl font-bold text-[#111618] dark:text-white">Agua André</h1>
        </div>
      </div>

      <div className="flex flex-col justify-between flex-1 p-4">
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-primary/20 text-primary dark:bg-primary/30'
                  : 'text-[#617c89] dark:text-gray-400 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <span className={`material-symbols-outlined ${item.fill && isActive(item.path) ? 'fill' : ''}`}>
                {item.icon}
              </span>
              <p className="text-sm font-medium leading-normal">{item.label}</p>
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t pt-4 dark:border-gray-700">
          <div className="flex gap-3 items-center p-2">
            <div className="bg-primary/20 flex items-center justify-center rounded-full size-10">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-[#111618] dark:text-white text-base font-medium leading-normal">
                {user?.nombre || 'Admin'}
              </h2>
              <p className="text-[#617c89] dark:text-gray-400 text-sm font-normal leading-normal capitalize">
                {user?.rol || 'Administrativo'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-[#617c89] dark:text-gray-400 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <p className="text-sm font-medium leading-normal">Cerrar Sesión</p>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;


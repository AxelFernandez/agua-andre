import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

function DashboardAdministrativo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    // Redirigir automáticamente a la página de clientes
    navigate('/administrativo/clientes');
  }, [navigate]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 bg-background-light dark:bg-background-dark">
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <span className="material-symbols-outlined text-primary text-6xl mb-4">dashboard</span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Bienvenido, {user?.nombre}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Redirigiendo al panel de clientes...
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardAdministrativo;


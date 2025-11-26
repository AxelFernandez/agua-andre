import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../services/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión desde localStorage al iniciar
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(userData);
          console.log('✅ Sesión restaurada:', userData.nombre, '- Rol:', userData.rol);
        } else {
          console.log('ℹ️ No hay sesión guardada');
        }
      } catch (error) {
        console.error('❌ Error al restaurar sesión:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loginPorPadron = async (padron) => {
    try {
      const response = await axios.post('/auth/login/padron', { padron });
      const { access_token, usuario } = response.data;
      
      // Guardar en estado
      setToken(access_token);
      setUser(usuario);
      
      // Guardar en localStorage (el interceptor de axios lo usará automáticamente)
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(usuario));
      
      console.log('✅ Login exitoso por padrón:', usuario.nombre);
      
      return usuario;
    } catch (error) {
      console.error('❌ Error en login por padrón:', error);
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  const loginInterno = async (email, password) => {
    try {
      const response = await axios.post('/auth/login/interno', { email, password });
      const { access_token, usuario } = response.data;
      
      // Guardar en estado
      setToken(access_token);
      setUser(usuario);
      
      // Guardar en localStorage (el interceptor de axios lo usará automáticamente)
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(usuario));
      
      console.log('✅ Login exitoso interno:', usuario.nombre);
      
      return usuario;
    } catch (error) {
      console.error('❌ Error en login interno:', error);
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  const logout = () => {
    console.log('🚪 Cerrando sesión...');
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    loading,
    loginPorPadron,
    loginInterno,
    logout,
    API_URL,
  };

  // Mostrar loading mientras se inicializa
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-6xl animate-spin">refresh</span>
          <p className="text-[#617c89] mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


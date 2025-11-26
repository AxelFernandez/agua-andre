import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import LoginInterno from './pages/LoginInterno';
import DashboardCliente from './pages/DashboardCliente';
import DashboardOperario from './pages/DashboardOperario';
import DashboardAdministrativo from './pages/DashboardAdministrativo';
import ClientesAdmin from './pages/ClientesAdmin';
import CrearCliente from './pages/CrearCliente';
import VerCliente from './pages/VerCliente';
import EditarCliente from './pages/EditarCliente';
import NuevaLectura from './pages/NuevaLectura';

function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login-interno" element={<LoginInterno />} />
          
          <Route 
            path="/cliente" 
            element={
              <PrivateRoute allowedRoles={['cliente']}>
                <DashboardCliente />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/operario" 
            element={
              <PrivateRoute allowedRoles={['operario']}>
                <DashboardOperario />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/administrativo" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <DashboardAdministrativo />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/clientes" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <ClientesAdmin />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/clientes/crear" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <CrearCliente />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/clientes/ver/:id" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <VerCliente />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/clientes/editar/:id" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <EditarCliente />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/clientes/:clienteId/nueva-lectura" 
            element={
              <PrivateRoute allowedRoles={['administrativo', 'operario']}>
                <NuevaLectura />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


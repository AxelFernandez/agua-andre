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
import ConfiguracionTarifario from './pages/ConfiguracionTarifario';
import EstadosServicio from './pages/EstadosServicio';
import GenerarBoletas from './pages/GenerarBoletas';
import ControlPagos from './pages/ControlPagos';
import PagarBoleta from './pages/PagarBoleta';
import ZonasAdmin from './pages/ZonasAdmin';
import UsuariosSistema from './pages/UsuariosSistema';
import AuditoriaCambios from './pages/AuditoriaCambios';
import BoletasClienteAdmin from './pages/BoletasClienteAdmin';
import CobrosEfectivo from './pages/CobrosEfectivo';
import Estadisticas from './pages/Estadisticas';

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
            path="/cliente/dashboard" 
            element={
              <PrivateRoute allowedRoles={['cliente']}>
                <DashboardCliente />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/cliente/pagar-boleta/:boletaId" 
            element={
              <PrivateRoute allowedRoles={['cliente']}>
                <PagarBoleta />
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
            path="/administrativo/clientes/:id/boletas" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <BoletasClienteAdmin />
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

          <Route 
            path="/administrativo/tarifario" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <ConfiguracionTarifario />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/estados-servicio" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <EstadosServicio />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/generar-boletas" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <GenerarBoletas />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/control-pagos" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <ControlPagos />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/cobros-efectivo" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <CobrosEfectivo />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/zonas" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <ZonasAdmin />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/usuarios-sistema" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <UsuariosSistema />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/auditoria" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <AuditoriaCambios />
              </PrivateRoute>
            } 
          />

          <Route 
            path="/administrativo/estadisticas" 
            element={
              <PrivateRoute allowedRoles={['administrativo']}>
                <Estadisticas />
              </PrivateRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


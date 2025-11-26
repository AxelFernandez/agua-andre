import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginInterno() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginInterno } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const usuario = await loginInterno(email, password);
      
      if (usuario.rol === 'operario') {
        navigate('/operario');
      } else if (usuario.rol === 'administrativo') {
        navigate('/administrativo');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f3f4] dark:border-b-white/10 px-4 sm:px-10 py-3 fixed top-0 left-0 right-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4 text-[#111618] dark:text-white">
            <div className="size-6 text-primary">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em]">Asociación de Agua Potable Gustavo André</h2>
          </div>
          <div className="hidden sm:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <button 
                onClick={() => navigate('/')}
                className="text-sm font-medium leading-normal text-[#111618] dark:text-white hover:text-primary dark:hover:text-primary"
              >
                Inicio
              </button>
              <a className="text-sm font-medium leading-normal text-[#111618] dark:text-white hover:text-primary dark:hover:text-primary" href="#contacto">
                Contacto
              </a>
              <a className="text-sm font-medium leading-normal text-[#111618] dark:text-white hover:text-primary dark:hover:text-primary" href="#ayuda">
                Ayuda
              </a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 items-center justify-center py-20 px-4 pt-24">
          <div className="w-full max-w-lg mx-auto">
            <div className="flex flex-col items-stretch justify-start rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] bg-white dark:bg-background-dark/50 dark:border dark:border-white/10">
              <div className="flex w-full flex-col items-stretch justify-center gap-6 p-8 sm:p-10">
                <div className="flex flex-col gap-2 text-center">
                  <h1 className="text-[#111618] dark:text-white text-3xl font-bold leading-tight tracking-[-0.033em]">
                    Bienvenido al Portal de Gestión
                  </h1>
                  <p className="text-[#617c89] dark:text-gray-300 text-base font-normal leading-normal">
                    Acceda para gestionar su cuenta, consultar facturas o administrar operaciones.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <label className="flex flex-col">
                    <p className="text-[#111618] dark:text-white text-sm font-medium leading-normal pb-2">
                      Usuario o Correo Electrónico
                    </p>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111618] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dbe2e6] dark:border-white/20 bg-white dark:bg-background-dark h-12 placeholder:text-[#617c89] px-4 text-base font-normal leading-normal"
                      placeholder="Ingrese su usuario"
                      required
                    />
                  </label>

                  <label className="flex flex-col">
                    <p className="text-[#111618] dark:text-white text-sm font-medium leading-normal pb-2">
                      Contraseña
                    </p>
                    <div className="flex w-full flex-1 items-stretch">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-[#111618] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-r-0 border-[#dbe2e6] dark:border-white/20 bg-white dark:bg-background-dark h-12 placeholder:text-[#617c89] pl-4 pr-2 text-base font-normal leading-normal"
                        placeholder="Ingrese su contraseña"
                        required
                      />
                      <div 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#617c89] dark:text-gray-300 flex border border-l-0 border-[#dbe2e6] dark:border-white/20 bg-white dark:bg-background-dark items-center justify-center px-3 rounded-r-lg cursor-pointer hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </div>
                    </div>
                  </label>

                  {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">{loading ? 'Ingresando...' : 'Ingresar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Volver al acceso por padrón
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 px-4 sm:px-10 border-t border-[#f0f3f4] dark:border-white/10 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
            <p className="text-sm text-[#617c89] dark:text-gray-400">
              © 2024 Asociación de Agua Potable Gustavo André. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <a className="text-sm text-[#617c89] dark:text-gray-400 hover:text-primary dark:hover:text-primary" href="#privacidad">
                Política de Privacidad
              </a>
              <a className="text-sm text-[#617c89] dark:text-gray-400 hover:text-primary dark:hover:text-primary" href="#terminos">
                Términos de Servicio
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LoginInterno;


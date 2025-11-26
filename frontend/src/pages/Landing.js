import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import backgroundImage from '../assets/background.jpeg';

function Landing() {
  const [padron, setPadron] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginPorPadron } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginPorPadron(padron);
      navigate('/cliente');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden">
      <header className="flex items-center justify-between whitespace-nowrap px-4 sm:px-10 py-4 absolute top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3 text-white">
          <div className="size-8 text-white">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">Agua Potable Gustavo André</h2>
        </div>
        <div className="hidden sm:flex flex-1 justify-end gap-8">
          <div className="flex items-center gap-9">
            <a className="text-sm font-medium leading-normal text-white hover:opacity-80 transition-opacity" href="#">Inicio</a>
            <a className="text-sm font-medium leading-normal text-white hover:opacity-80 transition-opacity" href="#">Contacto</a>
            <a className="text-sm font-medium leading-normal text-white hover:opacity-80 transition-opacity" href="#">Ayuda</a>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600">
          <img 
            alt="Viñedos en Gustavo André" 
            className="w-full h-full object-cover opacity-20" 
            src={backgroundImage} 
          />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 py-20 flex flex-col lg:flex-row items-center justify-center gap-16">
          <div className="w-full lg:w-1/2 text-white text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tighter mb-4">
              Conectando nuestra comunidad, gota a gota.
            </h1>
            <p className="text-lg md:text-xl font-light opacity-90 max-w-xl mx-auto lg:mx-0">
              Bienvenido al portal de la Asociación de Agua Potable de Gustavo André. Acceda a su cuenta para una gestión simple y transparente de su servicio de agua.
            </p>
          </div>

          <div className="w-full max-w-md lg:w-1/2">
            <div className="flex flex-col items-stretch justify-start rounded-xl shadow-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-sm border border-white/20 dark:border-slate-800">
              <div className="flex w-full flex-col items-stretch justify-center gap-6 p-8 sm:p-10">
                <div className="flex flex-col gap-1 text-center">
                  <h2 className="text-slate-900 dark:text-white text-2xl font-bold">Acceso Clientes</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-base">Ingrese su número de padrón para continuar.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <label className="flex flex-col">
                    <p className="text-slate-700 dark:text-slate-300 text-sm font-medium pb-2">Número de Padrón</p>
                    <input 
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-12 placeholder:text-slate-400 px-4 text-base font-normal" 
                      placeholder="Ingrese su número de padrón (ej: 10-0036)"
                      value={padron}
                      onChange={(e) => setPadron(e.target.value)}
                      required
                    />
                  </label>

                  {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-4 pt-2">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-blue-600 text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">{loading ? 'Ingresando...' : 'Ingresar al Portal'}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => navigate('/login-interno')}
                      className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-base font-bold leading-normal tracking-[0.015em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span className="truncate">Login Interno</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Landing;


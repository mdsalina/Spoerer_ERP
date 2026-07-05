import React, { useState } from 'react';
import logoSpr from '../assets/logo SPR.PNG';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@spoerer.cl');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);

      setTimeout(() => {
        onLogin({ email, name: 'Admin User', role: 'System Administrator' });
      }, 1000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col font-body-md text-on-surface">
      {/* Header Section for Logo */}
      <header className="w-full pt-xl px-lg flex justify-center">
        <div className="flex items-center gap-sm">
          <img src={logoSpr} className="w-10 h-10 object-contain rounded" alt="Logo SPOERER" />
          <span className="font-display-lg text-display-lg text-primary tracking-tight">SPOERER ERP</span>
        </div>
      </header>

      {/* Main Content: Login Form */}
      <main className="flex-grow flex items-center justify-center p-md">
        <div className="login-card bg-surface-container-lowest w-full max-w-[440px] rounded-xl p-xl flex flex-col gap-lg shadow-sm">
          {/* Welcome Header */}
          <div className="text-center space-y-xs">
            <h1 className="font-headline-md text-headline-md text-primary">Bienvenido al Sistema</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Ingrese sus credenciales para acceder</p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-xs text-left">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block" htmlFor="email">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  mail
                </span>
                <input
                  className="w-full pl-[48px] pr-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all font-body-md text-on-surface"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nombre@empresa.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-xs text-left">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  lock
                </span>
                <input
                  className="w-full pl-[48px] pr-[48px] py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all font-body-md text-on-surface"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-xs cursor-pointer group">
                <input
                  className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary/30 transition-all cursor-pointer"
                  type="checkbox"
                />
                <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface">
                  Recordarme
                </span>
              </label>
              <a className="font-body-sm text-body-sm text-secondary hover:underline font-medium" href="#" onClick={(e) => e.preventDefault()}>
                ¿Olvidó su contraseña?
              </a>
            </div>

            {/* Action Button */}
            <button
              className={`w-full font-title-lg text-title-lg py-md rounded-lg flex items-center justify-center gap-sm transition-all active:scale-[0.98] mt-sm shadow-sm text-white ${
                isSuccess
                  ? 'bg-secondary'
                  : isLoading
                  ? 'bg-primary/80 cursor-wait'
                  : 'bg-primary hover:bg-primary-container'
              }`}
              type="submit"
              disabled={isLoading || isSuccess}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[20px]">progress_activity</span>
                  <span>Verificando...</span>
                </>
              ) : isSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>Acceso Concedido</span>
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="w-full py-lg px-lg flex flex-col md:flex-row items-center justify-between border-t border-outline-variant/30 gap-md">
        <div className="font-body-sm text-body-sm text-on-surface-variant">
          © 2026 Enterprise ERP Management Suite. Todos los derechos reservados.
        </div>
        <div className="flex gap-lg">
          <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors" href="#" onClick={(e) => e.preventDefault()}>
            Términos de servicio
          </a>
          <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors" href="#" onClick={(e) => e.preventDefault()}>
            Privacidad
          </a>
          <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-secondary transition-colors" href="#" onClick={(e) => e.preventDefault()}>
            Soporte
          </a>
        </div>
      </footer>
    </div>
  );
}

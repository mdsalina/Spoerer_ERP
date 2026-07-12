import React, { useState } from 'react';
import logoSpr from '../assets/logo SPR.PNG';
import { supabase } from '../utils/supabaseClient';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      // 1. Intentamos iniciar sesión con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // 2. Buscamos el perfil del usuario para obtener el rol y estado
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        throw new Error("No se encontró un perfil de usuario asociado.");
      }

      // 3. Verificamos si la cuenta está activa
      if (profile.status !== 'Active') {
        await supabase.auth.signOut();
        throw new Error("Su cuenta se encuentra inactiva. Contacte al administrador.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsLoading(false);
        onLogin({ 
          id: profile.id,
          email: profile.email, 
          name: profile.name, 
          role: profile.role 
        });
      }, 1000);
    } catch (err) {
      console.error("Error de inicio de sesión:", err);
      setIsLoading(false);
      
      let errMsg = err.message;
      if (err.message === 'Invalid login credentials') {
        errMsg = "Las credenciales ingresadas no son válidas. Por favor, verifique su correo y contraseña.";
      } else if (err.message.includes('Email not confirmed')) {
        errMsg = "Su correo electrónico no ha sido verificado todavía.";
      } else if (err.message.includes('Email rate limit exceeded') || err.message.includes('rate limit')) {
        errMsg = "Se ha excedido el límite de intentos. Por favor, intente más tarde.";
      }
      
      setLoginError(errMsg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-body-md text-on-surface">
      {/* Main Content: Login Form */}
      <main className="flex-grow flex flex-col items-center justify-center p-md gap-md">
        {/* Logo and title right above the login card */}
        <div className="flex items-center gap-sm">
          <img src={logoSpr} className="w-10 h-10 object-contain rounded" alt="Logo SPOERER" />
          <span className="font-display-lg text-display-lg text-primary tracking-tight">SPOERER ERP</span>
        </div>

        <div className="login-card bg-surface-container-lowest w-full max-w-[440px] rounded-xl p-xl flex flex-col gap-lg shadow-sm">
          {/* Welcome Header */}
          <div className="text-center space-y-xs">
            <h1 className="font-headline-md text-headline-md text-primary">Bienvenido al Sistema</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Ingrese sus credenciales para acceder</p>
          </div>

          {loginError && (
            <div className="bg-error-container/20 border border-error/30 text-error p-md rounded-lg flex items-start gap-sm text-left animate-fade-in">
              <span className="material-symbols-outlined text-[20px] flex-shrink-0 mt-0.5">error</span>
              <div className="font-body-sm text-body-sm">
                <span className="font-bold block">Error de acceso</span>
                {loginError}
              </div>
            </div>
          )}

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

import { type FormEvent, useEffect, useState } from 'react';
import type { AuthCredentials } from '../types/api';

export type AuthModalMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthModalMode;
  isSubmitting: boolean;
  onClose: () => void;
  onLogin: (credentials: AuthCredentials) => Promise<boolean>;
  onRegister: (credentials: AuthCredentials) => Promise<boolean>;
}

export function AuthModal({
  isOpen,
  initialMode = 'login',
  isSubmitting,
  onClose,
  onLogin,
  onRegister,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSlowRequest, setIsSlowRequest] = useState(false);

  // Sincroniza aba inicial e limpa erros ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLocalError(null);
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  // Fecha o modal com Escape quando não está enviando
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  useEffect(() => {
    if (!isSubmitting) {
      setIsSlowRequest(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setIsSlowRequest(true);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [isSubmitting]);

  if (!isOpen) return null;

  const handleBackdropClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSwitchMode = (nextMode: AuthModalMode) => {
    setMode(nextMode);
    setLocalError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const trimmedUser = username.trim();
    if (!trimmedUser || !password.trim()) {
      setLocalError('Preencha usuário e senha.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setLocalError('A senha deve conter ao menos 6 caracteres.');
      return;
    }

    const ok =
      mode === 'login'
        ? await onLogin({ username: trimmedUser, password })
        : await onRegister({ username: trimmedUser, password });

    if (ok) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={handleBackdropClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="animate-modal-in w-full max-w-md rounded-2xl border border-zinc-800/90 bg-[#18181b] p-5 shadow-2xl shadow-black/50 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="auth-modal-title"
              className="text-lg font-bold tracking-tight text-white"
            >
              {mode === 'login' ? 'Entre para jogar' : 'Crie sua conta grátis'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              {mode === 'login'
                ? 'Continue sua partida de hoje de onde parou.'
                : 'Só um usuário e senha para salvar seu progresso diário.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleBackdropClose}
            disabled={isSubmitting}
            aria-label="Fechar modal de acesso"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Abas Login / Cadastro */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-zinc-800/80 bg-[#121213] p-1">
          <button
            type="button"
            aria-pressed={mode === 'login'}
            onClick={() => handleSwitchMode('login')}
            className={`min-h-[40px] rounded-lg py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] ${
              mode === 'login'
                ? 'bg-[#3aa394] text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            aria-pressed={mode === 'register'}
            onClick={() => handleSwitchMode('register')}
            className={`min-h-[40px] rounded-lg py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] ${
              mode === 'register'
                ? 'bg-[#3aa394] text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="auth-username"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-400"
            >
              Usuário
            </label>
            <input
              id="auth-username"
              type="text"
              autoComplete="username"
              autoFocus
              disabled={isSubmitting}
              aria-invalid={Boolean(localError && !username.trim())}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (localError) setLocalError(null);
              }}
              placeholder="Ex: jogador"
              className="min-h-[44px] w-full rounded-xl border border-zinc-700/90 bg-[#121213] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-[#3aa394] focus:ring-2 focus:ring-[#3aa394]/25 disabled:opacity-50"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-400"
              >
                Senha
              </label>
              {mode === 'register' && (
                <span className="text-[11px] text-zinc-500">
                  Mín. 6 caracteres
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                disabled={isSubmitting}
                aria-invalid={Boolean(
                  localError &&
                    (!password.trim() ||
                      (mode === 'register' && password.length < 6))
                )}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (localError) setLocalError(null);
                }}
                placeholder={
                  mode === 'register'
                    ? 'Escolha uma senha segura'
                    : 'Digite sua senha'
                }
                className="min-h-[44px] w-full rounded-xl border border-zinc-700/90 bg-[#121213] py-2.5 pl-3.5 pr-11 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-[#3aa394] focus:ring-2 focus:ring-[#3aa394]/25 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSubmitting}
                title={showPassword ? 'Ocultar caracteres' : 'Mostrar caracteres'}
                aria-label={
                  showPassword ? 'Ocultar caracteres' : 'Mostrar caracteres'
                }
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] disabled:opacity-40"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {localError && (
            <div
              role="alert"
              aria-live="polite"
              className="rounded-xl border border-red-500/40 bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-200"
            >
              {localError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex min-h-[46px] w-full items-center justify-center rounded-xl bg-[#3aa394] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-[#3aa394]/20 transition hover:bg-[#329082] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] focus-visible:ring-offset-2 focus-visible:ring-offset-[#18181b] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {mode === 'login' ? 'Entrando...' : 'Cadastrando...'}
              </span>
            ) : mode === 'login' ? (
              'Entrar e Jogar'
            ) : (
              'Cadastrar e Jogar'
            )}
          </button>

          {isSubmitting && isSlowRequest && (
            <p
              role="status"
              aria-live="polite"
              className="text-center text-xs text-zinc-400"
            >
              O servidor está acordando, aguarde só mais um instante...
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

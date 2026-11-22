import { type FormEvent, useState } from 'react';
import type { AuthCredentials } from '../types/api';

interface AuthModalProps {
  isSubmitting: boolean;
  onLogin: (credentials: AuthCredentials) => Promise<boolean>;
  onRegister: (credentials: AuthCredentials) => Promise<boolean>;
}

export function AuthModal({ isSubmitting, onLogin, onRegister }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSwitchMode = (nextMode: 'login' | 'register') => {
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

    if (mode === 'login') {
      await onLogin({ username: trimmedUser, password });
    } else {
      await onRegister({ username: trimmedUser, password });
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="animate-modal-in w-full max-w-md rounded-2xl border border-zinc-800 bg-[#18181b] p-6 sm:p-8 shadow-2xl">
        {/* Mini logo decorativa */}
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex gap-1.5">
            {['D', 'E', 'C', 'I', 'F', 'R', 'A'].map((letter, idx) => {
              const bg =
                idx === 0 || idx === 5
                  ? 'bg-[#3aa394] border-[#3aa394]'
                  : idx === 2 || idx === 6
                    ? 'bg-[#d3ad69] border-[#d3ad69]'
                    : 'bg-[#312a2c] border-[#312a2c]';
              return (
                <span
                  key={`${letter}-${idx}`}
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border-2 text-base sm:text-lg font-extrabold text-white shadow-sm ${bg}`}
                >
                  {letter}
                </span>
              );
            })}
          </div>
          <p className="text-center text-sm text-zinc-400">
            {mode === 'login'
              ? 'Entre na sua conta para jogar o Decifra do dia'
              : 'Crie sua conta para salvar suas tentativas no Decifra'}
          </p>
        </div>

        {/* Abas Login / Cadastro */}
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#121213] p-1 border border-zinc-800/80">
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`rounded-lg py-2 text-sm font-bold transition ${
              mode === 'login'
                ? 'bg-[#3aa394] text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`rounded-lg py-2 text-sm font-bold transition ${
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome de usuário"
              className="w-full rounded-xl border border-zinc-700 bg-[#121213] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-[#3aa394] focus:ring-2 focus:ring-[#3aa394]/25 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-400"
            >
              Senha
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                mode === 'register' ? 'Mínimo de 6 caracteres' : 'Sua senha'
              }
              className="w-full rounded-xl border border-zinc-700 bg-[#121213] px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-[#3aa394] focus:ring-2 focus:ring-[#3aa394]/25 disabled:opacity-50"
            />
          </div>

          {localError && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-200">
              {localError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#3aa394] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-[#3aa394]/20 transition hover:bg-[#329082] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
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
        </form>
      </div>
    </div>
  );
}

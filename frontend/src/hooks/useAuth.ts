import { useCallback, useState } from 'react';
import {
  api,
  ApiError,
  clearAuthSession,
  restoreStoredSession,
  saveAuthSession,
} from '../services/api';
import type { AuthCredentials, AuthUser } from '../types/api';
import type { ToastVariant } from './useToast';

interface UseAuthOptions {
  showToast: (message: string, variant?: ToastVariant) => void;
}

export function useAuth({ showToast }: UseAuthOptions) {
  const [session, setSession] = useState<{
    token: string | null;
    user: AuthUser | null;
  }>(() => restoreStoredSession());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { token, user } = session;
  const isAuthenticated = Boolean(token && user);

  const logout = useCallback(
    (reason?: string) => {
      clearAuthSession();
      setSession({ token: null, user: null });
      if (reason) {
        showToast(reason, 'info');
      }
    },
    [showToast]
  );

  const login = useCallback(
    async (credentials: AuthCredentials): Promise<boolean> => {
      setIsSubmitting(true);
      try {
        const response = await api.login({
          username: credentials.username.trim(),
          password: credentials.password,
        });
        const normalizedUser: AuthUser = {
          id: String(response.user.id),
          username: response.user.username,
        };
        saveAuthSession(response.token, normalizedUser);
        setSession({ token: response.token, user: normalizedUser });
        showToast(`Bem-vindo, ${normalizedUser.username}!`, 'success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Erro ao realizar login.';
        showToast(message, 'error');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [showToast]
  );

  const register = useCallback(
    async (credentials: AuthCredentials): Promise<boolean> => {
      setIsSubmitting(true);
      try {
        await api.register({
          username: credentials.username.trim(),
          password: credentials.password,
        });
        // Após cadastrar com sucesso (201), autentica automaticamente para já carregar o jogo
        const loginResponse = await api.login({
          username: credentials.username.trim(),
          password: credentials.password,
        });
        const normalizedUser: AuthUser = {
          id: String(loginResponse.user.id),
          username: loginResponse.user.username,
        };
        saveAuthSession(loginResponse.token, normalizedUser);
        setSession({ token: loginResponse.token, user: normalizedUser });
        showToast('Conta criada com sucesso! Bom jogo!', 'success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Erro ao criar conta.';
        showToast(message, 'error');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [showToast]
  );

  return {
    token,
    user,
    isAuthenticated,
    isSubmitting,
    login,
    register,
    logout,
  };
}

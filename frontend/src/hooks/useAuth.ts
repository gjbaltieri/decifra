import { useCallback, useState } from 'react';
import {
  api,
  ApiError,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  saveAuthSession,
} from '../services/api';
import type { AuthCredentials, AuthUser } from '../types/api';
import type { ToastVariant } from './useToast';

interface UseAuthOptions {
  showToast: (message: string, variant?: ToastVariant) => void;
}

export function useAuth({ showToast }: UseAuthOptions) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated = Boolean(token && user);

  const logout = useCallback(
    (reason?: string) => {
      clearAuthSession();
      setToken(null);
      setUser(null);
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
        saveAuthSession(response.token, response.user);
        setToken(response.token);
        setUser(response.user);
        showToast(`Bem-vindo, ${response.user.username}!`, 'success');
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
        saveAuthSession(loginResponse.token, loginResponse.user);
        setToken(loginResponse.token);
        setUser(loginResponse.user);
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

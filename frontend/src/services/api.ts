import type {
  ApiErrorPayload,
  AuthCredentials,
  AuthUser,
  GameHistoryResponse,
  GuessRequest,
  GuessResponse,
  LoginResponse,
  RegisterResponse,
  TodayGameResponse,
} from '../types/api';

function resolveDefaultBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !window.location.origin.includes(':5173') &&
    window.location.origin.startsWith('http')
  ) {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

const RAW_BASE_URL = resolveDefaultBaseUrl();
export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

const TOKEN_STORAGE_KEY = 'termo_jwt_token';
const USER_STORAGE_KEY = 'termo_auth_user';
const SECRET_WORD_CACHE_PREFIX = 'termo_daily_word_';

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor no momento. Tente novamente em alguns instantes.';

function normalizeUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as { id?: unknown; username?: unknown };
  const hasValidId =
    (typeof candidate.id === 'string' && candidate.id.trim().length > 0) ||
    (typeof candidate.id === 'number' && Number.isFinite(candidate.id));

  if (!hasValidId || typeof candidate.username !== 'string' || !candidate.username.trim()) {
    return null;
  }

  return {
    id: String(candidate.id),
    username: candidate.username.trim(),
  };
}

interface DecodedJwtPayload {
  userId?: string | number;
  username?: string;
  exp?: number;
}

function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const json = atob(padded);
    return JSON.parse(json) as DecodedJwtPayload;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    return token && token.trim().length > 0 ? token : null;
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: AuthUser): void {
  const normalized = normalizeUser(user) ?? {
    id: String(user.id),
    username: user.username,
  };
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignorar falhas de quota do localStorage
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignorar
  }
}

export function restoreStoredSession(): {
  token: string | null;
  user: AuthUser | null;
} {
  const token = getStoredToken();
  if (!token) {
    return { token: null, user: null };
  }

  const payload = decodeJwtPayload(token);
  if (payload?.exp && payload.exp * 1000 <= Date.now()) {
    clearAuthSession();
    return { token: null, user: null };
  }

  const storedUser = getStoredUser();
  if (storedUser) {
    return { token, user: storedUser };
  }

  // Fallback: reconstrói o usuário a partir do payload do JWT caso termo_auth_user esteja ausente
  if (payload) {
    const fromToken = normalizeUser({
      id: payload.userId,
      username: payload.username,
    });
    if (fromToken) {
      saveAuthSession(token, fromToken);
      return { token, user: fromToken };
    }
  }

  clearAuthSession();
  return { token: null, user: null };
}

function getTodayDateKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function saveRevealedWordForToday(userId: string, word: string): void {
  try {
    const key = `${SECRET_WORD_CACHE_PREFIX}${userId}_${getTodayDateKey()}`;
    localStorage.setItem(key, word.toUpperCase());
  } catch {
    // Ignorar
  }
}

export function getRevealedWordForToday(userId: string): string | null {
  try {
    const key = `${SECRET_WORD_CACHE_PREFIX}${userId}_${getTodayDateKey()}`;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function resolveFriendlyErrorMessage(status: number, payload: ApiErrorPayload | null): string {
  const backendMessage = payload?.error || payload?.message;
  if (backendMessage && typeof backendMessage === 'string') {
    return backendMessage;
  }

  switch (status) {
    case 400:
      return 'Dados ou palpite inválidos. Verifique e tente novamente.';
    case 401:
      return 'Sessão expirada ou credenciais inválidas. Faça login novamente.';
    case 404:
      return 'Recurso ou palavra do dia não encontrada.';
    case 409:
      return 'Este nome de usuário já está em uso.';
    case 422:
      return 'A senha deve conter ao menos 6 caracteres.';
    case 500:
      return 'Erro interno no servidor. Tente novamente em instantes.';
    case 502:
    case 503:
    case 504:
      return NETWORK_ERROR_MESSAGE;
    default:
      return `Erro inesperado (${status}).`;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  let data: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = resolveFriendlyErrorMessage(
      response.status,
      (data as ApiErrorPayload | null) ?? null
    );
    throw new ApiError(response.status, message);
  }

  return data as T;
}

export const api = {
  getGameHistory(limit: number, offset: number, signal: AbortSignal): Promise<GameHistoryResponse> {
    const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return request<GameHistoryResponse>(`/game/history?${query}`, { signal }, true);
  },

  /**
   * POST /login
   */
  login(credentials: AuthCredentials): Promise<LoginResponse> {
    return request<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * POST /adduser
   */
  register(credentials: AuthCredentials): Promise<RegisterResponse> {
    return request<RegisterResponse>('/adduser', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * GET /game/findtodaygame
   */
  findTodayGame(): Promise<TodayGameResponse> {
    return request<TodayGameResponse>(
      '/game/findtodaygame',
      {
        method: 'GET',
      },
      true
    );
  },

  /**
   * POST /game/guess
   */
  sendGuess(payload: GuessRequest): Promise<GuessResponse> {
    return request<GuessResponse>(
      '/game/guess',
      {
        method: 'POST',
        body: JSON.stringify({ guess: payload.guess.toUpperCase() }),
      },
      true
    );
  },
};

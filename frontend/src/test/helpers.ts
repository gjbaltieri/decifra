import { vi } from 'vitest';
import type { AuthUser } from '../types/api';

export const TOKEN_STORAGE_KEY = 'termo_jwt_token';
export const USER_STORAGE_KEY = 'termo_auth_user';

export const DEFAULT_USER: AuthUser = {
  id: 'user-1',
  username: 'jogador',
};

export const DEFAULT_TOKEN = 'fake-jwt-token-123';

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function seedAuthenticatedSession(
  token = DEFAULT_TOKEN,
  user: AuthUser = DEFAULT_USER
): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export type FetchRouteHandler = (
  init: RequestInit | undefined,
  url: string
) => Response | Promise<Response>;

/**
 * Intercepta `globalThis.fetch` mapeando rotas no formato `"METHOD /caminho"`.
 * Exemplo: `{ 'GET /game/findtodaygame': () => jsonResponse({ status: 'playing', attempts: [] }) }`
 */
export function mockFetchRoutes(routes: Record<string, FetchRouteHandler>) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      const parsed = new URL(url);
      const method = (init?.method || 'GET').toUpperCase();
      const routeKey = `${method} ${parsed.pathname}`;

      const handler = routes[routeKey];
      if (!handler) {
        throw new Error(`Rota não mockada nos testes: ${routeKey}`);
      }

      return handler(init, url);
    });
}

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  jsonResponse,
  mockFetchRoutes,
  seedAuthenticatedSession,
} from './helpers';

describe('Tratamento de erros de sessão e API', () => {
  it('limpa a sessão e volta para o login quando GET /game/findtodaygame retorna 401', async () => {
    // Arrange
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ error: 'Token expirado.' }, 401),
    });

    // Act
    render(<App />);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /entrar e jogar/i })
      ).toBeInTheDocument();
    });
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
    expect(
      screen.getByText(/sua sessão expirou\. faça login novamente\./i)
    ).toBeInTheDocument();
  });

  it('limpa a sessão e volta para o login quando POST /game/guess retorna 401', async () => {
    // Arrange
    const user = userEvent.setup();
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [] }),
      'POST /game/guess': () =>
        jsonResponse({ error: 'Não autorizado.' }, 401),
    });

    render(<App />);
    await screen.findByRole('grid', { name: /tabuleiro do decifra/i });

    // Act
    await user.keyboard('TERMO{Enter}');

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /entrar e jogar/i })
      ).toBeInTheDocument();
    });
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
    expect(
      screen.getByText(/sua sessão expirou\. faça login novamente\./i)
    ).toBeInTheDocument();
  });

  it('exibe tela de erro com opção de tentar novamente quando GET /game/findtodaygame retorna 500', async () => {
    // Arrange
    const user = userEvent.setup();
    let requestCount = 0;
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () => {
        requestCount += 1;
        if (requestCount === 1) {
          return jsonResponse({}, 500);
        }
        return jsonResponse({ status: 'playing', attempts: [] });
      },
    });

    // Act
    render(<App />);

    // Assert — exibe erro 500 amigável
    expect(
      await screen.findByText(/não foi possível carregar o jogo/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/erro interno no servidor/i).length
    ).toBeGreaterThanOrEqual(1);

    // Act — clica em Tentar Novamente e consegue carregar
    await user.click(
      screen.getByRole('button', { name: /tentar novamente/i })
    );

    // Assert — tabuleiro carregado após retry
    expect(
      await screen.findByRole('grid', { name: /tabuleiro do decifra/i })
    ).toBeInTheDocument();
  });

  it('exibe toast de erro quando POST /game/guess retorna 500 sem deslogar o usuário', async () => {
    // Arrange
    const user = userEvent.setup();
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [] }),
      'POST /game/guess': () => jsonResponse({}, 500),
    });

    render(<App />);
    await screen.findByRole('grid', { name: /tabuleiro do decifra/i });

    // Act
    await user.keyboard('TERMO{Enter}');

    // Assert
    expect(
      await screen.findByText(/erro interno no servidor/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('grid', { name: /tabuleiro do decifra/i })
    ).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).not.toBeNull();
  });
});

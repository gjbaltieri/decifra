import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import {
  DEFAULT_TOKEN,
  DEFAULT_USER,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  jsonResponse,
  mockFetchRoutes,
  seedAuthenticatedSession,
} from './helpers';

describe('Autenticação (Login, Cadastro e Logout)', () => {
  it('exibe tela inicial limpa com exemplo de 5 letras, CTA Jogar, botão Entrar no header e abre/fecha modal de login', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Tela inicial limpa sem formulário fixo e sem 7 bloquinhos
    expect(
      screen.getByRole('heading', { name: 'DECIFRA' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /descubra a palavra do dia/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/posição certa/i)).toBeInTheDocument();
    expect(screen.getByText(/outra posição/i)).toBeInTheDocument();
    expect(screen.getByText(/não existe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^jogar$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^entrar$/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Abre modal pelo botão Entrar do header
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Alterna visibilidade da senha
    const passwordInput = within(dialog).getByLabelText(/senha/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(
      within(dialog).getByRole('button', { name: /mostrar caracteres/i })
    );
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(
      within(dialog).getByRole('button', { name: /ocultar caracteres/i })
    );
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Fecha o modal pelo botão X
    await user.click(
      within(dialog).getByRole('button', { name: /fechar modal de acesso/i })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('envia apenas username e password no login, salva o JWT no localStorage e carrega o jogo do dia', async () => {
    // Arrange
    const user = userEvent.setup();
    let loginRequestBody: Record<string, unknown> | null = null;
    let gameRequestAuthHeader: string | null = null;

    mockFetchRoutes({
      'POST /login': (init) => {
        loginRequestBody = JSON.parse(String(init?.body));
        return jsonResponse({
          token: DEFAULT_TOKEN,
          user: DEFAULT_USER,
        });
      },
      'GET /game/findtodaygame': (init) => {
        const headers = new Headers(init?.headers);
        gameRequestAuthHeader = headers.get('Authorization');
        return jsonResponse({
          status: 'playing',
          attempts: [],
        });
      },
    });

    render(<App />);

    // Act — abre modal pelo CTA principal "Jogar"
    await user.click(screen.getByRole('button', { name: /^jogar$/i }));
    const dialog = screen.getByRole('dialog');

    await user.type(within(dialog).getByLabelText(/usuário/i), 'jogador');
    await user.type(within(dialog).getByLabelText(/senha/i), 'senha123');
    await user.click(
      within(dialog).getByRole('button', { name: /entrar e jogar/i })
    );

    // Assert
    expect(
      screen.getByRole('heading', { name: 'DECIFRA' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/desenvolvido por gustavo baltieri/i)
    ).toBeInTheDocument();
    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/gjbaltieri');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
    expect(linkedinLink).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/gustavo-baltieri'
    );
    expect(linkedinLink).toHaveAttribute('target', '_blank');
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');

    expect(
      await screen.findByRole('grid', { name: /tabuleiro do decifra/i })
    ).toBeInTheDocument();

    expect(loginRequestBody).toEqual({
      username: 'jogador',
      password: 'senha123',
    });
    expect(loginRequestBody).not.toHaveProperty('email');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(DEFAULT_TOKEN);
    expect(gameRequestAuthHeader).toBe(`Bearer ${DEFAULT_TOKEN}`);
  });

  it('envia apenas username e password no cadastro, autentica e carrega o jogo do dia', async () => {
    // Arrange
    const user = userEvent.setup();
    let registerRequestBody: Record<string, unknown> | null = null;

    mockFetchRoutes({
      'POST /adduser': (init) => {
        registerRequestBody = JSON.parse(String(init?.body));
        return jsonResponse(
          {
            id: 'user-2',
            username: 'novojogador',
            created_at: '2026-11-22T12:00:00.000Z',
          },
          201
        );
      },
      'POST /login': () =>
        jsonResponse({
          token: 'novo-jwt-token',
          user: { id: 'user-2', username: 'novojogador' },
        }),
      'GET /game/findtodaygame': () =>
        jsonResponse({
          status: 'playing',
          attempts: [],
        }),
    });

    render(<App />);

    // Act — abre modal direto na aba de cadastro pelo link "Criar conta grátis"
    await user.click(
      screen.getByRole('button', { name: /criar conta grátis/i })
    );
    const dialog = screen.getByRole('dialog');

    await user.type(within(dialog).getByLabelText(/usuário/i), 'novojogador');
    await user.type(within(dialog).getByLabelText(/senha/i), 'segredo123');
    await user.click(
      within(dialog).getByRole('button', { name: /cadastrar e jogar/i })
    );

    // Assert
    expect(
      screen.getByRole('heading', { name: 'DECIFRA' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/desenvolvido por gustavo baltieri/i)
    ).toBeInTheDocument();
    const githubLink = screen.getByRole('link', { name: /github/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/gjbaltieri');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

    const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
    expect(linkedinLink).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/gustavo-baltieri'
    );
    expect(linkedinLink).toHaveAttribute('target', '_blank');
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');

    expect(
      await screen.findByRole('grid', { name: /tabuleiro do decifra/i })
    ).toBeInTheDocument();

    expect(registerRequestBody).toEqual({
      username: 'novojogador',
      password: 'segredo123',
    });
    expect(registerRequestBody).not.toHaveProperty('email');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('novo-jwt-token');
  });

  it('exibe toast de erro quando a API retorna 401 no login', async () => {
    // Arrange
    const user = userEvent.setup();
    mockFetchRoutes({
      'POST /login': () =>
        jsonResponse({ error: 'Usuário ou senha inválidos.' }, 401),
    });

    render(<App />);

    // Act
    await user.click(screen.getByRole('button', { name: /^entrar$/i }));
    const dialog = screen.getByRole('dialog');

    await user.type(within(dialog).getByLabelText(/usuário/i), 'jogador');
    await user.type(within(dialog).getByLabelText(/senha/i), 'errada');
    await user.click(
      within(dialog).getByRole('button', { name: /entrar e jogar/i })
    );

    // Assert
    expect(
      await screen.findByText('Usuário ou senha inválidos.')
    ).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(
      screen.queryByRole('grid', { name: /tabuleiro do decifra/i })
    ).not.toBeInTheDocument();
  });

  it('exibe toast de erro quando a API retorna 400 no cadastro', async () => {
    // Arrange
    const user = userEvent.setup();
    mockFetchRoutes({
      'POST /adduser': () =>
        jsonResponse({ error: 'Dados de cadastro inválidos.' }, 400),
    });

    render(<App />);

    // Act
    await user.click(screen.getByRole('button', { name: /^jogar$/i }));
    const dialog = screen.getByRole('dialog');

    await user.click(
      within(dialog).getByRole('button', { name: /criar conta/i })
    );
    await user.type(within(dialog).getByLabelText(/usuário/i), 'jogador');
    await user.type(within(dialog).getByLabelText(/senha/i), '123456');
    await user.click(
      within(dialog).getByRole('button', { name: /cadastrar e jogar/i })
    );

    // Assert
    expect(
      await screen.findByText('Dados de cadastro inválidos.')
    ).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('remove o token do localStorage e volta para a tela inicial ao clicar em Sair', async () => {
    // Arrange
    const user = userEvent.setup();
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [] }),
    });

    render(<App />);
    await screen.findByRole('grid', { name: /tabuleiro do decifra/i });

    // Act
    await user.click(screen.getByRole('button', { name: /sair/i }));

    // Assert
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^jogar$/i })
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /^entrar$/i })
    ).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
  });

  it('restaura a sessão ao recarregar mesmo quando user.id salvo é numérico (SERIAL do PostgreSQL) sem exibir tela inicial', async () => {
    // Arrange — simula dados salvos como retornados pelo backend (id numérico)
    localStorage.setItem(TOKEN_STORAGE_KEY, DEFAULT_TOKEN);
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify({ id: 42, username: 'gustavo' })
    );
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [] }),
    });

    // Act — simula inicialização após F5
    render(<App />);

    // Assert — não há flash da tela inicial (botão Jogar não aparece)
    expect(
      screen.queryByRole('button', { name: /^jogar$/i })
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('grid', { name: /tabuleiro do decifra/i })
    ).toBeInTheDocument();
    expect(screen.getByText('@gustavo')).toBeInTheDocument();
  });

  it('restaura a sessão a partir do payload do JWT quando apenas o token existe no localStorage', async () => {
    // Arrange — JWT com payload { userId: 7, username: 'maria', exp: futuro }
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const payload = btoa(
      JSON.stringify({ userId: 7, username: 'maria', exp: futureExp })
    );
    const jwt = `header.${payload}.signature`;
    localStorage.setItem(TOKEN_STORAGE_KEY, jwt);

    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [] }),
    });

    // Act
    render(<App />);

    // Assert
    expect(
      screen.queryByRole('button', { name: /^jogar$/i })
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('grid', { name: /tabuleiro do decifra/i })
    ).toBeInTheDocument();
    expect(screen.getByText('@maria')).toBeInTheDocument();
  });
});

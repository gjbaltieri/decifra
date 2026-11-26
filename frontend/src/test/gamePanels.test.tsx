import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it } from 'vitest';
import { App } from '../App';
import { APP_VERSION, LAST_SEEN_VERSION_KEY } from '../constants/changelog';
import { DEFAULT_TOKEN, jsonResponse, mockFetchRoutes, seedAuthenticatedSession } from './helpers';

// O jsdom não implementa a abertura e o fechamento nativos de <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});

const today = () => jsonResponse({ status: 'playing', attempts: [] });
const game = {
  id: 1, username: 'jogador', date: '2026-11-25', created_at: '2026-11-25T03:00:00Z',
  status: 'playing', word: 'SIGILO', total_attempts: 2,
};

describe('Painéis da partida', () => {
  it('oculta palavras, pagina após uma falha e preserva o palpite digitado', async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    let failNextPage = true;
    const offsets: string[] = [];
    mockFetchRoutes({
      'GET /game/findtodaygame': today,
      'GET /game/history': (init, url) => {
        expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${DEFAULT_TOKEN}`);
        const query = new URL(url).searchParams;
        expect(query.get('limit')).toBe('10');
        offsets.push(query.get('offset')!);
        if (query.get('offset') === '0') {
          return jsonResponse({ games: [game, { ...game, id: 2, word: null, status: 'lost' }], hasMore: true });
        }
        if (failNextPage) {
          failNextPage = false;
          return jsonResponse({}, 500);
        }
        return jsonResponse({ games: [{ ...game, id: 3, status: 'won', word: 'livro' }], hasMore: false });
      },
    });
    render(<App />);
    const board = await screen.findByRole('grid');
    await user.keyboard('CA');
    await user.click(screen.getByRole('button', { name: 'Histórico de partidas' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(await dialog.findAllByText('?????')).toHaveLength(2);
    expect(dialog.queryByText(game.word)).toBeNull();
    expect(dialog.getAllByText('25/11/2026')).toHaveLength(2);
    await user.keyboard('XYZ');
    await user.click(dialog.getByRole('button', { name: 'Carregar mais' }));
    await dialog.findByRole('alert');
    await user.click(dialog.getByRole('button', { name: 'Tentar novamente' }));
    await dialog.findByText('LIVRO');
    expect(offsets).toEqual(['0', '2', '2']);
    expect(dialog.queryByText('Carregar mais')).toBeNull();
    await user.click(dialog.getByRole('button', { name: 'Fechar modal' }));
    expect(within(board).getAllByRole('row')[0].textContent).toBe('CA');
  });

  it('exibe o carregamento e o histórico vazio', async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    let finish!: (response: Response) => void;
    const pending = new Promise<Response>((resolve) => { finish = resolve; });
    mockFetchRoutes({ 'GET /game/findtodaygame': today, 'GET /game/history': () => pending });
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Histórico de partidas' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('status')).toHaveTextContent('Carregando histórico');
    finish(jsonResponse({ games: [], hasMore: false }));
    expect(await dialog.findByText(/ainda não tem partidas/)).toBeInTheDocument();
    expect(dialog.queryByText('Carregar mais')).toBeNull();
  });

  it('marca a versão como lida ao abrir as notas e mantém a leitura após recarregar', async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    localStorage.setItem(LAST_SEEN_VERSION_KEY, '1.0.0');
    mockFetchRoutes({ 'GET /game/findtodaygame': today });
    const app = render(<App />);
    await user.click(screen.getByRole('button', { name: /novidades disponíveis/i }));
    const dialog = within(screen.getByRole('dialog', { name: 'Notas de atualização' }));
    expect(dialog.getByText(/WhatsApp/)).toBeInTheDocument();
    expect(localStorage.getItem(LAST_SEEN_VERSION_KEY)).toBe(APP_VERSION);
    await user.click(dialog.getByRole('button', { name: 'Fechar modal' }));
    expect(screen.queryByRole('button', { name: /novidades disponíveis/i })).toBeNull();
    app.unmount();
    render(<App />);
    await screen.findByRole('grid');
    expect(screen.getByRole('button', { name: 'DECIFRA — notas de atualização' })).toBeInTheDocument();
  });

  it('exibe @username e sequência de vitórias no cabeçalho, atualiza imediatamente ao vencer e mostra resumo no histórico', async () => {
    const user = userEvent.setup();
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [], currentStreak: 3, bestStreak: 5 }),
      'POST /game/guess': () =>
        jsonResponse(
          {
            attemptNumber: 1,
            guess: 'TERMO',
            feedback: ['correct', 'correct', 'correct', 'correct', 'correct'],
            status: 'won',
            word: 'TERMO',
            currentStreak: 4,
            bestStreak: 5,
          },
          201
        ),
      'GET /game/history': () =>
        jsonResponse({
          games: [{ ...game, id: 10, status: 'won', word: 'TERMO' }],
          hasMore: false,
          currentStreak: 4,
          bestStreak: 5,
        }),
    });

    render(<App />);
    await screen.findByRole('grid');

    // @username e streak inicial no cabeçalho
    expect(screen.getByText('@jogador')).toBeInTheDocument();
    expect(screen.getByLabelText('Sequência de vitórias: 3 dias')).toHaveTextContent('3');

    // Vence a partida e o streak atualiza imediatamente sem F5
    await user.keyboard('TERMO{Enter}');
    expect(await screen.findByLabelText('Sequência de vitórias: 4 dias')).toHaveTextContent('4');

    // Resumo de sequência aparece no modal de histórico
    await user.click(screen.getByRole('button', { name: 'Histórico de partidas' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText('Sequência atual')).toBeInTheDocument();
    expect(dialog.getByText('Maior sequência')).toBeInTheDocument();
    expect(await dialog.findByText('TERMO')).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import {
  jsonResponse,
  mockFetchRoutes,
  seedAuthenticatedSession,
} from './helpers';

describe('Fim de partida (Vitória e Derrota)', () => {
  it('exibe modal de vitória com a palavra secreta, copia resultado em emojis e bloqueia novas entradas', async () => {
    // Arrange
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    let guessCalls = 0;
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [] }),
      'POST /game/guess': () => {
        guessCalls += 1;
        return jsonResponse(
          {
            attemptNumber: 1,
            guess: 'TERMO',
            feedback: ['correct', 'correct', 'correct', 'correct', 'correct'],
            status: 'won',
            word: 'TERMO',
          },
          201
        );
      },
    });

    render(<App />);
    await screen.findByRole('grid', { name: /tabuleiro do termo/i });

    // Act — envia palpite vencedor
    await user.keyboard('TERMO{Enter}');

    // Assert — modal de vitória aparece após a animação de flip com a palavra secreta
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2500 });
    expect(
      within(dialog).getByRole('heading', { name: /você acertou!/i })
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/palavra secreta/i)).toBeInTheDocument();
    for (const letter of ['T', 'E', 'R', 'M', 'O']) {
      expect(within(dialog).getByText(letter)).toBeInTheDocument();
    }

    // Act — clica em Compartilhar para copiar resultado em emojis
    await user.click(
      within(dialog).getByRole('button', { name: /compartilhar/i })
    );

    // Assert — clipboard recebe o texto formatado em emojis
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('Joguei TERMO 1/6\n\n🟩🟩🟩🟩🟩');
    expect(
      await screen.findByText(/resultado copiado para a área de transferência!/i)
    ).toBeInTheDocument();

    // Act — fecha o modal e tenta digitar / enviar novamente
    await user.click(
      within(dialog).getByRole('button', { name: /ver tabuleiro/i })
    );
    await user.keyboard('CASAS{Enter}');

    // Assert — teclado virtual desabilitado e nenhuma nova requisição enviada
    expect(screen.getByRole('button', { name: 'Letra A' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /confirmar palpite/i })
    ).toBeDisabled();
    expect(guessCalls).toBe(1);
  });

  it('exibe modal de derrota com a palavra secreta retornada pela API, copia X/6 e bloqueia entradas', async () => {
    // Arrange
    const user = userEvent.setup();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    const previousAttempts = [1, 2, 3, 4, 5].map((attemptNumber) => ({
      attemptNumber,
      guess: 'CASAS',
      feedback: ['absent', 'absent', 'absent', 'absent', 'absent'] as const,
    }));

    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: previousAttempts }),
      'POST /game/guess': () =>
        jsonResponse(
          {
            attemptNumber: 6,
            guess: 'MUNDO',
            feedback: ['absent', 'present', 'absent', 'absent', 'correct'],
            status: 'lost',
            word: 'FLUJO',
          },
          201
        ),
    });

    render(<App />);
    await screen.findByRole('grid', { name: /tabuleiro do termo/i });

    // Act — envia 6ª e última tentativa sem acertar
    await user.keyboard('MUNDO{Enter}');

    // Assert — modal de derrota exibe a palavra secreta retornada pela API
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2500 });
    expect(
      within(dialog).getByRole('heading', { name: /fim de jogo/i })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/você usou todas as 6 tentativas de hoje/i)
    ).toBeInTheDocument();
    for (const letter of ['F', 'L', 'U', 'J', 'O']) {
      expect(within(dialog).getByText(letter)).toBeInTheDocument();
    }

    // Act — copia resultado
    await user.click(
      within(dialog).getByRole('button', { name: /compartilhar/i })
    );

    // Assert — formato X/6 com emojis corretos
    expect(writeTextMock).toHaveBeenCalledWith(
      [
        'Joguei TERMO X/6',
        '',
        '⬛⬛⬛⬛⬛',
        '⬛⬛⬛⬛⬛',
        '⬛⬛⬛⬛⬛',
        '⬛⬛⬛⬛⬛',
        '⬛⬛⬛⬛⬛',
        '⬛🟨⬛⬛🟩',
      ].join('\n')
    );

    // Fecha modal e verifica bloqueio do teclado
    await user.click(
      within(dialog).getByRole('button', { name: /ver tabuleiro/i })
    );
    expect(screen.getByRole('button', { name: 'Letra Q' })).toBeDisabled();
  });
});

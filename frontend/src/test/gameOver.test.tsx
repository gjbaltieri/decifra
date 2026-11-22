import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import {
  jsonResponse,
  mockFetchRoutes,
  seedAuthenticatedSession,
} from './helpers';

function mockCanvas2D() {
  const fillTextCalls: string[] = [];
  const fakeCtx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'center',
    textBaseline: 'middle',
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn((text: string) => {
      fillTextCalls.push(text);
    }),
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    fakeCtx as never
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => {
    cb(new Blob(['fake-png-binary'], { type: 'image/png' }));
  });

  return { fillTextCalls, fakeCtx };
}

describe('Fim de partida (Vitória, Derrota e Compartilhamento de Imagem PNG)', () => {
  it('exibe modal de vitória com a palavra secreta, copia imagem PNG do resultado para o clipboard e bloqueia novas entradas', async () => {
    // Arrange
    const user = userEvent.setup();
    const { fillTextCalls } = mockCanvas2D();

    const clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
    class FakeClipboardItem {
      public readonly items: Record<string, Blob>;
      constructor(items: Record<string, Blob>) {
        this.items = items;
      }
    }
    Object.defineProperty(globalThis, 'ClipboardItem', {
      value: FakeClipboardItem,
      configurable: true,
    });
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: clipboardWriteMock },
      configurable: true,
    });
    Object.defineProperty(navigator, 'canShare', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: undefined,
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
    await screen.findByRole('grid', { name: /tabuleiro do decifra/i });

    // Act — envia palpite vencedor
    await user.keyboard('TERMO{Enter}');

    // Assert — modal de vitória aparece com a palavra secreta
    const dialog = await screen.findByRole('dialog', {}, { timeout: 2500 });
    expect(
      within(dialog).getByRole('heading', { name: /você acertou!/i })
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/palavra secreta/i)).toBeInTheDocument();
    for (const letter of ['T', 'E', 'R', 'M', 'O']) {
      expect(within(dialog).getByText(letter)).toBeInTheDocument();
    }

    // Act — clica em Compartilhar resultado para gerar e copiar imagem PNG
    await user.click(
      within(dialog).getByRole('button', { name: /compartilhar resultado/i })
    );

    // Assert — canvas desenhou título DECIFRA, placar 1/6, assinatura do autor e não desenhou a palavra secreta
    expect(fillTextCalls).toContain('DECIFRA');
    expect(fillTextCalls.some((t) => t.includes('1/6'))).toBe(true);
    expect(fillTextCalls).toContain(
      'Desenvolvido por Gustavo Baltieri • github.com/gjbaltieri'
    );
    expect(fillTextCalls).not.toContain('TERMO');

    expect(clipboardWriteMock).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(
        /imagem do resultado copiada para a área de transferência!/i
      )
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

  it('exibe modal de derrota com a palavra secreta retornada pela API, compartilha imagem via Web Share API (X/6) e bloqueia entradas', async () => {
    // Arrange
    const user = userEvent.setup();
    const { fillTextCalls } = mockCanvas2D();

    const shareMock = vi.fn().mockResolvedValue(undefined);
    const canShareMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, 'canShare', {
      value: canShareMock,
      configurable: true,
    });
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
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
    await screen.findByRole('grid', { name: /tabuleiro do decifra/i });

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

    // Act — clica em Compartilhar resultado
    await user.click(
      within(dialog).getByRole('button', { name: /compartilhar resultado/i })
    );

    // Assert — Web Share API chamada com arquivo PNG e título DECIFRA
    expect(fillTextCalls).toContain('DECIFRA');
    expect(fillTextCalls.some((t) => t.includes('X/6'))).toBe(true);
    expect(canShareMock).toHaveBeenCalledTimes(1);
    expect(shareMock).toHaveBeenCalledTimes(1);
    const sharedArg = shareMock.mock.calls[0][0] as {
      title: string;
      files: File[];
    };
    expect(sharedArg.title).toBe('DECIFRA');
    expect(sharedArg.files[0].name).toBe('decifra-resultado.png');
    expect(sharedArg.files[0].type).toBe('image/png');
    expect(
      await screen.findByText(/resultado do decifra compartilhado!/i)
    ).toBeInTheDocument();

    // Fecha modal e verifica bloqueio do teclado
    await user.click(
      within(dialog).getByRole('button', { name: /ver tabuleiro/i })
    );
    expect(screen.getByRole('button', { name: 'Letra Q' })).toBeDisabled();
  });
});

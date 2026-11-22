import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import {
  jsonResponse,
  mockFetchRoutes,
  seedAuthenticatedSession,
} from './helpers';

describe('Carregamento da partida do dia', () => {
  it('renderiza o tabuleiro 6x5 vazio quando attempts retorna []', async () => {
    // Arrange
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({
          status: 'playing',
          attempts: [],
        }),
    });

    // Act
    render(<App />);

    // Assert
    const board = await screen.findByRole('grid', {
      name: /tabuleiro do termo/i,
    });
    const rows = within(board).getAllByRole('row');
    const cells = within(board).getAllByRole('gridcell');

    expect(rows).toHaveLength(6);
    expect(cells).toHaveLength(30);
    cells.forEach((cell) => {
      expect(cell).toHaveTextContent('');
    });
    expect(
      screen.getByText(/digite uma palavra de 5 letras e pressione enter/i)
    ).toBeInTheDocument();
  });

  it('restaura tentativas anteriores e suas cores no tabuleiro e no teclado', async () => {
    // Arrange
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({
          status: 'playing',
          attempts: [
            {
              attemptNumber: 1,
              guess: 'termo',
              feedback: ['correct', 'present', 'absent', 'absent', 'correct'],
            },
          ],
        }),
    });

    // Act
    render(<App />);

    // Assert
    const board = await screen.findByRole('grid', {
      name: /tabuleiro do termo/i,
    });
    const rows = within(board).getAllByRole('row');
    const firstRowCells = within(rows[0]).getAllByRole('gridcell');

    expect(firstRowCells[0]).toHaveTextContent('T');
    expect(firstRowCells[0]).toHaveAccessibleName('Letra T (correct)');
    expect(firstRowCells[0]).toHaveClass('bg-[#3aa394]');

    expect(firstRowCells[1]).toHaveTextContent('E');
    expect(firstRowCells[1]).toHaveAccessibleName('Letra E (present)');
    expect(firstRowCells[1]).toHaveClass('bg-[#d3ad69]');

    expect(firstRowCells[2]).toHaveTextContent('R');
    expect(firstRowCells[2]).toHaveAccessibleName('Letra R (absent)');
    expect(firstRowCells[2]).toHaveClass('bg-[#312a2c]');

    expect(firstRowCells[3]).toHaveTextContent('M');
    expect(firstRowCells[3]).toHaveAccessibleName('Letra M (absent)');

    expect(firstRowCells[4]).toHaveTextContent('O');
    expect(firstRowCells[4]).toHaveAccessibleName('Letra O (correct)');

    // Teclado virtual também reflete os estados restaurados
    expect(screen.getByRole('button', { name: 'Letra T' })).toHaveClass(
      'bg-[#3aa394]'
    );
    expect(screen.getByRole('button', { name: 'Letra E' })).toHaveClass(
      'bg-[#d3ad69]'
    );
    expect(screen.getByRole('button', { name: 'Letra R' })).toHaveClass(
      'bg-[#312a2c]/70'
    );
  });

  it('exibe o modal de fim de jogo com a palavra secreta ao carregar uma partida já encerrada', async () => {
    // Arrange
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({
          status: 'lost',
          word: 'TERMO',
          attempts: [1, 2, 3, 4, 5, 6].map((attemptNumber) => ({
            attemptNumber,
            guess: 'CASAS',
            feedback: ['absent', 'absent', 'absent', 'absent', 'absent'],
          })),
        }),
    });

    // Act
    render(<App />);

    // Assert
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: /fim de jogo/i })
    ).toBeInTheDocument();
    for (const letter of ['T', 'E', 'R', 'M', 'O']) {
      expect(within(dialog).getByText(letter)).toBeInTheDocument();
    }
  });
});

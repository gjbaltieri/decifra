import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import {
  jsonResponse,
  mockFetchRoutes,
  seedAuthenticatedSession,
} from './helpers';

describe('Jogabilidade (teclado físico e virtual)', () => {
  it('permite digitar pelo teclado físico, clicar no teclado virtual e apagar com Backspace', async () => {
    // Arrange
    const user = userEvent.setup();
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [] }),
    });

    render(<App />);
    const board = await screen.findByRole('grid', {
      name: /tabuleiro do decifra/i,
    });
    const firstRowCells = within(within(board).getAllByRole('row')[0]).getAllByRole(
      'gridcell'
    );

    // Act — digita 2 letras no teclado físico e 2 no teclado virtual
    await user.keyboard('ca');
    await user.click(screen.getByRole('button', { name: 'Letra S' }));
    await user.click(screen.getByRole('button', { name: 'Letra A' }));

    // Assert — letras preenchidas
    expect(firstRowCells[0]).toHaveTextContent('C');
    expect(firstRowCells[1]).toHaveTextContent('A');
    expect(firstRowCells[2]).toHaveTextContent('S');
    expect(firstRowCells[3]).toHaveTextContent('A');

    // Act — apaga com Backspace físico e virtual
    await user.keyboard('{Backspace}');
    await user.click(screen.getByRole('button', { name: /apagar letra/i }));

    // Assert — duas últimas letras removidas
    expect(firstRowCells[0]).toHaveTextContent('C');
    expect(firstRowCells[1]).toHaveTextContent('A');
    expect(firstRowCells[2]).toHaveTextContent('');
    expect(firstRowCells[3]).toHaveTextContent('');
  });

  it('impede o envio e exibe aviso quando o palpite tem menos de 5 letras', async () => {
    // Arrange
    const user = userEvent.setup();
    let guessCalled = false;
    seedAuthenticatedSession();
    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [] }),
      'POST /game/guess': () => {
        guessCalled = true;
        return jsonResponse({}, 201);
      },
    });

    render(<App />);
    await screen.findByRole('grid', { name: /tabuleiro do decifra/i });

    // Act
    await user.keyboard('SOL{Enter}');

    // Assert
    expect(
      await screen.findByText('Só palavras com 5 letras')
    ).toBeInTheDocument();
    expect(guessCalled).toBe(false);
  });

  it('envia POST /game/guess com { guess } e aplica correct, present e absent no tabuleiro e teclado', async () => {
    // Arrange
    const user = userEvent.setup();
    let submittedPayload: Record<string, unknown> | null = null;
    seedAuthenticatedSession();

    mockFetchRoutes({
      'GET /game/findtodaygame': () =>
        jsonResponse({ status: 'playing', attempts: [] }),
      'POST /game/guess': (init) => {
        submittedPayload = JSON.parse(String(init?.body));
        return jsonResponse(
          {
            attemptNumber: 1,
            guess: 'CARRO',
            feedback: ['correct', 'present', 'absent', 'absent', 'present'],
            status: 'playing',
          },
          201
        );
      },
    });

    render(<App />);
    const board = await screen.findByRole('grid', {
      name: /tabuleiro do decifra/i,
    });

    // Act
    await user.keyboard('carro');
    await user.click(screen.getByRole('button', { name: /confirmar palpite/i }));

    // Assert
    expect(
      await within(board).findByRole('gridcell', { name: 'Letra C (correct)' })
    ).toBeInTheDocument();

    expect(submittedPayload).toEqual({ guess: 'CARRO' });

    const firstRowCells = within(within(board).getAllByRole('row')[0]).getAllByRole(
      'gridcell'
    );
    expect(firstRowCells[0]).toHaveClass('bg-[#3aa394]');
    expect(firstRowCells[1]).toHaveClass('bg-[#d3ad69]');
    expect(firstRowCells[2]).toHaveClass('bg-[#312a2c]');
    expect(firstRowCells[3]).toHaveClass('bg-[#312a2c]');
    expect(firstRowCells[4]).toHaveClass('bg-[#d3ad69]');

    expect(screen.getByRole('button', { name: 'Letra C' })).toHaveClass(
      'bg-[#3aa394]'
    );
    expect(screen.getByRole('button', { name: 'Letra A' })).toHaveClass(
      'bg-[#d3ad69]'
    );
    expect(screen.getByRole('button', { name: 'Letra R' })).toHaveClass(
      'bg-[#312a2c]/70'
    );
    expect(screen.getByRole('button', { name: 'Letra O' })).toHaveClass(
      'bg-[#d3ad69]'
    );
  });
});

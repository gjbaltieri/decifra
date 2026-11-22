import { MAX_ATTEMPTS, WORD_LENGTH } from '../hooks/useTermoGame';
import type { AttemptItem, GameStatus, LetterStatus } from '../types/api';

interface BoardProps {
  attempts: AttemptItem[];
  currentLetters: string[];
  selectedCol: number;
  activeRowIndex: number;
  gameStatus: GameStatus;
  shakingRowIndex: number | null;
  revealingRowIndex: number | null;
  onSelectTile: (colIndex: number) => void;
}

function getEvaluatedTileStyle(status: LetterStatus): string {
  switch (status) {
    case 'correct':
      return 'bg-[#3aa394] border-[#3aa394] text-white';
    case 'present':
      return 'bg-[#d3ad69] border-[#d3ad69] text-white';
    case 'absent':
    default:
      return 'bg-[#312a2c] border-[#312a2c] text-zinc-200';
  }
}

export function Board({
  attempts,
  currentLetters,
  selectedCol,
  activeRowIndex,
  gameStatus,
  shakingRowIndex,
  revealingRowIndex,
  onSelectTile,
}: BoardProps) {
  const rows = Array.from({ length: MAX_ATTEMPTS }, (_, rowIndex) => rowIndex);
  const cols = Array.from({ length: WORD_LENGTH }, (_, colIndex) => colIndex);

  return (
    <div
      className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 my-auto py-2 select-none"
      role="grid"
      aria-label="Tabuleiro do Termo"
    >
      {rows.map((rowIndex) => {
        const submittedAttempt = attempts[rowIndex];
        const isCurrentRow =
          rowIndex === activeRowIndex && gameStatus === 'playing';
        const isShaking = shakingRowIndex === rowIndex;
        const isRevealing = revealingRowIndex === rowIndex;

        return (
          <div
            key={rowIndex}
            role="row"
            className={`grid grid-cols-5 gap-1.5 sm:gap-2 ${
              isShaking ? 'animate-row-shake' : ''
            }`}
          >
            {cols.map((colIndex) => {
              // 1. Linha já submetida
              if (submittedAttempt) {
                const letter = submittedAttempt.guess[colIndex] || '';
                const letterStatus =
                  submittedAttempt.feedback[colIndex] || 'absent';
                const statusClasses = getEvaluatedTileStyle(letterStatus);

                return (
                  <div
                    key={colIndex}
                    role="gridcell"
                    aria-label={`Letra ${letter} (${letterStatus})`}
                    style={
                      isRevealing
                        ? { animationDelay: `${colIndex * 120}ms` }
                        : undefined
                    }
                    className={`flex h-[52px] w-[52px] sm:h-[58px] sm:w-[58px] md:h-16 md:w-16 items-center justify-center rounded-lg border-2 text-2xl sm:text-3xl font-extrabold uppercase transition-colors ${statusClasses} ${
                      isRevealing ? 'animate-tile-flip' : ''
                    }`}
                  >
                    {letter}
                  </div>
                );
              }

              // 2. Linha ativa (digitando)
              if (isCurrentRow) {
                const letter = currentLetters[colIndex] || '';
                const isSelected = selectedCol === colIndex;

                return (
                  <button
                    key={colIndex}
                    type="button"
                    role="gridcell"
                    onClick={() => onSelectTile(colIndex)}
                    aria-label={`Posição ${colIndex + 1}${letter ? `, letra ${letter}` : ''}`}
                    className={`flex h-[52px] w-[52px] sm:h-[58px] sm:w-[58px] md:h-16 md:w-16 items-center justify-center rounded-lg border-2 bg-[#18181b] text-2xl sm:text-3xl font-extrabold uppercase text-white outline-none transition-all ${
                      letter ? 'animate-tile-pop border-zinc-500' : 'border-[#3a3a3c]'
                    } ${
                      isSelected
                        ? 'border-b-4 border-b-[#3aa394] ring-1 ring-[#3aa394]/40'
                        : ''
                    }`}
                  >
                    {letter}
                  </button>
                );
              }

              // 3. Linha futura ou inativa
              return (
                <div
                  key={colIndex}
                  role="gridcell"
                  className="flex h-[52px] w-[52px] sm:h-[58px] sm:w-[58px] md:h-16 md:w-16 items-center justify-center rounded-lg border-2 border-zinc-800/80 bg-[#18181b]/50 text-2xl sm:text-3xl font-extrabold uppercase text-zinc-600"
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

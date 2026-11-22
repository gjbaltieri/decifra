import type { LetterStatus } from '../types/api';

interface KeyboardProps {
  keyboardStatuses: Record<string, LetterStatus>;
  disabled: boolean;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}

const KEYBOARD_ROWS: string[][] = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

function getKeyColorClass(status?: LetterStatus): string {
  switch (status) {
    case 'correct':
      return 'bg-[#3aa394] text-white border-[#3aa394] hover:brightness-110';
    case 'present':
      return 'bg-[#d3ad69] text-white border-[#d3ad69] hover:brightness-110';
    case 'absent':
      return 'bg-[#312a2c]/70 text-zinc-500 border-[#312a2c]';
    default:
      return 'bg-[#4c4347] text-zinc-100 border-transparent hover:bg-[#5c5256]';
  }
}

export function Keyboard({
  keyboardStatuses,
  disabled,
  onLetter,
  onBackspace,
  onEnter,
}: KeyboardProps) {
  const handleKeyClick = (key: string) => {
    if (disabled) return;
    if (key === 'ENTER') {
      onEnter();
    } else if (key === 'BACKSPACE') {
      onBackspace();
    } else {
      onLetter(key);
    }
  };

  return (
    <div
      className="w-full max-w-lg mx-auto px-1.5 sm:px-3 pb-3 pt-1 select-none"
      aria-label="Teclado virtual"
    >
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex w-full justify-center gap-1 sm:gap-1.5"
          >
            {row.map((key) => {
              const isActionKey = key === 'ENTER' || key === 'BACKSPACE';
              const status = !isActionKey ? keyboardStatuses[key] : undefined;
              const colorClass = isActionKey
                ? 'bg-[#4c4347] text-zinc-100 hover:bg-[#5c5256]'
                : getKeyColorClass(status);

              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleKeyClick(key)}
                  aria-label={
                    key === 'BACKSPACE'
                      ? 'Apagar letra'
                      : key === 'ENTER'
                        ? 'Confirmar palpite'
                        : `Letra ${key}`
                  }
                  className={`flex h-12 sm:h-14 items-center justify-center rounded-lg border font-bold uppercase transition active:scale-95 disabled:opacity-60 ${
                    isActionKey
                      ? 'px-2.5 sm:px-4 text-xs sm:text-sm flex-[1.5]'
                      : 'flex-1 text-sm sm:text-base max-w-[44px]'
                  } ${colorClass}`}
                >
                  {key === 'BACKSPACE' ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                      <line x1="18" y1="9" x2="12" y2="15" />
                      <line x1="12" y1="9" x2="18" y2="15" />
                    </svg>
                  ) : (
                    key
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

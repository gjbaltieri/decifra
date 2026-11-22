import type { AttemptItem, GameStatus } from '../types/api';

interface GameOverModalProps {
  isOpen: boolean;
  status: GameStatus;
  attempts: AttemptItem[];
  secretWord: string | null;
  onClose: () => void;
  onCopyShare: () => void;
}

export function GameOverModal({
  isOpen,
  status,
  attempts,
  secretWord,
  onClose,
  onCopyShare,
}: GameOverModalProps) {
  if (!isOpen || status === 'playing') return null;

  const isWin = status === 'won';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div
        className="animate-modal-in w-full max-w-md rounded-2xl border border-zinc-800 bg-[#18181b] p-6 text-center text-zinc-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700/80 bg-[#121213] text-2xl">
          {isWin ? '🏆' : '💭'}
        </div>

        <h2
          id="gameover-title"
          className="text-2xl font-extrabold uppercase tracking-wider text-white"
        >
          {isWin ? 'Você Acertou!' : 'Fim de Jogo'}
        </h2>

        <p className="mt-1 text-sm text-zinc-400">
          {isWin
            ? `Desvendou a palavra em ${attempts.length} ${
                attempts.length === 1 ? 'tentativa' : 'tentativas'
              }!`
            : 'Você usou todas as 6 tentativas de hoje.'}
        </p>

        {/* Exibição da palavra secreta retornada pela API */}
        <div className="my-5 rounded-xl border border-zinc-800 bg-[#121213] p-4">
          <span className="block text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            Palavra Secreta
          </span>
          {secretWord ? (
            <div className="mt-2.5 flex justify-center gap-1.5">
              {secretWord.split('').map((letter, idx) => (
                <span
                  key={idx}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg font-extrabold uppercase text-white ${
                    isWin
                      ? 'border-[#3aa394] bg-[#3aa394]'
                      : 'border-[#d3ad69] bg-[#d3ad69]'
                  }`}
                >
                  {letter}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-zinc-300">
              Partida concluída hoje
            </p>
          )}
        </div>

        {/* Mini prévia em blocos da partida */}
        <div className="mb-6 flex flex-col items-center gap-1">
          {attempts.map((attempt) => (
            <div key={attempt.attemptNumber} className="flex gap-1">
              {attempt.feedback.map((st, idx) => {
                const bg =
                  st === 'correct'
                    ? 'bg-[#3aa394]'
                    : st === 'present'
                      ? 'bg-[#d3ad69]'
                      : 'bg-[#312a2c]';
                return (
                  <span
                    key={idx}
                    className={`h-4 w-4 rounded-sm ${bg}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onCopyShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3aa394] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-[#3aa394]/25 transition hover:bg-[#329082] active:scale-[0.99]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Compartilhar resultado</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-[#121213] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Ver Tabuleiro
          </button>
        </div>
      </div>
    </div>
  );
}

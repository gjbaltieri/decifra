import type { AuthUser, GameStatus } from '../types/api';

interface HeaderProps {
  user: AuthUser | null;
  gameStatus: GameStatus;
  onOpenHowToPlay: () => void;
  onOpenGameOver: () => void;
  onLogout: () => void;
}

export function Header({
  user,
  gameStatus,
  onOpenHowToPlay,
  onOpenGameOver,
  onLogout,
}: HeaderProps) {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-[#121213]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-3 sm:px-4">
        {/* Botões à esquerda */}
        <div className="flex items-center gap-1.5 min-w-[96px]">
          <button
            type="button"
            onClick={onOpenHowToPlay}
            title="Como jogar"
            aria-label="Como jogar"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700/80 bg-[#18181b] text-zinc-300 transition hover:border-zinc-500 hover:text-white active:scale-95"
          >
            <span className="text-base font-bold">?</span>
          </button>

          {gameStatus !== 'playing' && (
            <button
              type="button"
              onClick={onOpenGameOver}
              title="Ver resultado da partida"
              aria-label="Ver resultado da partida"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#3aa394]/50 bg-[#3aa394]/15 px-2.5 text-xs font-semibold text-[#3aa394] transition hover:bg-[#3aa394]/25 active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
              <span className="hidden sm:inline">Resultado</span>
            </button>
          )}
        </div>

        {/* Título central */}
        <h1 className="select-none text-2xl sm:text-3xl font-extrabold tracking-[0.22em] text-zinc-100">
          DECIFRA
        </h1>

        {/* Usuário e Logout à direita */}
        <div className="flex items-center justify-end gap-2 min-w-[96px]">
          {user && (
            <>
              <span
                className="hidden sm:inline-block max-w-[100px] truncate text-xs font-medium text-zinc-400"
                title={user.username}
              >
                @{user.username}
              </span>
              <button
                type="button"
                onClick={onLogout}
                title="Sair da conta"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-[#18181b] px-2.5 text-xs font-semibold text-zinc-300 transition hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-200 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Sair</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

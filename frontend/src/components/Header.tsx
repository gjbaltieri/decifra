import type { AuthUser, GameStatus } from '../types/api';

interface HeaderProps {
  user: AuthUser | null;
  gameStatus: GameStatus;
  currentStreak?: number;
  onOpenHowToPlay: () => void;
  onOpenGameOver: () => void;
  onOpenHistory: () => void;
  onOpenReleaseNotes: () => void;
  hasNewVersion: boolean;
  onOpenAuth?: () => void;
  onLogout: () => void;
}

export function Header({
  user,
  gameStatus,
  currentStreak = 0,
  onOpenHowToPlay,
  onOpenGameOver,
  onOpenHistory,
  onOpenReleaseNotes,
  hasNewVersion,
  onOpenAuth,
  onLogout,
}: HeaderProps) {
  const streakLabel = `Sequência de vitórias: ${currentStreak} ${
    currentStreak === 1 ? 'dia' : 'dias'
  }`;
  const hasActiveStreak = currentStreak >= 1;

  return (
    <header className="w-full border-b border-zinc-800/80 bg-[#121213]/90 backdrop-blur-sm">
      {/* Linha principal: ações à esquerda, logo DECIFRA centralizado, ações à direita */}
      <div className="mx-auto grid h-14 max-w-lg grid-cols-[1fr_auto_1fr] items-center gap-2 px-2.5 sm:px-4">
        {/* Botões à esquerda */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenHowToPlay}
            title="Como jogar"
            aria-label="Como jogar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700/80 bg-[#18181b] text-zinc-300 transition hover:border-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] active:scale-95"
          >
            <span className="text-base font-bold">?</span>
          </button>

          {gameStatus !== 'playing' && (
            <button
              type="button"
              onClick={onOpenGameOver}
              title="Ver resultado da partida"
              aria-label="Ver resultado da partida"
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#3aa394]/50 bg-[#3aa394]/15 px-2.5 text-xs font-semibold text-[#3aa394] transition hover:bg-[#3aa394]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0"
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
        <h1 className="select-none text-xl font-extrabold tracking-[0.18em] text-zinc-100 sm:text-3xl sm:tracking-[0.22em]">
          {user ? (
            <button
              type="button"
              onClick={onOpenReleaseNotes}
              aria-haspopup="dialog"
              aria-label={`DECIFRA — notas de atualização${hasNewVersion ? ', novidades disponíveis' : ''}`}
              className="relative rounded tracking-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394]"
            >
              DECIFRA
              {hasNewVersion && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-[#5fd3c2] motion-safe:animate-pulse"
                />
              )}
            </button>
          ) : (
            'DECIFRA'
          )}
        </h1>

        {/* Ações à direita: Histórico + Sair (ou Entrar) */}
        <div className="flex items-center justify-end gap-1.5">
          {user ? (
            <>
              <button
                type="button"
                onClick={onOpenHistory}
                aria-label="Histórico de partidas"
                title="Histórico de partidas"
                aria-haspopup="dialog"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700/80 bg-[#18181b] text-zinc-300 transition hover:border-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] active:scale-95"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Sair da conta"
                aria-label="Sair da conta"
                className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-[#18181b] px-2.5 text-xs font-semibold text-zinc-300 transition hover:border-red-500/50 hover:bg-red-950/30 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 shrink-0"
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
                <span className="hidden sm:inline">Sair</span>
              </button>
            </>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#3aa394]/60 bg-[#3aa394]/15 px-3.5 text-xs font-bold uppercase tracking-wider text-[#5fd3c2] transition hover:bg-[#3aa394]/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] active:scale-95"
              >
                Entrar
              </button>
            )
          )}
        </div>
      </div>

      {/* Sub-barra discreta do jogador autenticado: @username legível sem corte + sequência de vitórias */}
      {user && (
        <div className="border-t border-zinc-800/60 bg-[#151517]/80">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-3 py-1.5 sm:px-4">
            <span
              className="min-w-0 truncate text-xs font-medium text-zinc-300"
              title={`@${user.username}`}
            >
              @{user.username}
            </span>

            <span
              role="status"
              aria-label={streakLabel}
              title={streakLabel}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold tabular-nums transition ${
                hasActiveStreak
                  ? 'border-[#d3ad69]/45 bg-[#d3ad69]/15 text-[#e8c784]'
                  : 'border-zinc-800 bg-[#18181b] text-zinc-500'
              }`}
            >
              <svg
                aria-hidden="true"
                className={`h-3.5 w-3.5 shrink-0 ${
                  hasActiveStreak ? 'text-[#d3ad69]' : 'text-zinc-600'
                }`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M13.5 2.2c.4 2.4-.7 4.4-2.1 5.9-.9 1-1.7 1.8-1.9 3.1-.1.6.1 1.2.4 1.6.3-.9 1-1.6 1.8-2.1-.1 1.5.7 2.8 1.9 3.6 1.2.8 1.9 1.9 1.9 3.3 0 2.3-1.8 4.2-4.5 4.2-3.3 0-6-2.6-6-6.2 0-3.2 1.8-5.7 3.8-8 1.5-1.7 3.2-3.5 4.7-5.4Z" />
              </svg>
              <span>{currentStreak}</span>
            </span>
          </div>
        </div>
      )}
    </header>
  );
}

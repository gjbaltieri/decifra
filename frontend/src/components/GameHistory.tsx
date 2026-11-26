import { useEffect, useState } from 'react';
import { api, ApiError } from '../services/api';
import type { HistoryGame } from '../types/api';

const PAGE_SIZE = 10;
const badges = {
  won: { label: 'Vitória', color: 'bg-[#3aa394]/15 text-[#5fd3c2]' },
  lost: { label: 'Derrota', color: 'bg-red-950/50 text-red-300' },
  playing: { label: 'Em andamento', color: 'bg-[#d3ad69]/15 text-[#d3ad69]' },
};

interface GameHistoryProps {
  currentStreak?: number;
  bestStreak?: number;
  onUnauthorized: (message: string) => void;
}

export function GameHistory({
  currentStreak: initialCurrentStreak = 0,
  bestStreak: initialBestStreak = 0,
  onUnauthorized,
}: GameHistoryProps) {
  const [{ games, nextOffset, hasMore, currentStreak, bestStreak }, setHistory] = useState({
    games: [] as HistoryGame[],
    nextOffset: 0,
    hasMore: false,
    currentStreak: initialCurrentStreak,
    bestStreak: initialBestStreak,
  });
  const [request, setRequest] = useState({ offset: 0 });
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    async function loadPage() {
      try {
        const page = await api.getGameHistory(PAGE_SIZE, request.offset, controller.signal);
        if (controller.signal.aborted) return;
        setHistory((previous) => {
          const byId = new Map(previous.games.map((game) => [game.id, game]));
          page.games.forEach((game) => byId.set(game.id, game));
          return {
            games: Array.from(byId.values()),
            nextOffset: request.offset + page.games.length,
            hasMore: page.hasMore,
            currentStreak:
              typeof page.currentStreak === 'number'
                ? page.currentStreak
                : previous.currentStreak,
            bestStreak:
              typeof page.bestStreak === 'number'
                ? page.bestStreak
                : previous.bestStreak,
          };
        });
        setState('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) {
          onUnauthorized('Sua sessão expirou. Faça login novamente.');
          return;
        }
        setState('error');
      }
    }
    void loadPage();
    return () => controller.abort();
  }, [request, onUnauthorized]);

  function loadNextPage() {
    setState('loading');
    setRequest({ offset: nextOffset });
  }

  return (
    <div className="space-y-3">
      {/* Resumo compacto de sequência */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-zinc-800 bg-[#121213] px-3 py-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <svg
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 ${
                currentStreak >= 1 ? 'text-[#d3ad69]' : 'text-zinc-600'
              }`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M13.5 2.2c.4 2.4-.7 4.4-2.1 5.9-.9 1-1.7 1.8-1.9 3.1-.1.6.1 1.2.4 1.6.3-.9 1-1.6 1.8-2.1-.1 1.5.7 2.8 1.9 3.6 1.2.8 1.9 1.9 1.9 3.3 0 2.3-1.8 4.2-4.5 4.2-3.3 0-6-2.6-6-6.2 0-3.2 1.8-5.7 3.8-8 1.5-1.7 3.2-3.5 4.7-5.4Z" />
            </svg>
            <span className="text-lg font-extrabold tabular-nums text-zinc-100">
              {currentStreak}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-zinc-400">
            Sequência atual
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#121213] px-3 py-2.5 text-center">
          <span className="text-lg font-extrabold tabular-nums text-[#5fd3c2]">
            {bestStreak}
          </span>
          <p className="mt-0.5 text-[11px] font-medium text-zinc-400">
            Maior sequência
          </p>
        </div>
      </div>

      {games.length > 0 && (
        <ul className="space-y-2">
          {games.map((game) => {
            const badge = badges[game.status];
            const date = game.date.split('-').reverse().join('/');
            return (
              <li key={game.id} className="rounded-xl border border-zinc-800 bg-[#121213] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <time dateTime={game.date} className="text-xs text-zinc-400">{date}</time>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge.color}`}>{badge.label}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <strong className="tracking-widest">{game.status === 'playing' || game.word === null ? '?????' : game.word.toUpperCase()}</strong>
                  <span className="text-xs text-zinc-400">{game.total_attempts}/6 tentativas</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {state === 'loading' && (
        <div role="status" className="space-y-2">
          <span className="sr-only">Carregando histórico…</span>
          {[0, 1, 2].map((row) => <div key={row} aria-hidden="true" className="h-20 rounded-xl bg-zinc-800 motion-safe:animate-pulse" />)}
        </div>
      )}
      {state === 'ready' && games.length === 0 && (
        <p className="text-sm text-zinc-400">Você ainda não tem partidas no histórico.</p>
      )}
      {state === 'error' && <p role="alert" className="text-sm text-red-200">Não foi possível carregar o histórico. Tente novamente.</p>}
      {state !== 'loading' && (state === 'error' || hasMore) && (
        <button type="button" onClick={loadNextPage}
          className="w-full rounded-xl border border-zinc-700 py-2.5 text-sm font-semibold hover:border-[#3aa394] focus-visible:ring-2 focus-visible:ring-[#3aa394]">
          {state === 'error' ? 'Tentar novamente' : 'Carregar mais'}
        </button>
      )}
    </div>
  );
}

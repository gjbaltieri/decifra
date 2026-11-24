interface LandingViewProps {
  onPlay: () => void;
  onRegister: () => void;
}

const EXAMPLE_TILES: Array<{
  letter: string;
  tone: 'correct' | 'present' | 'absent' | 'neutral';
  description: string;
}> = [
  { letter: 'L', tone: 'correct', description: 'posição certa' },
  { letter: 'I', tone: 'neutral', description: 'letra de exemplo' },
  { letter: 'V', tone: 'present', description: 'outra posição' },
  { letter: 'R', tone: 'absent', description: 'não existe na palavra' },
  { letter: 'O', tone: 'neutral', description: 'letra de exemplo' },
];

function getTileClasses(tone: 'correct' | 'present' | 'absent' | 'neutral') {
  switch (tone) {
    case 'correct':
      return 'border-[#3aa394] bg-[#3aa394] text-white shadow-[#3aa394]/20';
    case 'present':
      return 'border-[#d3ad69] bg-[#d3ad69] text-white shadow-[#d3ad69]/20';
    case 'absent':
      return 'border-[#3f383a] bg-[#312a2c] text-zinc-200 shadow-black/20';
    case 'neutral':
    default:
      return 'border-zinc-700/90 bg-[#121213] text-zinc-300';
  }
}

export function LandingView({ onPlay, onRegister }: LandingViewProps) {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-6 sm:py-10">
      {/* Brilho ambiente sutil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-64 max-w-lg -translate-y-1/2 rounded-full bg-[#3aa394]/[0.06] blur-3xl"
      />

      <section
        aria-label="Boas-vindas ao Decifra"
        className="animate-modal-in relative z-10 mx-auto flex w-full max-w-md flex-col items-center text-center"
      >
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#3aa394]/30 bg-[#3aa394]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5fd3c2]">
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#3aa394]"
            aria-hidden="true"
          />
          Palavra nova todos os dias
        </span>

        <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Descubra a palavra do dia
        </h2>

        <p className="mb-6 max-w-sm text-sm leading-relaxed text-zinc-300 sm:text-base">
          Você tem{' '}
          <strong className="font-semibold text-white">6 tentativas</strong>{' '}
          para acertar uma palavra secreta de{' '}
          <strong className="font-semibold text-white">5 letras</strong>.
        </p>

        {/* Preview visual de 5 letras + legenda das 3 cores */}
        <div className="mb-7 w-full rounded-2xl border border-zinc-800/90 bg-[#18181b]/80 p-5 shadow-xl shadow-black/30 backdrop-blur-sm">
          <div
            className="mb-4 flex justify-center gap-2"
            aria-label="Exemplo de tentativa com a palavra LIVRO"
          >
            {EXAMPLE_TILES.map((tile, idx) => (
              <span
                key={`${tile.letter}-${idx}`}
                title={`${tile.letter}: ${tile.description}`}
                style={{ animationDelay: `${idx * 70}ms` }}
                className={`animate-tile-flip flex h-11 w-11 select-none items-center justify-center rounded-lg border-2 text-lg font-extrabold shadow-sm sm:h-12 sm:w-12 sm:text-xl ${getTileClasses(
                  tile.tone
                )}`}
              >
                {tile.letter}
              </span>
            ))}
          </div>

          <ul className="grid grid-cols-1 gap-2 border-t border-zinc-800/80 pt-3.5 text-left text-xs text-zinc-300 sm:grid-cols-3 sm:text-center">
            <li className="flex items-center justify-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#3aa394] text-[10px] font-extrabold text-white"
              >
                L
              </span>
              <span>Posição certa</span>
            </li>
            <li className="flex items-center justify-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[#d3ad69] text-[10px] font-extrabold text-white"
              >
                V
              </span>
              <span>Outra posição</span>
            </li>
            <li className="flex items-center justify-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-600 bg-[#312a2c] text-[10px] font-extrabold text-zinc-200"
              >
                R
              </span>
              <span>Não existe</span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={onPlay}
          className="flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-xl bg-[#3aa394] px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-[#3aa394]/25 transition hover:bg-[#329082] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394] focus-visible:ring-offset-2 focus-visible:ring-offset-[#121213] active:scale-[0.99]"
        >
          Jogar
        </button>

        <p className="mt-4 text-xs text-zinc-400">
          Primeira vez aqui?{' '}
          <button
            type="button"
            onClick={onRegister}
            className="rounded font-semibold text-[#5fd3c2] underline-offset-4 transition hover:text-[#3aa394] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3aa394]"
          >
            Criar conta grátis
          </button>
        </p>
      </section>
    </main>
  );
}


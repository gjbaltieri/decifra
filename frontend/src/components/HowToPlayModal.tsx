interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
    >
      <div
        className="animate-modal-in w-full max-w-md rounded-2xl border border-zinc-800 bg-[#18181b] p-6 text-zinc-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="how-to-play-title"
            className="text-lg font-extrabold uppercase tracking-wider text-white"
          >
            Como Jogar
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
          <p>
            Descubra a palavra secreta do dia em até <strong>6 tentativas</strong>.
            Cada palpite deve ser uma palavra de <strong>5 letras</strong>.
          </p>
          <p>
            Após cada tentativa, a cor das peças mostrará o quão perto você
            está da solução:
          </p>
        </div>

        <div className="my-5 space-y-4 border-y border-zinc-800 py-4">
          {/* Exemplo Correct */}
          <div>
            <div className="mb-1.5 flex gap-1.5">
              {['T', 'E', 'R', 'M', 'O'].map((letter, idx) => (
                <span
                  key={idx}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-base font-extrabold text-white ${
                    idx === 0
                      ? 'border-[#3aa394] bg-[#3aa394]'
                      : 'border-zinc-700 bg-[#121213]'
                  }`}
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-300">
              A letra <strong className="text-[#3aa394]">T</strong> faz parte da
              palavra e está na <strong>posição correta</strong>.
            </p>
          </div>

          {/* Exemplo Present */}
          <div>
            <div className="mb-1.5 flex gap-1.5">
              {['V', 'I', 'O', 'L', 'A'].map((letter, idx) => (
                <span
                  key={idx}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-base font-extrabold text-white ${
                    idx === 2
                      ? 'border-[#d3ad69] bg-[#d3ad69]'
                      : 'border-zinc-700 bg-[#121213]'
                  }`}
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-300">
              A letra <strong className="text-[#d3ad69]">O</strong> faz parte da
              palavra, mas em <strong>outra posição</strong>.
            </p>
          </div>

          {/* Exemplo Absent */}
          <div>
            <div className="mb-1.5 flex gap-1.5">
              {['P', 'U', 'L', 'G', 'A'].map((letter, idx) => (
                <span
                  key={idx}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border text-base font-extrabold text-white ${
                    idx === 3
                      ? 'border-[#312a2c] bg-[#312a2c] text-zinc-400'
                      : 'border-zinc-700 bg-[#121213]'
                  }`}
                >
                  {letter}
                </span>
              ))}
            </div>
            <p className="text-xs text-zinc-300">
              A letra <strong className="text-zinc-400">G</strong>{' '}
              <strong>não faz parte</strong> da palavra.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-[#3aa394] py-2.5 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-[#329082] active:scale-[0.99]"
        >
          Entendi, vamos jogar!
        </button>
      </div>
    </div>
  );
}

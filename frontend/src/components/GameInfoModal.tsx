import { useEffect, useId, useRef, type ReactNode } from 'react';

interface GameInfoModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function GameInfoModal({ title, onClose, children }: GameInfoModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-[#18181b] p-0 text-zinc-100 shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fechar modal"
            className="h-9 w-9 shrink-0 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white focus-visible:ring-2 focus-visible:ring-[#3aa394]">
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/60 bg-[#121213] py-2 px-3 text-center text-[11px] text-zinc-400">
      <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <span>Desenvolvido por Gustavo Baltieri</span>
        <span className="text-zinc-600" aria-hidden="true">
          •
        </span>
        <a
          href="https://github.com/gjbaltieri"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-300 underline-offset-2 transition hover:text-[#3aa394] hover:underline"
        >
          GitHub
        </a>
        <span className="text-zinc-600" aria-hidden="true">
          •
        </span>
        <a
          href="https://www.linkedin.com/in/gustavo-baltieri"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-zinc-300 underline-offset-2 transition hover:text-[#3aa394] hover:underline"
        >
          LinkedIn
        </a>
      </div>
    </footer>
  );
}

import type { AttemptItem, GameStatus, LetterStatus } from '../types/api';

const tiles: Record<LetterStatus, string> = { correct: '🟩', present: '🟨', absent: '⬛' };
const gameDateFormat = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
});

export function formatShareDate(date: Date): string {
  return gameDateFormat.format(date);
}

export function formatShareResult(
  status: Exclude<GameStatus, 'playing'>,
  attempts: ReadonlyArray<Pick<AttemptItem, 'feedback'>>,
  date: Date,
  origin: string
): string {
  const score = `${attempts.length}/6`;
  const result = status === 'won' ? `Acertei em ${score} tentativas!` : `Não foi dessa vez (${score})`;
  const grid = attempts.map(({ feedback }) => feedback.map((letter) => tiles[letter]).join('')).join('\n');
  return `🧩 DECIFRA • ${formatShareDate(date)}\n${result}\n\n${grid}\n\n${origin}`;
}

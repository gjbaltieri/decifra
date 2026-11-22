export function normalizeGuess(raw: unknown): string | null {
    if (typeof raw !== "string") return null;
    const guess = raw.trim().toUpperCase();
    return /^[A-Z]{5}$/.test(guess) ? guess : null;
}// para verificar se o palpite é valido

export function resolveStatus(guess: string, secret: string, attemptNumber: number) {
    if (guess === secret.toUpperCase()) return "won";
    if (attemptNumber === 6) return "lost";
    return "playing"
}//para verificar o status do jogo

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGuess = normalizeGuess;
exports.resolveStatus = resolveStatus;
function normalizeGuess(raw) {
    if (typeof raw !== "string")
        return null;
    const guess = raw.trim().toUpperCase();
    return /^[A-Z]{5}$/.test(guess) ? guess : null;
} // para verificar se o palpite é valido
function resolveStatus(guess, secret, attemptNumber) {
    if (guess === secret.toUpperCase())
        return "won";
    if (attemptNumber === 6)
        return "lost";
    return "playing";
} //para verificar o status do jogo

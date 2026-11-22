"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkGuess = checkGuess;
function checkGuess(secret, guess) {
    const letters = secret.toUpperCase().split("");
    const guesses = guess.toUpperCase().split("");
    const result = guesses.map((letter, i) => {
        if (letter === letters[i]) {
            letters[i] = "";
            return "correct";
        }
        return "absent";
    });
    guesses.forEach((letter, i) => {
        if (result[i] === "correct")
            return;
        const index = letters.indexOf(letter);
        if (index !== -1) {
            result[i] = "present";
            letters[index] = "";
        }
    });
    return result;
}

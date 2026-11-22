export type LetterStatus = "correct" | "present" | "absent";

export function checkGuess(secret: string, guess: string): LetterStatus[] {
    const letters = secret.toUpperCase().split("");
    const guesses = guess.toUpperCase().split("");

    const result: LetterStatus[] = guesses.map((letter, i) => {
        if (letter === letters[i]) {
            letters[i] = "";
            return "correct";
        }
        return "absent";
    });

    guesses.forEach((letter, i) => {
        if (result[i] === "correct") return;

        const index = letters.indexOf(letter);

        if (index !== -1) {
            result[i] = "present";
            letters[index] = "";
        }
    });

    return result;
}
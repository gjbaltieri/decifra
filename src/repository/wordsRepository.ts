import { db } from '../database/connection'

export async function findTodayWord() {
    const word = await db.query(
        `SELECT id, word FROM words WHERE date = CURRENT_DATE;`
    )
    return word
}

export async function findTodayGame(userId: string) {
    const game = await db.query(
        `SELECT
        games.id,
        games.status,
        games.word_id,
        games.created_at
        FROM games
        JOIN words ON words.id = games.word_id
        WHERE games.user_id = $1
        AND words.date = CURRENT_DATE
        LIMIT 1;`,
        [userId]
    )
    return game.rows[0] ?? null
}

export async function findAttemptsByGameId(attemptID: string) {
    const game = await db.query(
        `SELECT
        attempts.game_id,
        LIMIT 1;`,
        [attemptID]
    )
    return game.rows[0] ?? null
}

export async function createAttempt(
    gameId: number,
    guess: string,
    attemptNumber: number
) {
    const { rows } = await db.query(
        `INSERT INTO attempts (game_id, guess, attempt_number)
     VALUES ($1, $2, $3)
     RETURNING id, guess, attempt_number, created_at`,
        [gameId, guess.toUpperCase(), attemptNumber]
    );

    return rows[0];
}

export async function updateGameStatus(gameId: number, status: "won" | "lost") {
    await db.query(
        `UPDATE games SET status = $1 WHERE id = $2`,
        [status, gameId]
    );
}
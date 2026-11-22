import { db } from '../database/connection'

export async function findTodayWord() {
    const word = await db.query(
        `SELECT id, word FROM words WHERE date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date;; `
    )
    return word.rows[0]
}

export async function findTodayGame(userId: string) {
    const game = await db.query(
        `SELECT
        games.id,
        games.status,
        games.word_id,
        words.word,
        games.created_at
        FROM games
        JOIN words ON words.id = games.word_id
        WHERE games.user_id = $1
        AND words.date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
        LIMIT 1;`,
        [userId]
    )
    return game.rows[0] ?? null
}

export async function findAttemptsByGameId(attemptID: string) {
    const game = await db.query(
        `SELECT id, game_id, guess, attempt_number, created_at
         FROM attempts
         WHERE game_id = $1
         ORDER BY attempt_number ASC`,
        [attemptID]
    )
    return game.rows
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

export async function createGame(userId: string, wordId: number) {
    const { rows } = await db.query(
        `INSERT INTO games (user_id, word_id)
     VALUES ($1, $2)
     RETURNING id, user_id, word_id, status`,
        [userId, wordId]
    );
    return rows[0];
}
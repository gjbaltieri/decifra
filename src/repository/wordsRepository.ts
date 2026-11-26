import { db } from '../database/connection'
import { calculateWinStreak, StreakGameStatus, StreakSummary } from '../services/streak'

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

export async function findUserHistory(userId: string, limit = 10, offset = 0) {
    const { rows } = await db.query(`SELECT
    games.id,
    users.username,
    games.status,
    CASE
        WHEN games.status <> 'playing' THEN words.word
        ELSE NULL
    END AS word,
    TO_CHAR(words.date, 'YYYY-MM-DD') AS date,
    COUNT(attempt.id)::int AS total_attempts,
    games.created_at
FROM games
JOIN users
    ON users.id = games.user_id
JOIN words
    ON words.id = games.word_id
LEFT JOIN attempts AS attempt
    ON attempt.game_id = games.id
WHERE games.user_id = $1
GROUP BY
    games.id,
    users.username,
    games.status,
    words.word,
    words.date,
    games.created_at
 ORDER BY words.date DESC, games.created_at DESC
     LIMIT $2 OFFSET $3`, [userId, limit + 1, offset]);

    const hasMore = rows.length > limit;
    return {
        games: hasMore ? rows.slice(0, limit) : rows,
        hasMore,
    };
}

export async function findUserStreak(userId: string): Promise<StreakSummary> {
    const { rows } = await db.query<{
        date: string;
        status: StreakGameStatus;
        today_date: string;
    }>(
        `SELECT
            TO_CHAR(words.date, 'YYYY-MM-DD') AS date,
            games.status,
            TO_CHAR((NOW() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS today_date
        FROM games
        JOIN words ON words.id = games.word_id
        WHERE games.user_id = $1
        ORDER BY words.date DESC`,
        [userId]
    );

    if (rows.length === 0) {
        return { currentStreak: 0, bestStreak: 0 };
    }

    const todayDate = rows[0].today_date;
    return calculateWinStreak(
        rows.map((row) => ({ date: row.date, status: row.status })),
        todayDate
    );
}
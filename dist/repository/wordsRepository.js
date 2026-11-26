"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTodayWord = findTodayWord;
exports.findTodayGame = findTodayGame;
exports.findAttemptsByGameId = findAttemptsByGameId;
exports.createAttempt = createAttempt;
exports.updateGameStatus = updateGameStatus;
exports.createGame = createGame;
exports.findUserHistory = findUserHistory;
exports.findUserStreak = findUserStreak;
const connection_1 = require("../database/connection");
const streak_1 = require("../services/streak");
async function findTodayWord() {
    const word = await connection_1.db.query(`SELECT id, word FROM words WHERE date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date;; `);
    return word.rows[0];
}
async function findTodayGame(userId) {
    const game = await connection_1.db.query(`SELECT
        games.id,
        games.status,
        games.word_id,
        words.word,
        games.created_at
        FROM games
        JOIN words ON words.id = games.word_id
        WHERE games.user_id = $1
        AND words.date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
        LIMIT 1;`, [userId]);
    return game.rows[0] ?? null;
}
async function findAttemptsByGameId(attemptID) {
    const game = await connection_1.db.query(`SELECT id, game_id, guess, attempt_number, created_at
         FROM attempts
         WHERE game_id = $1
         ORDER BY attempt_number ASC`, [attemptID]);
    return game.rows;
}
async function createAttempt(gameId, guess, attemptNumber) {
    const { rows } = await connection_1.db.query(`INSERT INTO attempts (game_id, guess, attempt_number)
     VALUES ($1, $2, $3)
     RETURNING id, guess, attempt_number, created_at`, [gameId, guess.toUpperCase(), attemptNumber]);
    return rows[0];
}
async function updateGameStatus(gameId, status) {
    await connection_1.db.query(`UPDATE games SET status = $1 WHERE id = $2`, [status, gameId]);
}
async function createGame(userId, wordId) {
    const { rows } = await connection_1.db.query(`INSERT INTO games (user_id, word_id)
     VALUES ($1, $2)
     RETURNING id, user_id, word_id, status`, [userId, wordId]);
    return rows[0];
}
async function findUserHistory(userId, limit = 10, offset = 0) {
    const { rows } = await connection_1.db.query(`SELECT
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
async function findUserStreak(userId) {
    const { rows } = await connection_1.db.query(`SELECT
            TO_CHAR(words.date, 'YYYY-MM-DD') AS date,
            games.status,
            TO_CHAR((NOW() AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS today_date
        FROM games
        JOIN words ON words.id = games.word_id
        WHERE games.user_id = $1
        ORDER BY words.date DESC`, [userId]);
    if (rows.length === 0) {
        return { currentStreak: 0, bestStreak: 0 };
    }
    const todayDate = rows[0].today_date;
    return (0, streak_1.calculateWinStreak)(rows.map((row) => ({ date: row.date, status: row.status })), todayDate);
}

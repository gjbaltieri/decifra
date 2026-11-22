"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTodayWord = findTodayWord;
exports.findTodayGame = findTodayGame;
exports.findAttemptsByGameId = findAttemptsByGameId;
exports.createAttempt = createAttempt;
exports.updateGameStatus = updateGameStatus;
exports.createGame = createGame;
const connection_1 = require("../database/connection");
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

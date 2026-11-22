"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.findUser = findUser;
const connection_1 = require("../database/connection");
async function createUser(username, password_hash) {
    const result = await connection_1.db.query(`INSERT INTO users ( username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, created_at`, [username, password_hash]);
    return result.rows[0];
}
async function findUser(username) {
    const result = await connection_1.db.query(`SELECT * FROM users 
        WHERE username = $1`, [username]);
    return result.rows[0];
}

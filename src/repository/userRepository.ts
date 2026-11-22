import { db } from '../database/connection';

export async function createUser(username: string, password_hash: string) {
    const result = await db.query(
        `INSERT INTO users ( username, password_hash)
         VALUES ($1, $2)
         RETURNING id, username, created_at`,
        [username, password_hash]
    );

    return result.rows[0];
}

export async function findAllUsers() {
    const result = await db.query(
        'SELECT * FROM users'
    );

    return result.rows;
}


export async function findUser(username: string) {
    const result = await db.query(
        `SELECT * FROM users 
        WHERE username = $1`,
        [username]
    );

    return result.rows[0];
}
import { db } from '../database/connection';

export async function createUser(username: string, email: string, password: string) {
    const result = await db.query(
        `INSERT INTO users ( username, email, password_hash)
         VALUES ($1, $2,$3)
         RETURNING *`,
        [username, email, password]
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
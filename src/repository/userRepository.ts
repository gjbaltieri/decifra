import { db } from '../database/connection';

export async function createUser(name: string, email: string,) {
    const result = await db.query(
        `INSERT INTO users ( name, email)
         VALUES ($1, $2)
         RETURNING *`,
        [name, email]
    );

    return result.rows[0];
}

export async function findAllUsers() {
    const result = await db.query(
        'SELECT * FROM users'
    );

    return result.rows;
}
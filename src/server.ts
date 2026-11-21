import express, { Request, Response } from 'express'
import { db } from './database/connection'
import { createUser } from './repository/userRepository';

const app = express()
app.use(express.json())


app.get('/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');

        res.status(200).json({
            connected: true,
            timestamp: result.rows[0].now
        });

    } catch (error) {
        res.status(500).json({
            connected: false,
            error: 'Erro ao conectar com o banco'
        });
    }
})

app.post('/adduser', async (req: Request, res: Response) => {
    try {
        const { name, email } = req.body
        console.log(name, email)
        const user = await createUser(name, email)
        return res.status(201).json(user)
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            error: 'Erro ao criar usuário'
        });
    }
})

app.listen(3000, () => {
    console.log('Server running in http://localhost:3000/')
})
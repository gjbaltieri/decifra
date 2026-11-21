import express, { Request, Response } from 'express'
import { db } from './database/connection'
import { createUser, findUser } from './repository/userRepository';
import bcrypt from 'bcrypt'

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
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body
        if (!username || !password) {
            return res.status(400).json({ error: "Username e password são obrigatórios" });
        }
        const user = await findUser(username)
        if (!user) {
            return res.status(401).json({
                error: 'Usuario ou senha invalido'
            });
        }
        const passHash = await bcrypt.compare(password, user.password_hash)
        if (!passHash) {
            return res.status(401).json({
                error: 'Usuario ou senha invalido'
            });
        }
        return res.status(200).json({
            id: user.id,
            username: user.username,
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            error: 'Erro no servidor'
        });
    }
})


app.post('/adduser', async (req: Request, res: Response) => {
    try {

        const { username, email, password } = req.body
        const passHash = await bcrypt.hash(password, 10)
        const user = await createUser(username, email, passHash)
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
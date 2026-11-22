import 'dotenv/config'
import express, { Request, Response } from 'express'
import { db } from './database/connection'
import { createUser, findUser } from './repository/userRepository';
import bcrypt from 'bcrypt'
import { JWT } from './utils/jtw';
import { authMiddleware, AuthRequest } from "./middlewares/authMiddleware";
import { findAttemptsByGameId, findTodayGame } from './repository/wordsRepository';
import { checkGuess } from './utils/checkGuess';
import cors from "cors";


const app = express()
app.use(express.json())
app.use(cors());
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
        const { username, password } = req.body ?? {}
        if (typeof username !== "string" || typeof password !== 'string' || !username.trim() || !password.trim()) {
            return res.status(400).json({ error: "Username e password são obrigatórios" });
        }
        const user = await findUser(username.trim())
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
        return res.status(200).json(JWT(user));
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            error: 'Erro no servidor'
        });
    }
})


app.post('/adduser', async (req: Request, res: Response) => {
    try {

        const { username, password } = req.body
        if (typeof username !== "string"
            || typeof password !== 'string'
            || !username.trim()
            || !password.trim()) {
            return res.status(400).json({ error: "Username e senha são obrigatórios" });
        }
        if (password.length < 6) {
            return res.status(422).json({ error: "A senha deve conter ao menos 6 caracteres." })
        }


        const passHash = await bcrypt.hash(password, 10)
        const user = await createUser(username.trim(), passHash)
        return res.status(201).json(user)


    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Usuário já cadastrado' })
        }
        console.error(error)
        return res.status(500).json({
            error: 'Erro ao criar usuário'
        });
    }
})

app.get('/game/findtodaygame', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user_Id = req.user?.userId
        if (!user_Id) return res.status(401).json({ error: 'Não autenticado' });
        const game = await findTodayGame(user_Id)
        if (!game) {
            return res.status(200).json({
                status: "playing",
                attempts: [],
            });
        }
        const attempts = await findAttemptsByGameId(game.id);
        const formattedAttempts = attempts.map((attempt) => ({
            attemptNumber: attempt.attempt_number,
            guess: attempt.guess,
            feedback: checkGuess(game.word, attempt.guess),
        }));
        return res.json(formattedAttempts)
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar jogo do dia' });
    }
})

app.listen(3000, () => {
    console.log('Server running in http://localhost:3000/')
})
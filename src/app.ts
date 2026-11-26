import 'dotenv/config'
import cors from "cors";
import express, { Request, Response } from 'express'
import { db } from './database/connection'
import { createUser, findUser } from './repository/userRepository';
import bcrypt from 'bcrypt'
import { JWT } from './services/jtw';
import { authMiddleware, AuthRequest } from "./middlewares/authMiddleware";
import { createAttempt, createGame, findAttemptsByGameId, findTodayGame, findTodayWord, findUserHistory, findUserStreak, updateGameStatus } from './repository/wordsRepository';
import { checkGuess } from './services/checkGuess';
import { normalizeGuess, resolveStatus } from './services/gameServices';
import fs from "node:fs";
import path from "node:path";

export const app = express()
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

        const { username, password } = req.body ?? {}
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
        const [game, streak] = await Promise.all([
            findTodayGame(user_Id),
            findUserStreak(user_Id),
        ]);
        if (!game) {
            return res.status(200).json({
                status: "playing",
                attempts: [],
                currentStreak: streak.currentStreak,
                bestStreak: streak.bestStreak,
            });
        }
        const attempts = await findAttemptsByGameId(game.id);
        const formattedAttempts = attempts.map((attempt) => ({
            attemptNumber: attempt.attempt_number,
            guess: attempt.guess,
            feedback: checkGuess(game.word, attempt.guess),
        }));
        return res.status(200).json({
            status: game.status,
            attempts: formattedAttempts,
            currentStreak: streak.currentStreak,
            bestStreak: streak.bestStreak,
            ...(game.status !== "playing" && game.word && { word: game.word }),
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar jogo do dia' });
    }
})

app.get('/game/history', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Não autenticado' });
        const rawLimit = Number(req.query.limit);
        const rawOffset = Number(req.query.offset);
        const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 10;
        const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
        const [history, streak] = await Promise.all([
            findUserHistory(userId, limit, offset),
            findUserStreak(userId),
        ]);
        return res.status(200).json({
            ...history,
            currentStreak: streak.currentStreak,
            bestStreak: streak.bestStreak,
        });
    } catch (error) {
        console.error("Erro em GET /game/history:", error);
        return res.status(500).json({ error: "Erro interno ao processar histórico" });
    }
})

app.post("/game/guess", authMiddleware, async (req: AuthRequest, res) => {
    try {

        const userId = req.user!.userId;
        const guess = req.body?.guess;

        // Validação do palpite
        if (typeof guess !== "string") {
            return res.status(400).json({ error: "Palpite inválido" });
        }

        const validGuess = normalizeGuess(guess)
        if (!validGuess) {
            return res.status(400).json({ error: "O palpite deve ter exatamente 5 letras" });
        }
        // Buscar a palavra do dia
        const todayWord = await findTodayWord();
        if (!todayWord) {
            return res.status(404).json({ error: "Nenhuma palavra cadastrada para hoje" });
        }

        // Busca ou cria a partida do dia
        let game = await findTodayGame(userId);
        if (!game) {
            game = await createGame(userId, todayWord.id);
        }

        // Bloqueia se a partida acabou
        if (game.status !== "playing") {
            return res.status(400).json({ error: "Partida de hoje já encerrada" });
        }

        // Calcula o número da tentativa e salva
        const previousAttempts = await findAttemptsByGameId(game.id);
        const attemptNumber = previousAttempts.length + 1;

        if (attemptNumber > 6) {
            return res.status(400).json({ error: "Limite de 6 tentativas atingido" });
        }

        await createAttempt(game.id, validGuess, attemptNumber);

        const status = resolveStatus(validGuess, todayWord.word, attemptNumber);
        let streak: { currentStreak: number; bestStreak: number } | null = null;
        if (status !== "playing") {
            await updateGameStatus(game.id, status);
            streak = await findUserStreak(userId);
        }
        // Calcula o feedback e verifica vitória/derrota
        const feedback = checkGuess(todayWord.word, validGuess);

        // Retorna o resultado
        return res.status(201).json({
            attemptNumber,
            guess,
            feedback,
            status,
            ...(status !== "playing" && { word: todayWord.word }),
            ...(streak && {
                currentStreak: streak.currentStreak,
                bestStreak: streak.bestStreak,
            }),
        });
    } catch (error) {
        console.error("Erro em POST /game/guess:", error);
        return res.status(500).json({ error: "Erro interno ao processar palpite" });
    }
});

const frontendPath = path.resolve(process.cwd(), "frontend", "dist");

if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.use((req, res, next) => {
        if (req.method !== "GET") return next();
        res.sendFile(path.join(frontendPath, "index.html"));
    });
}




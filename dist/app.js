"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const connection_1 = require("./database/connection");
const userRepository_1 = require("./repository/userRepository");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jtw_1 = require("./services/jtw");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const wordsRepository_1 = require("./repository/wordsRepository");
const checkGuess_1 = require("./services/checkGuess");
const gameServices_1 = require("./services/gameServices");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.json());
exports.app.use((0, cors_1.default)());
exports.app.get('/health', async (req, res) => {
    try {
        const result = await connection_1.db.query('SELECT NOW()');
        res.status(200).json({
            connected: true,
            timestamp: result.rows[0].now
        });
    }
    catch (error) {
        res.status(500).json({
            connected: false,
            error: 'Erro ao conectar com o banco'
        });
    }
});
exports.app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body ?? {};
        if (typeof username !== "string" || typeof password !== 'string' || !username.trim() || !password.trim()) {
            return res.status(400).json({ error: "Username e password são obrigatórios" });
        }
        const user = await (0, userRepository_1.findUser)(username.trim());
        if (!user) {
            return res.status(401).json({
                error: 'Usuario ou senha invalido'
            });
        }
        const passHash = await bcrypt_1.default.compare(password, user.password_hash);
        if (!passHash) {
            return res.status(401).json({
                error: 'Usuario ou senha invalido'
            });
        }
        return res.status(200).json((0, jtw_1.JWT)(user));
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Erro no servidor'
        });
    }
});
exports.app.post('/adduser', async (req, res) => {
    try {
        const { username, password } = req.body ?? {};
        if (typeof username !== "string"
            || typeof password !== 'string'
            || !username.trim()
            || !password.trim()) {
            return res.status(400).json({ error: "Username e senha são obrigatórios" });
        }
        if (password.length < 6) {
            return res.status(422).json({ error: "A senha deve conter ao menos 6 caracteres." });
        }
        const passHash = await bcrypt_1.default.hash(password, 10);
        const user = await (0, userRepository_1.createUser)(username.trim(), passHash);
        return res.status(201).json(user);
    }
    catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Usuário já cadastrado' });
        }
        console.error(error);
        return res.status(500).json({
            error: 'Erro ao criar usuário'
        });
    }
});
exports.app.get('/game/findtodaygame', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const user_Id = req.user?.userId;
        if (!user_Id)
            return res.status(401).json({ error: 'Não autenticado' });
        const game = await (0, wordsRepository_1.findTodayGame)(user_Id);
        if (!game) {
            return res.status(200).json({
                status: "playing",
                attempts: [],
            });
        }
        const attempts = await (0, wordsRepository_1.findAttemptsByGameId)(game.id);
        const formattedAttempts = attempts.map((attempt) => ({
            attemptNumber: attempt.attempt_number,
            guess: attempt.guess,
            feedback: (0, checkGuess_1.checkGuess)(game.word, attempt.guess),
        }));
        return res.status(200).json({
            status: game.status,
            attempts: formattedAttempts,
            ...(game.status !== "playing" && game.word && { word: game.word }),
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar jogo do dia' });
    }
});
exports.app.post("/game/guess", authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const guess = req.body?.guess;
        // Validação do palpite
        if (typeof guess !== "string") {
            return res.status(400).json({ error: "Palpite inválido" });
        }
        const validGuess = (0, gameServices_1.normalizeGuess)(guess);
        if (!validGuess) {
            return res.status(400).json({ error: "O palpite deve ter exatamente 5 letras" });
        }
        // Buscar a palavra do dia
        const todayWord = await (0, wordsRepository_1.findTodayWord)();
        if (!todayWord) {
            return res.status(404).json({ error: "Nenhuma palavra cadastrada para hoje" });
        }
        // Busca ou cria a partida do dia
        let game = await (0, wordsRepository_1.findTodayGame)(userId);
        if (!game) {
            game = await (0, wordsRepository_1.createGame)(userId, todayWord.id);
        }
        // Bloqueia se a partida acabou
        if (game.status !== "playing") {
            return res.status(400).json({ error: "Partida de hoje já encerrada" });
        }
        // Calcula o número da tentativa e salva
        const previousAttempts = await (0, wordsRepository_1.findAttemptsByGameId)(game.id);
        const attemptNumber = previousAttempts.length + 1;
        if (attemptNumber > 6) {
            return res.status(400).json({ error: "Limite de 6 tentativas atingido" });
        }
        await (0, wordsRepository_1.createAttempt)(game.id, validGuess, attemptNumber);
        const status = (0, gameServices_1.resolveStatus)(validGuess, todayWord.word, attemptNumber);
        if (status !== "playing") {
            await (0, wordsRepository_1.updateGameStatus)(game.id, status);
        }
        // Calcula o feedback e verifica vitória/derrota
        const feedback = (0, checkGuess_1.checkGuess)(todayWord.word, validGuess);
        // Retorna o resultado
        return res.status(201).json({
            attemptNumber,
            guess,
            feedback,
            status,
            ...(status !== "playing" && { word: todayWord.word }),
        });
    }
    catch (error) {
        console.error("Erro em POST /game/guess:", error);
        return res.status(500).json({ error: "Erro interno ao processar palpite" });
    }
});
const frontendPath = node_path_1.default.resolve(process.cwd(), "frontend", "dist");
if (node_fs_1.default.existsSync(frontendPath)) {
    exports.app.use(express_1.default.static(frontendPath));
    exports.app.use((req, res, next) => {
        if (req.method !== "GET")
            return next();
        res.sendFile(node_path_1.default.join(frontendPath, "index.html"));
    });
}

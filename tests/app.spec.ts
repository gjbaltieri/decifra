// Mock das dependências de infraestrutura ANTES de importar o app
jest.mock("../src/database/connection", () => ({
    db: {
        query: jest.fn(),
    },
}));

jest.mock("../src/repository/userRepository", () => ({
    createUser: jest.fn(),
    findUser: jest.fn(),
}));

jest.mock("../src/repository/wordsRepository", () => ({
    findTodayWord: jest.fn(),
    findTodayGame: jest.fn(),
    findAttemptsByGameId: jest.fn(),
    createAttempt: jest.fn(),
    createGame: jest.fn(),
    updateGameStatus: jest.fn(),
    findUserHistory: jest.fn(),
    findUserStreak: jest.fn(),
}));

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { app } from "../src/app";
import { db } from "../src/database/connection";
import { createUser, findUser } from "../src/repository/userRepository";
import {
    createAttempt,
    createGame,
    findAttemptsByGameId,
    findTodayGame,
    findTodayWord,
    findUserHistory,
    findUserStreak,
    updateGameStatus,
} from "../src/repository/wordsRepository";

const mockedDbQuery = db.query as jest.Mock;
const mockedCreateUser = createUser as jest.Mock;
const mockedFindUser = findUser as jest.Mock;
const mockedFindTodayWord = findTodayWord as jest.Mock;
const mockedFindTodayGame = findTodayGame as jest.Mock;
const mockedFindAttemptsByGameId = findAttemptsByGameId as jest.Mock;
const mockedCreateAttempt = createAttempt as jest.Mock;
const mockedCreateGame = createGame as jest.Mock;
const mockedUpdateGameStatus = updateGameStatus as jest.Mock;
const mockedFindUserHistory = findUserHistory as jest.Mock;
const mockedFindUserStreak = findUserStreak as jest.Mock;

const TEST_JWT_SECRET = "segredo-de-teste-jwt";

function gerarTokenValido(payload = { userId: "user-1", username: "jogador" }) {
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: "1h" });
}

function gerarTokenExpirado(payload = { userId: "user-1", username: "jogador" }) {
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: -10 });
}

describe("API Termo (src/app.ts)", () => {
    const originalJwtSecret = process.env.JWT_SECRET;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = TEST_JWT_SECRET;
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        mockedFindUserStreak.mockResolvedValue({ currentStreak: 0, bestStreak: 0 });
        mockedFindUserHistory.mockResolvedValue({ games: [], hasMore: false });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        if (originalJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalJwtSecret;
        }
    });

    describe("GET /health", () => {
        it("retorna 200 com connected true quando o banco responde", async () => {
            // Arrange
            const fakeTimestamp = "2026-11-22T15:00:00.000Z";
            mockedDbQuery.mockResolvedValueOnce({
                rows: [{ now: fakeTimestamp }],
            });

            // Act
            const response = await request(app).get("/health");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                connected: true,
                timestamp: fakeTimestamp,
            });
            expect(mockedDbQuery).toHaveBeenCalledWith("SELECT NOW()");
        });

        it("retorna 500 com connected false quando o banco falha", async () => {
            // Arrange
            mockedDbQuery.mockRejectedValueOnce(new Error("Falha de conexão"));

            // Act
            const response = await request(app).get("/health");

            // Assert
            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                connected: false,
                error: "Erro ao conectar com o banco",
            });
        });
    });

    describe("POST /login", () => {
        it("retorna 400 quando username ou password estão ausentes", async () => {
            // Arrange
            const payload = { username: "jogador" };

            // Act
            const response = await request(app).post("/login").send(payload);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("error");
            expect(mockedFindUser).not.toHaveBeenCalled();
        });

        it("retorna 400 quando username ou password têm tipo inválido", async () => {
            // Arrange
            const payload = { username: 12345, password: true };

            // Act
            const response = await request(app).post("/login").send(payload);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("error");
            expect(mockedFindUser).not.toHaveBeenCalled();
        });

        it("retorna 401 quando o usuário não existe", async () => {
            // Arrange
            mockedFindUser.mockResolvedValueOnce(undefined);

            // Act
            const response = await request(app)
                .post("/login")
                .send({ username: "inexistente", password: "senha123" });

            // Assert
            expect(response.status).toBe(401);
            expect(response.body).toEqual({
                error: "Usuario ou senha invalido",
            });
        });

        it("retorna 401 com a mesma mensagem quando a senha está incorreta", async () => {
            // Arrange
            const passwordHash = await bcrypt.hash("senha-correta", 10);
            mockedFindUser
                .mockResolvedValueOnce(undefined)
                .mockResolvedValueOnce({
                    id: "user-1",
                    username: "jogador",
                    password_hash: passwordHash,
                });

            // Act
            const responseUsuarioInexistente = await request(app)
                .post("/login")
                .send({ username: "naoexiste", password: "senha-errada" });

            const responseSenhaErrada = await request(app)
                .post("/login")
                .send({ username: "jogador", password: "senha-errada" });

            // Assert
            expect(responseSenhaErrada.status).toBe(401);
            expect(responseSenhaErrada.body).toEqual(responseUsuarioInexistente.body);
        });

        it("retorna 200 com token JWT válido e dados do usuário em credenciais válidas", async () => {
            // Arrange
            const passwordHash = await bcrypt.hash("senha123", 10);
            mockedFindUser.mockResolvedValueOnce({
                id: "user-1",
                username: "jogador",
                password_hash: passwordHash,
            });

            // Act
            const response = await request(app)
                .post("/login")
                .send({ username: "jogador", password: "senha123" });

            // Assert
            expect(response.status).toBe(200);
            expect(typeof response.body.token).toBe("string");
            expect(response.body.user).toEqual({
                id: "user-1",
                username: "jogador",
            });
            const decoded = jwt.verify(response.body.token, TEST_JWT_SECRET) as {
                userId: string;
                username: string;
            };
            expect(decoded.userId).toBe("user-1");
            expect(decoded.username).toBe("jogador");
        });

        it("não inclui password_hash na resposta de sucesso", async () => {
            // Arrange
            const passwordHash = await bcrypt.hash("senha123", 10);
            mockedFindUser.mockResolvedValueOnce({
                id: "user-1",
                username: "jogador",
                password_hash: passwordHash,
            });

            // Act
            const response = await request(app)
                .post("/login")
                .send({ username: "jogador", password: "senha123" });

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).not.toHaveProperty("password_hash");
            expect(response.body.user).not.toHaveProperty("password_hash");
        });

        it("retorna 500 quando ocorre erro inesperado", async () => {
            // Arrange
            mockedFindUser.mockRejectedValueOnce(new Error("Erro inesperado no banco"));

            // Act
            const response = await request(app)
                .post("/login")
                .send({ username: "jogador", password: "senha123" });

            // Assert
            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: "Erro no servidor",
            });
        });
    });

    describe("POST /adduser", () => {
        it("retorna 400 quando username ou password estão ausentes", async () => {
            // Arrange
            const payload = { username: "novo-usuario" };

            // Act
            const response = await request(app).post("/adduser").send(payload);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("error");
            expect(mockedCreateUser).not.toHaveBeenCalled();
        });

        it("retorna 422 quando a senha tem menos de 6 caracteres", async () => {
            // Arrange
            const payload = { username: "novo-usuario", password: "12345" };

            // Act
            const response = await request(app).post("/adduser").send(payload);

            // Assert
            expect(response.status).toBe(422);
            expect(response.body).toHaveProperty("error");
            expect(mockedCreateUser).not.toHaveBeenCalled();
        });

        it("retorna 201 ao criar usuário sem expor password_hash", async () => {
            // Arrange
            const createdUser = {
                id: "user-2",
                username: "novo-usuario",
                created_at: "2026-11-22T15:00:00.000Z",
            };
            mockedCreateUser.mockResolvedValueOnce(createdUser);

            // Act
            const response = await request(app)
                .post("/adduser")
                .send({ username: "novo-usuario", password: "senha-forte" });

            // Assert
            expect(response.status).toBe(201);
            expect(response.body).toEqual(createdUser);
            expect(response.body).not.toHaveProperty("password_hash");
        });

        it("chama createUser com username após trim e hash diferente da senha digitada", async () => {
            // Arrange
            const senhaDigitada = "minhaSenha123";
            mockedCreateUser.mockResolvedValueOnce({
                id: "user-3",
                username: "ana",
                created_at: "2026-11-22T15:00:00.000Z",
            });

            // Act
            const response = await request(app)
                .post("/adduser")
                .send({ username: "  ana  ", password: senhaDigitada });

            // Assert
            expect(response.status).toBe(201);
            expect(mockedCreateUser).toHaveBeenCalledTimes(1);
            const [usernamePassado, hashPassado] = mockedCreateUser.mock.calls[0];
            expect(usernamePassado).toBe("ana");
            expect(hashPassado).not.toBe(senhaDigitada);
            await expect(bcrypt.compare(senhaDigitada, hashPassado)).resolves.toBe(true);
        });

        it("retorna 409 quando o usuário já existe (código 23505)", async () => {
            // Arrange
            const duplicateError = Object.assign(new Error("duplicate key"), {
                code: "23505",
            });
            mockedCreateUser.mockRejectedValueOnce(duplicateError);

            // Act
            const response = await request(app)
                .post("/adduser")
                .send({ username: "duplicado", password: "senha-forte" });

            // Assert
            expect(response.status).toBe(409);
            expect(response.body).toEqual({
                message: "Usuário já cadastrado",
            });
        });

        it("retorna 500 quando ocorre erro inesperado", async () => {
            // Arrange
            mockedCreateUser.mockRejectedValueOnce(new Error("Falha ao inserir"));

            // Act
            const response = await request(app)
                .post("/adduser")
                .send({ username: "novo-usuario", password: "senha-forte" });

            // Assert
            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: "Erro ao criar usuário",
            });
        });
    });

    describe("authMiddleware (via rotas protegidas)", () => {
        it("retorna 401 quando o token está ausente", async () => {
            // Arrange & Act
            const response = await request(app).get("/game/findtodaygame");

            // Assert
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Token não fornecido" });
        });

        it("retorna 401 quando o header Authorization não possui prefixo Bearer", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();

            // Act
            const response = await request(app)
                .get("/game/findtodaygame")
                .set("Authorization", `Token ${tokenValido}`);

            // Assert
            expect(response.status).toBe(401);
            expect(mockedFindTodayGame).not.toHaveBeenCalled();
        });

        it("retorna 401 quando o token é inválido", async () => {
            // Arrange & Act
            const response = await request(app)
                .get("/game/findtodaygame")
                .set("Authorization", "Bearer token-invalido-qualquer");

            // Assert
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Token inválido ou expirado" });
        });

        it("retorna 401 quando o token foi assinado com outra chave", async () => {
            // Arrange
            const tokenOutraChave = jwt.sign(
                { userId: "user-1", username: "jogador" },
                "outra-chave-secreta",
                { expiresIn: "1h" }
            );

            // Act
            const response = await request(app)
                .get("/game/findtodaygame")
                .set("Authorization", `Bearer ${tokenOutraChave}`);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Token inválido ou expirado" });
        });

        it("retorna 401 quando o token está expirado", async () => {
            // Arrange
            const tokenExpirado = gerarTokenExpirado();

            // Act
            const response = await request(app)
                .get("/game/findtodaygame")
                .set("Authorization", `Bearer ${tokenExpirado}`);

            // Assert
            expect(response.status).toBe(401);
            expect(response.body).toEqual({ error: "Token inválido ou expirado" });
        });

        it("retorna 500 quando JWT_SECRET não está configurado", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            delete process.env.JWT_SECRET;

            // Act
            const response = await request(app)
                .get("/game/findtodaygame")
                .set("Authorization", `Bearer ${tokenValido}`);

            // Assert
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: "Erro de configuração" });
        });

        it("permite prosseguir para a rota protegida quando o token é válido", async () => {
            // Arrange
            const tokenValido = gerarTokenValido({ userId: "user-99", username: "maria" });
            mockedFindTodayGame.mockResolvedValueOnce(null);

            // Act
            const response = await request(app)
                .get("/game/findtodaygame")
                .set("Authorization", `Bearer ${tokenValido}`);

            // Assert
            expect(response.status).toBe(200);
            expect(mockedFindTodayGame).toHaveBeenCalledWith("user-99");
        });
    });

    describe("GET /game/findtodaygame", () => {
        it("retorna 401 sem autenticação", async () => {
            // Arrange & Act
            const response = await request(app).get("/game/findtodaygame");

            // Assert
            expect(response.status).toBe(401);
        });

        it("retorna status playing e attempts vazio quando não há partida hoje", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayGame.mockResolvedValueOnce(null);

            // Act
            const response = await request(app)
                .get("/game/findtodaygame")
                .set("Authorization", `Bearer ${tokenValido}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "playing",
                attempts: [],
                currentStreak: 0,
                bestStreak: 0,
            });
        });

        it("retorna status e attempts com dados reais e feedback calculado quando há partida hoje", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayGame.mockResolvedValueOnce({
                id: 10,
                status: "playing",
                word_id: 1,
                word: "TERMO",
            });
            mockedFindAttemptsByGameId.mockResolvedValueOnce([
                { id: 1, game_id: 10, attempt_number: 1, guess: "TEMPO" },
            ]);

            // Act
            const response = await request(app)
                .get("/game/findtodaygame")
                .set("Authorization", `Bearer ${tokenValido}`);

            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: "playing",
                attempts: [
                    {
                        attemptNumber: 1,
                        guess: "TEMPO",
                        feedback: ["correct", "correct", "present", "absent", "correct"],
                    },
                ],
                currentStreak: 0,
                bestStreak: 0,
            });
        });

        it("retorna 500 quando ocorre erro inesperado", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayGame.mockRejectedValueOnce(new Error("Erro no banco"));

            // Act
            const response = await request(app)
                .get("/game/findtodaygame")
                .set("Authorization", `Bearer ${tokenValido}`);

            // Assert
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: "Erro ao buscar jogo do dia" });
        });
    });

    describe("POST /game/guess", () => {
        it("retorna 401 sem autenticação", async () => {
            // Arrange & Act
            const response = await request(app)
                .post("/game/guess")
                .send({ guess: "TERMO" });

            // Assert
            expect(response.status).toBe(401);
        });

        it("retorna 400 quando o palpite não é texto", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: 12345 });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: "Palpite inválido" });
        });

        it("retorna 400 quando o palpite está vazio ou só com espaços", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "     " });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "O palpite deve ter exatamente 5 letras",
            });
        });

        it("retorna 400 quando o palpite tem 3 letras", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "SOL" });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "O palpite deve ter exatamente 5 letras",
            });
        });

        it("retorna 400 quando o palpite tem 6 letras", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "TERMOS" });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "O palpite deve ter exatamente 5 letras",
            });
        });

        it("retorna 400 quando o palpite contém números ou símbolos", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "TE1M!" });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                error: "O palpite deve ter exatamente 5 letras",
            });
        });

        it("retorna 404 quando não há palavra cadastrada para hoje", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayWord.mockResolvedValueOnce(undefined);

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "TERMO" });

            // Assert
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                error: "Nenhuma palavra cadastrada para hoje",
            });
        });

        it("retorna 400 quando a partida de hoje já está encerrada", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayWord.mockResolvedValueOnce({ id: 1, word: "TERMO" });
            mockedFindTodayGame.mockResolvedValueOnce({
                id: 10,
                status: "won",
                word_id: 1,
            });

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "TEMPO" });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: "Partida de hoje já encerrada" });
        });

        it("retorna 400 quando o limite de 6 tentativas já foi atingido", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayWord.mockResolvedValueOnce({ id: 1, word: "TERMO" });
            mockedFindTodayGame.mockResolvedValueOnce({
                id: 10,
                status: "playing",
                word_id: 1,
            });
            mockedFindAttemptsByGameId.mockResolvedValueOnce([
                { attempt_number: 1, guess: "CASAS" },
                { attempt_number: 2, guess: "BOLAS" },
                { attempt_number: 3, guess: "LIVRO" },
                { attempt_number: 4, guess: "PEDRA" },
                { attempt_number: 5, guess: "VENTO" },
                { attempt_number: 6, guess: "NUVEM" },
            ]);

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "TERMO" });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: "Limite de 6 tentativas atingido" });
            expect(mockedCreateAttempt).not.toHaveBeenCalled();
        });

        it("cria a partida automaticamente quando não existe partida hoje", async () => {
            // Arrange
            const tokenValido = gerarTokenValido({ userId: "user-7", username: "lucas" });
            mockedFindTodayWord.mockResolvedValueOnce({ id: 42, word: "TERMO" });
            mockedFindTodayGame.mockResolvedValueOnce(null);
            mockedCreateGame.mockResolvedValueOnce({
                id: 100,
                user_id: "user-7",
                word_id: 42,
                status: "playing",
            });
            mockedFindAttemptsByGameId.mockResolvedValueOnce([]);
            mockedCreateAttempt.mockResolvedValueOnce({
                id: 1,
                guess: "TEMPO",
                attempt_number: 1,
            });

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "TEMPO" });

            // Assert
            expect(response.status).toBe(201);
            expect(mockedCreateGame).toHaveBeenCalledWith("user-7", 42);
        });

        it("chama createAttempt com o palpite normalizado em maiúsculas", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayWord.mockResolvedValueOnce({ id: 1, word: "TERMO" });
            mockedFindTodayGame.mockResolvedValueOnce({
                id: 10,
                status: "playing",
                word_id: 1,
            });
            mockedFindAttemptsByGameId.mockResolvedValueOnce([]);
            mockedCreateAttempt.mockResolvedValueOnce({
                id: 1,
                guess: "TEMPO",
                attempt_number: 1,
            });

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "  tempo  " });

            // Assert
            expect(response.status).toBe(201);
            expect(mockedCreateAttempt).toHaveBeenCalledWith(10, "TEMPO", 1);
        });

        it("retorna 201 com status playing, feedback calculado e sem revelar a palavra", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayWord.mockResolvedValueOnce({ id: 1, word: "TERMO" });
            mockedFindTodayGame.mockResolvedValueOnce({
                id: 10,
                status: "playing",
                word_id: 1,
            });
            mockedFindAttemptsByGameId.mockResolvedValueOnce([]);
            mockedCreateAttempt.mockResolvedValueOnce({
                id: 1,
                guess: "TEMPO",
                attempt_number: 1,
            });

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "TEMPO" });

            // Assert
            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                attemptNumber: 1,
                guess: "TEMPO",
                feedback: ["correct", "correct", "present", "absent", "correct"],
                status: "playing",
            });
            expect(response.body).not.toHaveProperty("word");
        });

        it("retorna 201 com vitória quando o palpite é enviado em minúsculas", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayWord.mockResolvedValueOnce({ id: 1, word: "TERMO" });
            mockedFindTodayGame.mockResolvedValueOnce({
                id: 10,
                status: "playing",
                word_id: 1,
            });
            mockedFindAttemptsByGameId.mockResolvedValueOnce([]);
            mockedCreateAttempt.mockResolvedValueOnce({
                id: 1,
                guess: "TERMO",
                attempt_number: 1,
            });

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "termo" });

            // Assert
            expect(response.status).toBe(201);
            expect(response.body.status).toBe("won");
            expect(response.body.feedback).toEqual([
                "correct",
                "correct",
                "correct",
                "correct",
                "correct",
            ]);
            expect(response.body.word).toBe("TERMO");
            expect(mockedUpdateGameStatus).toHaveBeenCalledWith(10, "won");
        });

        it.todo("retorna 201 com status won, revela a palavra e atualiza o status da partida ao acertar");

        it.todo("retorna 201 com status lost, revela a palavra e atualiza o status da partida na 6ª tentativa errada");

        it.todo("não chama updateGameStatus enquanto o status é playing");

        it("retorna 500 quando ocorre erro inesperado", async () => {
            // Arrange
            const tokenValido = gerarTokenValido();
            mockedFindTodayWord.mockRejectedValueOnce(new Error("Erro inesperado"));

            // Act
            const response = await request(app)
                .post("/game/guess")
                .set("Authorization", `Bearer ${tokenValido}`)
                .send({ guess: "TERMO" });

            // Assert
            expect(response.status).toBe(500);
            expect(response.body).toEqual({
                error: "Erro interno ao processar palpite",
            });
        });
    });
});

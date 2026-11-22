"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido" });
    }
    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token inválido ou malformado" });
    }
    const token = req.headers.authorization?.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!token)
        return res.status(401).json({ error: "Token não fornecido" });
    if (!secret)
        return res.status(500).json({ error: "Erro de configuração" });
    try {
        req.user = jsonwebtoken_1.default.verify(token, secret);
        next();
    }
    catch {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
}

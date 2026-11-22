import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        username: string;
    };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!token) return res.status(401).json({ error: "Token não fornecido" });
    if (!secret) return res.status(500).json({ error: "Erro de configuração" });

    try {
        req.user = jwt.verify(token, secret) as AuthRequest["user"];
        next();
    } catch {
        return res.status(401).json({ error: "Token inválido ou expirado" });
    }
}

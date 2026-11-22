"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT = JWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function JWT(user) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET não configurada no .env");
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username }, secret, { expiresIn: "7d" });
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
        },
    };
}

import jwt from 'jsonwebtoken'
import { User } from '../repository/userRepository';



export interface JWTjson {
    token: string,
    user: {
        id: string,
        username: string
    }
}

export function JWT(user: User): JWTjson {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET não configurada no .env");
    }

    const token = jwt.sign(
        { userId: user.id, username: user.username },
        secret,
        { expiresIn: "7d" }
    );

    return {
        token,
        user: {
            id: user.id,
            username: user.username,
        },
    };
}




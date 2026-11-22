export type LetterStatus = 'correct' | 'present' | 'absent';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface AuthUser {
  id: string;
  username: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

/**
 * Resposta de POST /login (status 200)
 */
export interface LoginResponse {
  token: string;
  user: AuthUser;
}

/**
 * Resposta de POST /adduser (status 201)
 */
export interface RegisterResponse {
  id: string;
  username: string;
  created_at: string;
}

/**
 * Item de tentativa retornado em GET /game/findtodaygame
 */
export interface AttemptItem {
  attemptNumber: number;
  guess: string;
  feedback: LetterStatus[];
}

/**
 * Resposta de GET /game/findtodaygame (status 200)
 */
export interface TodayGameResponse {
  status: GameStatus;
  attempts: AttemptItem[];
  word?: string;
}

/**
 * Payload enviado para POST /game/guess
 */
export interface GuessRequest {
  guess: string;
}

/**
 * Resposta de POST /game/guess (status 201)
 * Inclui `word` apenas quando `status !== 'playing'` ('won' | 'lost')
 */
export interface GuessResponse {
  attemptNumber: number;
  guess: string;
  feedback: LetterStatus[];
  status: GameStatus;
  word?: string;
}

/**
 * Formato de erro da API (`error` ou `message` no caso de 409)
 */
export interface ApiErrorPayload {
  error?: string;
  message?: string;
}

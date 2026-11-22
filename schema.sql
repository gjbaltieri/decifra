CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL CHECK (LENGTH(password_hash) >= 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(5) NOT NULL CHECK (char_length(word) = 5),
  date DATE UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES words(id),
  status VARCHAR(10) NOT NULL DEFAULT 'playing' CHECK (status IN ('playing', 'won', 'lost')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, word_id)
);

CREATE TABLE attempts (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  guess VARCHAR(5) NOT NULL CHECK (char_length(guess) = 5),
  attempt_number INTEGER NOT NULL CHECK (attempt_number BETWEEN 1 AND 6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (game_id, attempt_number)
);
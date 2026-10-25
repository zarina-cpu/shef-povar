CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT,
  image TEXT,
  phone TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS saved_recipes (
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  payload TEXT NOT NULL,
  saved_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_saved
  ON saved_recipes (user_id, saved_at DESC);

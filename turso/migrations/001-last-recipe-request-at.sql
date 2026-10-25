-- Один раз для уже созданной базы (новые — колонка уже в schema.sql):
ALTER TABLE users ADD COLUMN last_recipe_request_at INTEGER;

import { getTurso } from "@/lib/turso/db";

/** Пауза между новыми запросами рецепта, не максимальное время ответа Gemini */
export const RECIPE_COOLDOWN_MS = 30_000;

const memoryLastByUser = new Map();

function retryAfterSec(lastAt, now) {
  return Math.max(1, Math.ceil((lastAt + RECIPE_COOLDOWN_MS - now) / 1000));
}

function consumeMemory(userId, now) {
  const threshold = now - RECIPE_COOLDOWN_MS;
  const last = memoryLastByUser.get(userId);
  if (last != null && last > threshold) {
    return { ok: false, retryAfterSec: retryAfterSec(last, now) };
  }
  memoryLastByUser.set(userId, now);
  return { ok: true };
}

/**
 * Фиксирует старт запроса рецепта. Долгая генерация (>30 с) не обрывается —
 * ограничение только на повторное нажатие слишком рано.
 */
export async function consumeRecipeCooldown(userId) {
  if (!userId) {
    return { ok: true };
  }

  const now = Date.now();
  const threshold = now - RECIPE_COOLDOWN_MS;
  const db = getTurso();

  if (!db) {
    return consumeMemory(userId, now);
  }

  const updated = await db.execute({
    sql: `UPDATE users SET last_recipe_request_at = ?
          WHERE id = ?
            AND (last_recipe_request_at IS NULL OR last_recipe_request_at <= ?)`,
    args: [now, userId, threshold],
  });

  const changes = updated.rowsAffected ?? 0;
  if (changes > 0) {
    return { ok: true };
  }

  const row = await db.execute({
    sql: "SELECT last_recipe_request_at FROM users WHERE id = ?",
    args: [userId],
  });
  const last = row.rows[0]?.last_recipe_request_at;
  if (last == null) {
    return { ok: true };
  }
  const lastNum = Number(last);
  if (lastNum > threshold) {
    return { ok: false, retryAfterSec: retryAfterSec(lastNum, now) };
  }

  return consumeMemory(userId, now);
}

/** Если запрос к Gemini не удался — можно снова нажать «Придумать» без 30-сек паузы */
export async function releaseRecipeCooldown(userId) {
  if (!userId) {
    return;
  }
  memoryLastByUser.delete(userId);
  const db = getTurso();
  if (!db) {
    return;
  }
  await db.execute({
    sql: "UPDATE users SET last_recipe_request_at = NULL WHERE id = ?",
    args: [userId],
  });
}

import { getTurso } from "@/lib/turso/db";

export async function listRecipesForUser(userId) {
  const db = getTurso();
  if (!db) {
    return [];
  }
  const result = await db.execute({
    sql: `SELECT payload FROM saved_recipes
          WHERE user_id = ?
          ORDER BY saved_at DESC`,
    args: [userId],
  });
  return result.rows
    .map((row) => {
      try {
        return JSON.parse(row.payload);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export async function upsertRecipeForUser(userId, entry) {
  const db = getTurso();
  if (!db) {
    throw new Error("NO_DB");
  }
  await db.execute({
    sql: `INSERT INTO saved_recipes (user_id, id, payload, saved_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(user_id, id) DO UPDATE SET
            payload = excluded.payload,
            saved_at = excluded.saved_at`,
    args: [userId, entry.id, JSON.stringify(entry), entry.savedAt || Date.now()],
  });
}

export async function deleteRecipeForUser(userId, recipeId) {
  const db = getTurso();
  if (!db) {
    throw new Error("NO_DB");
  }
  await db.execute({
    sql: "DELETE FROM saved_recipes WHERE user_id = ? AND id = ?",
    args: [userId, recipeId],
  });
}

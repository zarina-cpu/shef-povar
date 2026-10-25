import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { getTurso } from "@/lib/turso/db";

function mapUser(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash,
    name: row.name,
    image: row.image,
    phone: row.phone,
  };
}

export async function findUserByEmail(email) {
  const db = getTurso();
  if (!db) {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  const result = await db.execute({
    sql: "SELECT id, email, password_hash, name, image, phone FROM users WHERE email = ?",
    args: [normalized],
  });
  return mapUser(result.rows[0]);
}

export async function createUserWithPassword({ email, password, name }) {
  const db = getTurso();
  if (!db) {
    throw new Error("NO_DB");
  }
  const normalized = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalized);
  if (existing) {
    throw new Error("EMAIL_EXISTS");
  }
  if (!password || password.length < 6) {
    throw new Error("WEAK_PASSWORD");
  }
  const id = randomUUID();
  const password_hash = await bcrypt.hash(password, 10);
  await db.execute({
    sql: `INSERT INTO users (id, email, password_hash, name, created_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [id, normalized, password_hash, name || null, Date.now()],
  });
  return { id, email: normalized, name: name || null };
}

export async function upsertOAuthUser({ email, name, image }) {
  const db = getTurso();
  if (!db) {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalized);
  if (existing) {
    await db.execute({
      sql: `UPDATE users SET name = COALESCE(?, name), image = COALESCE(?, image)
            WHERE id = ?`,
      args: [name || null, image || null, existing.id],
    });
    return existing.id;
  }
  const id = randomUUID();
  await db.execute({
    sql: `INSERT INTO users (id, email, password_hash, name, image, created_at)
          VALUES (?, ?, NULL, ?, ?, ?)`,
    args: [id, normalized, name || null, image || null, Date.now()],
  });
  return id;
}

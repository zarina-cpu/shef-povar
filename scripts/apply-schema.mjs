import fs from "fs";
import { createClient } from "@libsql/client";

const text = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  env[m[1]] = m[2].trim();
}

const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

const schema = fs.readFileSync("turso/schema.sql", "utf8");
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const sql of statements) {
  await db.execute(sql);
}

const tables = await db.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
console.log("Tables:", tables.rows.map((r) => r.name).join(", "));

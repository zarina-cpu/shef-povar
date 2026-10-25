import fs from "fs";
import { createClient } from "@libsql/client";

const text = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[m[1]] = v;
}

const url = env.TURSO_DATABASE_URL;
const token = env.TURSO_AUTH_TOKEN;
const auth = env.AUTH_SECRET;

console.log("TURSO_DATABASE_URL:", url ? "OK" : "MISSING");
console.log("TURSO_AUTH_TOKEN:", token ? `OK (${token.length} chars)` : "MISSING");
console.log("AUTH_SECRET:", auth ? "OK" : "MISSING");

if (!url || !token) {
  process.exit(1);
}

const db = createClient({ url, authToken: token });
const ping = await db.execute("SELECT 1 AS ok");
console.log("Ping:", ping.rows[0]?.ok === 1 ? "OK" : "FAIL");

const tables = await db.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
const names = tables.rows.map((r) => r.name);
console.log("Tables:", names.length ? names.join(", ") : "(none — выполните turso/schema.sql)");

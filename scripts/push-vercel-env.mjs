import { execFileSync } from "node:child_process";
import fs from "node:fs";

const text = fs.readFileSync(".env.local", "utf8");
const parsed = {};
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (!m || m[1].startsWith("VERCEL_")) continue;
  let v = m[2].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  parsed[m[1]] = v;
}

const vars = {
  GEMINI_API_KEY: parsed.GEMINI_API_KEY,
  TURSO_DATABASE_URL: parsed.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: parsed.TURSO_AUTH_TOKEN,
  AUTH_SECRET: parsed.AUTH_SECRET,
  AUTH_URL: "https://shef-povar.vercel.app",
  AUTH_GOOGLE_ID: parsed.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: parsed.AUTH_GOOGLE_SECRET,
};

for (const [name, value] of Object.entries(vars)) {
  if (!value) {
    console.error(`Skip ${name}: empty`);
    continue;
  }
  for (const environment of ["production", "preview"]) {
    execFileSync(
      "npx",
      [
        "vercel@latest",
        "env",
        "add",
        name,
        "--environment",
        environment,
        "--value",
        value,
        "--yes",
        "--force",
        "--sensitive",
      ],
      { stdio: "inherit", shell: true, cwd: process.cwd() }
    );
    console.log(`OK ${name} → ${environment}`);
  }
}

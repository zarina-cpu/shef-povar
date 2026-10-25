import { isCloudAuthConfigured } from "@/lib/auth/config";
import { createUserWithPassword } from "@/lib/turso/users";

export const runtime = "nodejs";

export async function POST(request) {
  if (!isCloudAuthConfigured()) {
    return Response.json(
      {
        error:
          "Облако не настроено. Добавьте Turso и AUTH_SECRET в переменные окружения (Vercel / .env.local).",
      },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Неверный запрос." }, { status: 400 });
  }

  const email = body?.email?.trim();
  const password = body?.password;
  if (!email || !password) {
    return Response.json({ error: "Укажите email и пароль." }, { status: 400 });
  }

  try {
    await createUserWithPassword({ email, password });
    return Response.json({ ok: true });
  } catch (err) {
    if (err.message === "EMAIL_EXISTS") {
      return Response.json({ error: "Этот email уже зарегистрирован." }, { status: 409 });
    }
    if (err.message === "WEAK_PASSWORD") {
      return Response.json({ error: "Пароль слишком короткий (минимум 6 символов)." }, { status: 400 });
    }
    return Response.json({ error: "Не удалось создать аккаунт." }, { status: 500 });
  }
}

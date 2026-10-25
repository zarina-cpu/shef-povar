import { auth } from "@/auth";
import { isTursoCloudReady } from "@/lib/auth/config";
import {
  deleteRecipeForUser,
  listRecipesForUser,
  upsertRecipeForUser,
} from "@/lib/turso/recipes";

export const runtime = "nodejs";

function unauthorized() {
  return Response.json({ error: "Нужен вход в аккаунт." }, { status: 401 });
}

function noConfig() {
  return Response.json(
    { error: "Turso не настроен. Добавьте TURSO_DATABASE_URL и TURSO_AUTH_TOKEN." },
    { status: 503 }
  );
}

export async function GET() {
  if (!isTursoCloudReady()) {
    return noConfig();
  }
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  try {
    const recipes = await listRecipesForUser(session.user.id);
    return Response.json({ recipes });
  } catch {
    return Response.json({ error: "Ошибка базы данных." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isTursoCloudReady()) {
    return noConfig();
  }
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Неверный запрос." }, { status: 400 });
  }

  const entry = body?.entry;
  if (!entry?.id || !entry?.recipe) {
    return Response.json({ error: "Нет данных рецепта." }, { status: 400 });
  }

  try {
    await upsertRecipeForUser(session.user.id, entry);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Не удалось сохранить." }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!isTursoCloudReady()) {
    return noConfig();
  }
  const session = await auth();
  if (!session?.user?.id) {
    return unauthorized();
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Нет id рецепта." }, { status: 400 });
  }

  try {
    await deleteRecipeForUser(session.user.id, id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Не удалось удалить." }, { status: 500 });
  }
}

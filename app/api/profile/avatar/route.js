import { auth } from "@/auth";
import { isTursoCloudReady } from "@/lib/auth/config";
import { findUserById, updateUserImage } from "@/lib/turso/users";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/;

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
  const user = await findUserById(session.user.id);
  return Response.json({ image: user?.image || null });
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
    return Response.json({ error: "Неверный формат запроса." }, { status: 400 });
  }

  const image = body?.image;
  if (typeof image !== "string") {
    return Response.json({ error: "Нужно поле image." }, { status: 400 });
  }

  const match = image.match(DATA_URL_RE);
  if (!match) {
    return Response.json({ error: "Допустимы JPG, PNG или WebP до 8 МБ." }, { status: 400 });
  }

  const bytes = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (bytes.length > MAX_BYTES) {
    return Response.json({
      error: "Фото больше 8 МБ. Выберите файл меньше или сожмите его.",
    }, { status: 400 });
  }

  try {
    await updateUserImage(session.user.id, image);
    return Response.json({ image });
  } catch (err) {
    if (err?.message === "BAD_IMAGE") {
      return Response.json({ error: "Некорректное изображение." }, { status: 400 });
    }
    return Response.json({ error: "Не удалось сохранить фото." }, { status: 500 });
  }
}

import { buildPrompt, parseRecipe } from "@/lib/gemini";
import { generateGeminiText } from "@/lib/geminiGenerate";

export const runtime = "nodejs";
export const maxDuration = 60;

function badRequest(message) {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Не удалось прочитать запрос.");
  }

  const ingredients = String(body?.ingredients || "").trim();
  const equipment = String(body?.equipment || "").trim();
  const dishType = String(body?.dishType || "").trim();
  const avoidTitles = Array.isArray(body?.avoidTitles)
    ? body.avoidTitles.map((t) => String(t || "").trim()).filter(Boolean).slice(0, 8)
    : [];

  if (ingredients.length < 3) {
    return badRequest("Напишите хотя бы несколько продуктов.");
  }
  if (!equipment) {
    return badRequest("Укажите, какая техника есть на кухне.");
  }
  if (!dishType) {
    return badRequest("Выберите тип блюда.");
  }
  if (ingredients.length > 2000 || equipment.length > 500 || dishType.length > 200) {
    return badRequest("Слишком длинный список. Сократите ввод.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "На сервере нет GEMINI_API_KEY. Добавьте ключ в .env.local." },
      { status: 500 }
    );
  }

  const prompt = buildPrompt(ingredients, equipment, dishType, avoidTitles);
  const temperature = avoidTitles.length ? 0.92 : 0.75;

  const geminiOpts = {
    temperature,
    maxOutputTokens: 2048,
    attemptTimeoutMs: 0,
    deadlineMs: 0,
    attemptsPerModel: 2,
  };

  try {
    const text = await generateGeminiText(apiKey, prompt, geminiOpts);
    const recipe = parseRecipe(text);
    return Response.json({ recipe });
  } catch (error) {
    return Response.json(
      { error: error.message || "Не получилось собрать рецепт." },
      { status: 502 }
    );
  }
}

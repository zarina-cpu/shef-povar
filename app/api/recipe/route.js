import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildPrompt, GEMINI_MODELS, parseRecipe } from "@/lib/gemini";

export const runtime = "nodejs";

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

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(ingredients, equipment, dishType, avoidTitles);
  const temperature = avoidTitles.length ? 0.95 : 0.8;
  let lastError = "Не удалось связаться с Gemini.";

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const recipe = parseRecipe(text);
      return Response.json({ recipe });
    } catch (error) {
      lastError = error?.message || lastError;
    }
  }

  let message = "Не получилось собрать рецепт. Попробуйте ещё раз.";
  if (/API[_ ]?key|permission|401|403/i.test(lastError)) {
    message = "Ключ Gemini отклонён. Проверьте GEMINI_API_KEY в Google AI Studio.";
  } else if (/503|overloaded|unavailable/i.test(lastError)) {
    message = "Gemini временно перегружен. Подождите минуту и попробуйте снова.";
  } else if (/404|not found|no longer/i.test(lastError)) {
    message = "Модель Gemini недоступна. Обновите приложение или ключ API.";
  }

  return Response.json({ error: message }, { status: 502 });
}

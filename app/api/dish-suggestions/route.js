import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  GEMINI_MODELS,
  buildSuggestionsPrompt,
  parseSuggestions,
} from "@/lib/gemini";

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

  const equipment = String(body?.equipment || "").trim();
  const dishType = String(body?.dishType || "").trim();

  if (!equipment) {
    return badRequest("Укажите, какая техника есть на кухне.");
  }
  if (!dishType) {
    return badRequest("Выберите тип блюда.");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "На сервере нет GEMINI_API_KEY. Добавьте ключ в .env.local." },
      { status: 500 }
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildSuggestionsPrompt(equipment, dishType);
  let lastError = "Не удалось связаться с Gemini.";

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.85,
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const data = parseSuggestions(text);
      return Response.json(data);
    } catch (error) {
      lastError = error?.message || lastError;
    }
  }

  let message = "Не получилось подобрать идеи. Попробуйте ещё раз.";
  if (/API[_ ]?key|permission|401|403/i.test(lastError)) {
    message = "Ключ Gemini отклонён. Проверьте GEMINI_API_KEY.";
  } else if (/503|overloaded|unavailable/i.test(lastError)) {
    message = "Gemini временно перегружен. Подождите минуту.";
  }

  return Response.json({ error: message }, { status: 502 });
}

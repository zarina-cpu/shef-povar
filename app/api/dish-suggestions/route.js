import { buildSuggestionsPrompt, parseSuggestions } from "@/lib/gemini";
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

  const prompt = buildSuggestionsPrompt(equipment, dishType);

  try {
    const text = await generateGeminiText(apiKey, prompt, {
      temperature: 0.8,
      maxOutputTokens: 4096,
    });
    const data = parseSuggestions(text);
    return Response.json(data);
  } catch (error) {
    return Response.json(
      { error: error.message || "Не получилось подобрать идеи." },
      { status: 502 }
    );
  }
}

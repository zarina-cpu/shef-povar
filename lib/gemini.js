const SYSTEM_PROMPT = `Ты домашний шеф. Придумываешь одно блюдо только из продуктов, которые есть у человека.

Правила:
- Используй только названные продукты плюс соль, перец, вода, растительное масло — если масло не названо, упомяни это как «по желанию».
- Если техника — «все» или «все способы приготовления», можно использовать любой разумный способ: плиту, духовку, микроволновку, блендер и т.д.
- Если техники мало или её нет, не предлагай духовку, плиту, микроволновку или блендер, если их нет в списке.
- Строго соблюдай тип блюда: первые блюда, вторые блюда, десерт, напитки или салаты.
- «Проблемные» продукты (старая сметана, вялые овощи, остатки) используй в термообработке: соус, запеканка, омлет, суп — не сырыми. Для салатов и напитков термообработка нужна только если продукт небезопасен сырым.
- Название блюда — короткое и аппетитное, на русском.
- Калории — честная оценка, не точные лабораторные цифры.
- Ответ — только JSON без markdown и без комментариев.

Схема JSON:
{
  "title": "string",
  "tagline": "string, 1 предложение почему это подходит",
  "servings": number,
  "timeMinutes": number,
  "caloriesPerServing": number,
  "caloriesTotal": number,
  "usedIngredients": [{ "name": "string", "amount": "string" }],
  "steps": [{ "n": number, "text": "string" }],
  "tips": "string"
}`;

function extractJson(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    throw new Error("Пустой ответ модели");
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1].trim() : trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Модель вернула не JSON");
  }

  return JSON.parse(raw.slice(start, end + 1));
}

function asNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function asText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.trim();
}

export function parseRecipe(text) {
  const data = extractJson(text);

  const usedIngredients = Array.isArray(data.usedIngredients)
    ? data.usedIngredients
        .map((item) => ({
          name: asText(item?.name),
          amount: asText(item?.amount),
        }))
        .filter((item) => item.name)
    : [];

  const steps = Array.isArray(data.steps)
    ? data.steps
        .map((item, index) => ({
          n: asNumber(item?.n, index + 1),
          text: asText(item?.text),
        }))
        .filter((item) => item.text)
    : [];

  const title = asText(data.title);
  if (!title || steps.length === 0) {
    throw new Error("В ответе нет названия или шагов");
  }

  const servings = Math.max(1, asNumber(data.servings, 2));
  const caloriesPerServing = Math.max(0, asNumber(data.caloriesPerServing, 0));
  const caloriesTotal = Math.max(
    0,
    asNumber(data.caloriesTotal, caloriesPerServing * servings)
  );

  return {
    title,
    tagline: asText(data.tagline),
    servings,
    timeMinutes: Math.max(1, asNumber(data.timeMinutes, 30)),
    caloriesPerServing,
    caloriesTotal,
    usedIngredients,
    steps,
    tips: asText(data.tips),
  };
}

export function buildPrompt(ingredients, equipment, dishType) {
  return [
    SYSTEM_PROMPT,
    "",
    `Продукты: ${ingredients}`,
    `Техника: ${equipment}`,
    `Тип блюда: ${dishType}`,
    "Придумай одно блюдо этого типа и верни JSON по схеме.",
  ].join("\n");
}

export const GEMINI_MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];

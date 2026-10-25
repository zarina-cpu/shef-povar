const SYSTEM_PROMPT = `Ты домашний шеф. Придумываешь одно блюдо только из продуктов, которые есть у человека.

Правила:
- Используй только названные продукты плюс соль, перец, вода, растительное масло — если масло не названо, упомяни это как «по желанию».
- Если техника — «все» или «все способы приготовления», можно использовать любой разумный способ: плиту, духовку, микроволновку, блендер и т.д.
- Если техники мало или её нет, не предлагай духовку, плиту, микроволновку или блендер, если их нет в списке.
- Соблюдай тип блюда. Если указано несколько типов через запятую — придумай связное меню или блюдо, которое лучше всего закрывает выбранные категории; в tagline поясни, к какому типу (или типам) оно относится.
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

export function buildPrompt(ingredients, equipment, dishType, avoidTitles = []) {
  const lines = [
    SYSTEM_PROMPT,
    "",
    `Продукты: ${ingredients}`,
    `Техника: ${equipment}`,
    `Тип блюда: ${dishType}`,
  ];
  const rejected = avoidTitles.map((t) => String(t || "").trim()).filter(Boolean);
  if (rejected.length) {
    lines.push(
      "",
      `Пользователю не понравились эти варианты — предложи другое блюдо (другое название, другой способ готовки и подача): ${rejected.join("; ")}.`
    );
  }
  lines.push("Придумай одно блюдо этого типа и верни JSON по схеме.");
  return lines.join("\n");
}

/** Gemini 3.5–3.6 для рецептов: сначала 3.6, затем 3.5 */
export const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
];

const SUGGESTIONS_PROMPT = `Ты домашний шеф. Человек ещё не знает, какие продукты купить, но выбрал тип блюда и технику на кухне.

Предложи 5 разных блюд, которые реально приготовить с указанной техникой.
Если типов несколько — распредели идеи между ними (хотя бы по одному на каждый выбранный тип, если типов не больше трёх).
Для каждого блюда перечисли продукты с понятным количеством на 2–4 порции (граммы, штуки, стаканы, ст. л.).
Блюда должны отличаться друг от друга (разные кухни/стили).
Ответ — только JSON без markdown.

Схема:
{
  "intro": "string, 1–2 предложения дружелюбно объясни что ниже",
  "dishes": [
    {
      "title": "string",
      "tagline": "string, коротко почему подходит",
      "timeMinutes": number,
      "ingredients": [{ "name": "string", "amount": "string" }]
    }
  ]
}`;

export function buildSuggestionsPrompt(equipment, dishType) {
  return [
    SUGGESTIONS_PROMPT,
    "",
    `Техника: ${equipment}`,
    `Тип блюда: ${dishType}`,
    "Верни ровно 5 блюд в массиве dishes.",
  ].join("\n");
}

export function parseSuggestions(text) {
  const data = extractJson(text);
  const intro = asText(data.intro, "Вот идеи — купите продукты из списка и вернитесь за рецептом.");

  const dishes = Array.isArray(data.dishes)
    ? data.dishes
        .map((item) => {
          const title = asText(item?.title);
          if (!title) {
            return null;
          }
          const ingredients = Array.isArray(item.ingredients)
            ? item.ingredients
                .map((row) => ({
                  name: asText(row?.name),
                  amount: asText(row?.amount),
                }))
                .filter((row) => row.name && row.amount)
            : [];
          if (ingredients.length === 0) {
            return null;
          }
          return {
            title,
            tagline: asText(item?.tagline),
            timeMinutes: Math.max(1, asNumber(item?.timeMinutes, 30)),
            ingredients,
          };
        })
        .filter(Boolean)
    : [];

  if (dishes.length === 0) {
    throw new Error("В ответе нет списка блюд");
  }

  return { intro, dishes: dishes.slice(0, 6) };
}

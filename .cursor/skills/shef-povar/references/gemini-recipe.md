# Контракт рецепта (Gemini)

## Тело запроса

```json
{ "ingredients": "строка", "equipment": "строка", "dishType": "строка" }
```

`equipment` собирается из чипов и доп. поля через `resolveEquipment`. Чип «все» означает любой способ приготовления. `dishType` — подпись выбранной категории.

## Ответ модели (JSON)

```json
{
  "title": "string",
  "tagline": "string",
  "servings": 2,
  "timeMinutes": 30,
  "caloriesPerServing": 400,
  "caloriesTotal": 800,
  "usedIngredients": [{ "name": "...", "amount": "..." }],
  "steps": [{ "n": 1, "text": "..." }],
  "tips": "string"
}
```

## Правила промпта (смысл)

- Только названные продукты + соль/перец/вода/масло «по желанию».
- Техника строго из ввода пользователя.
- «Плохие» остатки — только с термообработкой.
- Калории — оценка, не лабораторная точность.
- Язык интерфейса и рецепта — русский.

## Модели (fallback)

`gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-flash-latest` — перебор в `route.js`.

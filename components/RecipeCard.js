"use client";

export default function RecipeCard({
  recipe,
  dishTypeLabel,
  want,
  cooked,
  comments,
  saved,
  onWant,
  onCooked,
  onComments,
  onSave,
}) {
  if (!recipe) {
    return null;
  }

  return (
    <article className="recipe">
      <h2>{recipe.title}</h2>
      {recipe.tagline ? <p className="tagline">{recipe.tagline}</p> : null}
      {dishTypeLabel ? <p className="recipe-kind">{dishTypeLabel}</p> : null}

      <div className="meta">
        <div className="meta-time">
          <strong>{recipe.timeMinutes} мин</strong>
          <span>время</span>
        </div>
        <div>
          <strong>{recipe.servings}</strong>
          <span>порции</span>
        </div>
        <div className="meta-cals">
          <strong>{recipe.caloriesPerServing} ккал</strong>
          <span>на порцию · {recipe.caloriesTotal} всего</span>
        </div>
      </div>

      {recipe.usedIngredients?.length ? (
        <ul className="ingredients">
          {recipe.usedIngredients.map((item) => (
            <li key={`${item.name}-${item.amount}`}>
              <span>{item.name}</span>
              <span>{item.amount}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <ol className="steps">
        {recipe.steps.map((step) => (
          <li key={step.n}>
            <b>{String(step.n).padStart(2, "0")}</b>
            <span>{step.text}</span>
          </li>
        ))}
      </ol>

      {recipe.tips ? <p className="tips">{recipe.tips}</p> : null}

      <div className="recipe-actions">
        <div className="status-toggles">
          <button
            type="button"
            className="chip chip-want"
            aria-pressed={want}
            onClick={onWant}
          >
            Хочу приготовить
          </button>
          <button
            type="button"
            className="chip chip-cooked"
            aria-pressed={cooked}
            onClick={onCooked}
          >
            Готовила
          </button>
        </div>

        <label className="field notes-field">
          <span>Мои комментарии к рецепту</span>
          <textarea
            rows={4}
            value={comments}
            onChange={(event) => onComments(event.target.value)}
            placeholder="Заметки, замены продуктов, что изменить в шагах"
          />
        </label>

        <button className="save" type="button" onClick={onSave}>
          {saved ? "Рецепт сохранён" : "Сохранить рецепт"}
        </button>
      </div>
    </article>
  );
}

"use client";

export default function DishSuggestions({ intro, dishes, loading, onCook }) {
  if (loading) {
    return null;
  }
  if (!dishes?.length) {
    return null;
  }

  return (
    <section className="suggestions panel" aria-labelledby="suggestions-title">
      <h2 id="suggestions-title">Идеи блюд</h2>
      {intro ? <p className="suggestions-intro">{intro}</p> : null}
      <ul className="suggestions-list">
        {dishes.map((dish) => (
          <li key={dish.title} className="suggestion-card">
            <div className="suggestion-head">
              <h3>{dish.title}</h3>
              {dish.timeMinutes ? (
                <span className="suggestion-time">~{dish.timeMinutes} мин</span>
              ) : null}
            </div>
            {dish.tagline ? <p className="suggestion-tagline">{dish.tagline}</p> : null}
            <p className="suggestion-label">Что купить:</p>
            <ul className="suggestion-ingredients">
              {dish.ingredients.map((item) => (
                <li key={`${dish.title}-${item.name}`}>
                  <span>{item.name}</span>
                  <span>{item.amount}</span>
                </li>
              ))}
            </ul>
            <button className="auth-secondary suggestion-cook" type="button" onClick={() => onCook(dish)}>
              Собрать рецепт из этого списка
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

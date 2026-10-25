"use client";

export default function SavedRecipes({ items, onOpen, onRemove }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="saved">
      <h3>Сохранённые рецепты</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" className="saved-open" onClick={() => onOpen(item)}>
              <strong>{item.recipe.title}</strong>
              <span>
                {[item.dishTypeLabel, item.want && "хочу", item.cooked && "готовила"]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </button>
            <button type="button" className="saved-remove" onClick={() => onRemove(item.id)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

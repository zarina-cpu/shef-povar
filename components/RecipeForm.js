"use client";

const PRESETS = [
  { id: "all", label: "все" },
  { id: "microwave", label: "микроволновка" },
  { id: "oven", label: "духовка" },
  { id: "stove", label: "плита" },
  { id: "none", label: "без техники" },
];

export const DISH_TYPES = [
  { id: "first", label: "первые блюда" },
  { id: "second", label: "вторые блюда" },
  { id: "dessert", label: "десерт" },
  { id: "drinks", label: "напитки" },
  { id: "salads", label: "салаты" },
];

export default function RecipeForm({
  ingredients,
  setIngredients,
  selected,
  setSelected,
  extraEquipment,
  setExtraEquipment,
  dishType,
  setDishType,
  loading,
  onSubmit,
}) {
  function togglePreset(id) {
    setSelected((current) => {
      if (id === "all") {
        return current.includes("all") ? [] : ["all"];
      }
      if (id === "none") {
        return current.includes("none") ? [] : ["none"];
      }
      const withoutExclusive = current.filter((item) => item !== "none" && item !== "all");
      return withoutExclusive.includes(id)
        ? withoutExclusive.filter((item) => item !== id)
        : [...withoutExclusive, id];
    });
  }

  return (
    <form className="panel" onSubmit={onSubmit}>
      <label className="field">
        <span>Что есть дома</span>
        <textarea
          rows={5}
          value={ingredients}
          onChange={(event) => setIngredients(event.target.value)}
          placeholder="Напишите продукты, которые есть дома — например: куриное филе, сыр, помидор"
        />
        <p className="field-hint">
          Можно оставить пустым: выберите технику и тип блюда — шеф предложит идеи и список
          продуктов с количеством.
        </p>
      </label>

      <div className="field">
        <span>Какая техника есть</span>
        <div className="chips">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="chip"
              aria-pressed={selected.includes(preset.id)}
              onClick={() => togglePreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Ещё техника, если нужно</span>
        <input
          className="extra-input"
          value={extraEquipment}
          onChange={(event) => setExtraEquipment(event.target.value)}
          placeholder="мультиварка, сковорода, блендер"
        />
      </label>

      <div className="field">
        <span>Тип блюда</span>
        <div className="chips">
          {DISH_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              className="chip"
              aria-pressed={dishType === type.id}
              onClick={() => setDishType(type.id)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <button className="submit" type="submit" disabled={loading}>
        {loading
          ? "Шеф думает…"
          : ingredients.trim()
            ? "Придумать ужин"
            : "Подобрать идеи блюд"}
      </button>
    </form>
  );
}

export function resolveEquipment(selected, extraEquipment) {
  if (selected.includes("all")) {
    const extra = extraEquipment.trim();
    return [
      "все способы приготовления: плита, духовка, микроволновка и любая другая техника",
      extra,
    ]
      .filter(Boolean)
      .join(", ");
  }

  const labels = PRESETS.filter((preset) => selected.includes(preset.id)).map(
    (preset) => preset.label
  );
  const extra = extraEquipment.trim();
  return [...labels, extra].filter(Boolean).join(", ");
}

export function resolveDishType(dishType) {
  return DISH_TYPES.find((type) => type.id === dishType)?.label || "";
}

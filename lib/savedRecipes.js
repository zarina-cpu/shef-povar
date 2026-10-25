/** Старый общий ключ — только миграция в «гость», не в аккаунты */
const LEGACY_KEY = "shef-saved-recipes";

export function savedRecipesStorageKey(userId) {
  if (userId) {
    return `shef-saved-recipes:user:${userId}`;
  }
  return "shef-saved-recipes:guest";
}

export function loadSavedRecipes(userId = null) {
  if (typeof window === "undefined") {
    return [];
  }

  const key = savedRecipesStorageKey(userId);

  try {
    let raw = window.localStorage.getItem(key);
    if (raw === null && userId == null) {
      const legacy = window.localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        window.localStorage.setItem(key, legacy);
        window.localStorage.removeItem(LEGACY_KEY);
        raw = legacy;
      }
    }
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeSavedRecipes(items, userId = null) {
  const key = savedRecipesStorageKey(userId);
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function upsertSavedRecipe(entry, current) {
  const without = current.filter((item) => item.id !== entry.id);
  return [entry, ...without];
}

export function makeRecipeId() {
  return `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
